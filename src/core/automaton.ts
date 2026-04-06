import * as AutomatonGetters from "./automatonGetters";
import type { AutomatonState, EdgeHistory } from "./automatonState";
import { buildKanaNode } from "./builderKanaGraph";
import { StrokeEdge, StrokeNode, buildStrokeNode } from "./builderStrokeGraph";
import { type CommitResult, type CommittedStroke, StrokeCommitter } from "./committer";
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
    this.committer = new StrokeCommitter();
    this.backspaceEdges = rule.backspaceStrokes.map(
      (stroke) => new StrokeEdge(stroke, this.startNode, this.backspaceSentinel),
    );
  }
  currentNode: StrokeNode;
  /** 入力成功して遷移した履歴 */
  edgeHistories: EdgeHistory[] = [];
  /** 現在のノード入力中に失敗した入力イベント。次のノードに遷移するとリセットされる */
  failedEventsAtCurrentNode: InputEvent[] = [];
  /**
   * 現在のノード入力中に発動した backspace イベント。
   * 次のノードに遷移するとき EdgeHistory.backspaceEvents に転記される。
   */
  backspaceEventsAtCurrentNode: InputEvent[] = [];
  /** 時間方向の判断を担う Committer */
  private readonly committer: StrokeCommitter;
  /** backspace edge の遷移先を示す sentinel node (通常ノードと区別するため) */
  private readonly backspaceSentinel = new StrokeNode(-1, [], []);
  /** Rule.backspaceStrokes から生成した仮想 StrokeEdge 群 */
  private readonly backspaceEdges: readonly StrokeEdge[];
  /**
   * 現在押下されていてまだ打鍵として確定していないキー集合 (可視化用)。
   * 例: SimultaneousStroke の partial 状態で W だけ押されているとき [W] を返す。
   */
  get pendingKeys(): readonly VirtualKey[] {
    return this.committer.pendingKeys;
  }
  /** 現在ノードの nextEdges に backspace edge を結合した配列 */
  private get currentEdges(): readonly StrokeEdge[] {
    return [...this.currentNode.nextEdges, ...this.backspaceEdges];
  }
  /**
   * 入力状態をリセットする
   */
  reset(): void {
    this.currentNode = this.startNode;
    this.edgeHistories = [];
    this.failedEventsAtCurrentNode = [];
    this.backspaceEventsAtCurrentNode = [];
    this.committer.reset();
  }
  /**
   * 1 stroke 分の入力を戻す
   */
  back(): void {
    if (this.currentNode !== this.startNode) {
      const history = this.edgeHistories.pop();
      if (history) {
        this.currentNode = history.previousEdge.previous;
      }
    }
    this.failedEventsAtCurrentNode = [];
    this.backspaceEventsAtCurrentNode = [];
    this.committer.reset();
  }

  /**
   * 状態遷移せずに、入力が成功するかどうかをテストする
   *
   * @returns [result, apply] result: 入力結果, apply: 状態遷移を適用する関数
   */
  testInput(stroke: InputEvent): [InputResult, () => void] {
    const result = this.committer.dryRun(stroke, this.currentEdges, this.rule);
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
   * Rule.backspaceStrokes は仮想 StrokeEdge として currentNode.nextEdges に結合され、
   * StrokeCommitter の既存の優先度ロジック (modMatched vs otherMatched の keyCount 比較)
   * で通常エントリと同列に評価される。committed 結果が backspace edge であれば BACK を返す。
   *
   * backspace 発動時の「復旧ロジック」(failedInputs を pop する、automaton.back() を
   * 呼ぶ等) は呼び出し側の責務。Automaton は InputResult.BACK を返すことで通知するのみ。
   */
  input(stroke: InputEvent): InputResult {
    const result = this.committer.feed(stroke, this.currentEdges, this.rule);
    switch (result.type) {
      case "committed":
        if (result.stroke.edge.next === this.backspaceSentinel) {
          this.backspaceEventsAtCurrentNode.push(stroke);
          return InputResult.BACK;
        }
        return this.consume(result.stroke);
      case "pending":
        return InputResult.PENDING;
      case "failed":
        this.failedEventsAtCurrentNode.push(result.event);
        return InputResult.FAILED;
      case "ignored":
        return InputResult.IGNORED;
    }
  }

  /**
   * CommitResult を副作用なしに InputResult へ変換する (testInput 用)。
   */
  private resultToInputResult(result: CommitResult): InputResult {
    switch (result.type) {
      case "committed":
        if (result.stroke.edge.next === this.backspaceSentinel) {
          return InputResult.BACK;
        }
        return this.edgeToResultType(this.currentNode.kanaIndex, result.stroke.edge);
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
    this.edgeHistories.push({
      event: committed.triggerEvent,
      previousEdge: edge,
      failedEvents: this.failedEventsAtCurrentNode,
      backspaceEvents: this.backspaceEventsAtCurrentNode,
    });
    this.currentNode = edge.next;
    this.failedEventsAtCurrentNode = [];
    this.backspaceEventsAtCurrentNode = [];
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
   *     return (state.edgeHistories.length / duration) * 60000;
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
   * 1打目の入力時刻
   */
  getFirstInputTime(state: AutomatonState): Date {
    return AutomatonGetters.getFirstInputTime(state);
  },

  /**
   * 最後の入力時刻
   */
  getLastInputTime(state: AutomatonState): Date {
    return AutomatonGetters.getLastInputTime(state);
  },

  /**
   * ミス入力数の合計
   */
  getFailedInputCount(state: AutomatonState): number {
    return AutomatonGetters.getFailedInputCount(state);
  },

  /**
   * ミス入力も含めた打鍵数の合計
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
  getFailedInputCount(): number;
  getTotalInputCount(): number;
  isFinished(): boolean;
};
