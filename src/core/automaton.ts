import * as AutomatonGetters from "./automatonGetters";
import type { AutomatonState, HistoryEntry } from "./automatonState";
import { buildKanaNode } from "./builderKanaGraph";
import { type StrokeEdge, type StrokeNode, buildStrokeNode } from "./builderStrokeGraph";
import {
  type BackspaceAwareResult,
  BackspaceAwareCommitter,
  type CommittedStroke,
} from "./committer";
import type { InputEvent } from "./inputEvent";
import { InputResult } from "./inputResult";
import type { Rule } from "./rule";
import type { RuleStroke } from "./ruleStroke";
import type { VirtualKey } from "./virtualKey";

export class AutomatonImpl implements AutomatonState {
  /**
   * @param word かな文字列（配列定義 Rule で使用可能な文字で構成される文字列）
   * @param startNode 打鍵を受け付ける開始ノード
   * @param rule このAutomatonを生成した入力ルール
   */
  constructor(
    readonly word: string,
    readonly startNode: StrokeNode,
    readonly rule: Rule,
  ) {
    this.currentNode = startNode;
    this.committer = new BackspaceAwareCommitter(rule.backspaceStrokes);
  }
  currentNode: StrokeNode;
  inputHistory: HistoryEntry[] = [];
  /** 時間方向の判断を担う Committer */
  private readonly committer: BackspaceAwareCommitter;
  /**
   * 現在押下されていてまだ打鍵として確定していないキー集合 (可視化用)。
   * 例: SimultaneousStroke の partial 状態で W だけ押されているとき [W] を返す。
   */
  get pendingKeys(): readonly VirtualKey[] {
    return this.committer.pendingKeys;
  }
  /**
   * 入力状態をリセットする
   */
  reset(): void {
    this.currentNode = this.startNode;
    this.inputHistory = [];
    this.committer.reset();
  }
  /**
   * 1 stroke 分の入力を戻す
   */
  back(): void {
    if (this.currentNode === this.startNode) return;
    const effectiveEdges = AutomatonGetters.getEffectiveEdges(this);
    const lastEdge = effectiveEdges[effectiveEdges.length - 1];
    if (lastEdge) {
      this.inputHistory.push({ back: true, undoneEdge: lastEdge });
      this.currentNode = lastEdge.previous;
    }
    this.committer.reset();
  }

  /**
   * 状態遷移せずに、入力が成功するかどうかをテストする
   *
   * @returns [result, apply] result: 入力結果, apply: 状態遷移を適用する関数
   */
  testInput(stroke: InputEvent): [InputResult, () => void] {
    const result = this.committer.dryRun(stroke, this.currentNode.nextEdges, this.rule);
    return [
      this.resultToInputResult(result),
      () => {
        this.input(stroke);
      },
    ];
  }

  /**
   * キー入力して状態遷移し、入力が成功したかどうかを返す。
   *
   * すべての入力結果（IGNORED, PENDING 含む）が inputHistory に記録される。
   *
   * backspace 発動時の「復旧ロジック」(automaton.back() を呼ぶ等) は呼び出し側の責務。
   * Automaton は InputResult.BACK を返すことで通知するのみ。
   */
  input(stroke: InputEvent): InputResult {
    const result = this.committer.feed(stroke, this.currentNode.nextEdges, this.rule);
    switch (result.type) {
      case "committed": {
        const inputResult = this.consume(result.stroke);
        this.inputHistory.push({
          event: result.stroke.triggerEvent,
          result: inputResult,
          edge: result.stroke.edge,
        });
        return inputResult;
      }
      case "backspace":
        this.inputHistory.push({ event: stroke, result: InputResult.BACK });
        return InputResult.BACK;
      case "pending":
        this.inputHistory.push({ event: stroke, result: InputResult.PENDING });
        return InputResult.PENDING;
      case "failed":
        this.inputHistory.push({ event: result.event, result: InputResult.FAILED });
        return InputResult.FAILED;
      case "ignored":
        this.inputHistory.push({ event: stroke, result: InputResult.IGNORED });
        return InputResult.IGNORED;
    }
  }

  /**
   * CommitResult を副作用なしに InputResult へ変換する (testInput 用)。
   */
  private resultToInputResult(result: BackspaceAwareResult): InputResult {
    switch (result.type) {
      case "committed":
        return this.edgeToResultType(this.currentNode.kanaIndex, result.stroke.edge);
      case "backspace":
        return InputResult.BACK;
      case "pending":
        return InputResult.PENDING;
      case "failed":
        return InputResult.FAILED;
      case "ignored":
        return InputResult.IGNORED;
    }
  }

  /**
   * 確定したストロークを Automaton の状態に反映する。
   */
  private consume(committed: CommittedStroke): InputResult {
    const edge = committed.edge;
    const resultType = this.edgeToResultType(this.currentNode.kanaIndex, edge);
    this.currentNode = edge.next;
    return resultType;
  }

  private edgeToResultType(currentKanaIndex: number, acceptedEdge: StrokeEdge): InputResult {
    if (currentKanaIndex < acceptedEdge.next.kanaIndex) {
      if (acceptedEdge.next.nextEdges.length === 0) {
        return InputResult.FINISHED;
      }
      return InputResult.KANA_SUCCEEDED;
    }
    return InputResult.KEY_SUCCEEDED;
  }

  /**
   * 拡張メソッドを追加して Automaton の Proxy を返す
   *
   * 参照系の関数はいくらでも追加する可能性があるため、Automaton 自体に持たせるのではなく、
   * 利用者側の必要に応じて拡張してもらえるようにする。
   * state の情報を取得するだけでなく、
   * クロージャで Automaton に任意の情報を付加して、あとから参照することも可能。
   * (automaton.test.ts 参照)
   *
   * @example
   * ```typescript
   * const extended = automaton.with({
   *   getProgress: (state) => (state.currentNode.kanaIndex / state.word.length) * 100,
   *   getKPM: (state) => {
   *     const duration = getLastInputTime(state).getTime() - getFirstInputTime(state).getTime();
   *     return (AutomatonGetters.getEffectiveEdges(state).length / duration) * 60000;
   *   }
   * });
   *
   * console.log(extended.getProgress()); // number
   * console.log(extended.getKPM()); // number
   * ```
   */
  with<T extends Record<string, (state: AutomatonState) => unknown>>(
    extension: T,
  ): this & { [K in keyof T]: () => ReturnType<T[K]> } {
    const proxy = new Proxy(this, {
      get: (target, prop) => {
        if (prop in extension) {
          return () => extension[prop as keyof T](this);
        }
        return target[prop as keyof typeof target];
      },
    });
    return proxy as this & { [K in keyof T]: () => ReturnType<T[K]> };
  }
}

export type Automaton = AutomatonImpl & DefaultExtensionType;

export function build(rule: Rule, kanaText: string): Automaton {
  const [_, endKanaNode] = buildKanaNode(rule, kanaText);
  const automaton = new AutomatonImpl(kanaText, buildStrokeNode(endKanaNode), rule);
  return automaton.with(defaultExtension);
}

/**
 * デフォルトの拡張
 */
const defaultExtension = {
  /**
   * 入力が完了したかな文字列
   */
  getFinishedWord(state: AutomatonState): string {
    return AutomatonGetters.getFinishedWord(state);
  },

  /**
   * 入力が完了していないかな文字列
   */
  getPendingWord(state: AutomatonState): string {
    return AutomatonGetters.getPendingWord(state);
  },

  /**
   * 入力が完了したローマ字列(ローマ字系の Rule の場合のみ)
   */
  getFinishedRoman(state: AutomatonState): string {
    return AutomatonGetters.getFinishedRoman(state);
  },

  /**
   * 入力が完了していないローマ字列(ローマ字系の Rule の場合のみ)
   */
  getPendingRoman(state: AutomatonState): string {
    return AutomatonGetters.getPendingRoman(state);
  },

  /**
   * 入力が完了したキーストローク列
   */
  getFinishedStroke(state: AutomatonState): RuleStroke[] {
    return AutomatonGetters.getFinishedStroke(state);
  },

  /**
   * 現在の入力状態から最短ストローク数で打ち切れるストローク列を返す
   */
  getPendingStroke(state: AutomatonState): RuleStroke[] {
    return AutomatonGetters.getPendingStroke(state);
  },

  /**
   * 最初の入力時刻（成功・失敗問わず）
   */
  getFirstInputTime(state: AutomatonState): Date {
    return AutomatonGetters.getFirstInputTime(state);
  },

  /**
   * 最後の入力時刻（成功・失敗問わず）
   */
  getLastInputTime(state: AutomatonState): Date {
    return AutomatonGetters.getLastInputTime(state);
  },

  /**
   * 最初の成功入力時刻
   */
  getFirstSucceededInputTime(state: AutomatonState): Date {
    return AutomatonGetters.getFirstSucceededInputTime(state);
  },

  /**
   * 最後の成功入力時刻
   */
  getLastSucceededInputTime(state: AutomatonState): Date {
    return AutomatonGetters.getLastSucceededInputTime(state);
  },

  /**
   * ミス入力数の合計
   */
  getFailedInputCount(state: AutomatonState): number {
    return AutomatonGetters.getFailedInputCount(state);
  },

  /**
   * 有効な成功打鍵数 + ミス入力数の合計
   */
  getTotalInputCount(state: AutomatonState): number {
    return AutomatonGetters.getTotalInputCount(state);
  },

  /**
   * 入力が完了しているかどうか
   */
  isFinished(state: AutomatonState): boolean {
    return AutomatonGetters.isFinished(state);
  },
} as const;

// デフォルト拡張の型(引数なしバージョン)
export type DefaultExtensionType = {
  getFinishedWord(): string;
  getPendingWord(): string;
  getFinishedRoman(): string;
  getPendingRoman(): string;
  getFinishedStroke(): RuleStroke[];
  getPendingStroke(): RuleStroke[];
  getFirstInputTime(): Date;
  getLastInputTime(): Date;
  getFirstSucceededInputTime(): Date;
  getLastSucceededInputTime(): Date;
  getFailedInputCount(): number;
  getTotalInputCount(): number;
  isFinished(): boolean;
};
