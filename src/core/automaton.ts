import * as AutomatonGetters from "./automatonGetters";
import type { AutomatonState, EdgeHistory } from "./automatonState";
import { buildKanaNode } from "./builderKanaGraph";
import { buildStrokeNode, type StrokeEdge, type StrokeNode } from "./builderStrokeGraph";
import { BackspaceMatcher, type CommittedStroke, StrokeCommitter } from "./committer";
import type { InputEvent } from "./inputEvent";
import { InputResult } from "./inputResult";
import type { Rule } from "./rule";
import type { RuleStroke } from "./ruleStroke";
import type { VirtualKey } from "./virtualKey";

/**
 * Automaton 構築時に渡す任意オプション。
 */
export type AutomatonOptions = {
  /**
   * Rule.backspaceStrokes に一致した入力が発生したときに呼ばれるハンドラ。
   *
   * ハンドラ内では automaton.back() で成功ストロークを巻き戻す、外部で保持している
   * failedInputs 配列を pop する、ミス n 回ごとに 1 回だけ復旧する等、ゲームルールに
   * 応じた任意の復旧ロジックを実装できる。
   *
   * ハンドラ未指定の場合、Rule.backspaceStrokes に一致しても InputResult.IGNORED を返し、
   * 既存の挙動を維持する。
   */
  readonly onBackspace?: (automaton: Automaton) => void;
};

export class AutomatonImpl implements AutomatonState {
  /**
   * @param word かな文字列（配列定義 Rule で使用可能な文字で構成される文字列）
   * @param startNode 打鍵を受け付ける開始ノード
   * @param rule このAutomatonを生成した入力ルール
   * @param options onBackspace などの任意オプション
   */
  constructor(
    readonly word: string,
    readonly startNode: StrokeNode,
    readonly rule: Rule,
    options?: AutomatonOptions,
  ) {
    this.currentNode = startNode;
    this.committer = new StrokeCommitter();
    this.backspaceMatcher = new BackspaceMatcher();
    this.onBackspace = options?.onBackspace;
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
  /** Rule.backspaceStrokes の評価を担うマッチャ */
  private readonly backspaceMatcher: BackspaceMatcher;
  /** backspace 発動時のハンドラ (未指定なら BACK は発火しない) */
  private readonly onBackspace: ((automaton: Automaton) => void) | undefined;
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
    this.edgeHistories = [];
    this.failedEventsAtCurrentNode = [];
    this.backspaceEventsAtCurrentNode = [];
    this.committer.reset();
    this.backspaceMatcher.reset();
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
    this.backspaceMatcher.reset();
  }

  /**
   * 状態遷移せずに、入力が成功するかどうかをテストする
   *
   * @returns [result, apply] result: 入力結果, apply: 状態遷移を適用する関数
   */
  testInput(stroke: InputEvent): [InputResult, () => void] {
    const normalDry = this.committer.dryRun(stroke, this.currentNode, this.rule);
    const bsDry = this.backspaceMatcher.dryRun(stroke, this.rule.backspaceStrokes);
    const result = this.resolveResult(normalDry, bsDry);
    return [
      result,
      () => {
        this.input(stroke);
      },
    ];
  }

  /**
   * キー入力して状態遷移し、入力が成功したかどうかを返す。
   *
   * 判定順序の基本思想:
   * - 通常経路 (StrokeCommitter) が committed / pending を返す場合は通常経路を最優先し、
   *   backspace は発動しない (ルール本体の入力を妨げない)
   * - 通常経路が ignored / failed を返す場合にのみ backspace 判定を優先する
   *   (backspace が一致すれば BACK / PENDING を返し、そうでなければ通常経路の結果を返す)
   *
   * 実装上は両経路に feed し、結果を resolveResult で統合する。
   * これは通常経路が pending を持つ場合も含めて状態整合性を保つため。
   */
  input(stroke: InputEvent): InputResult {
    const normalResult = this.committer.feed(stroke, this.currentNode, this.rule);
    const bsResult = this.backspaceMatcher.feed(stroke, this.rule.backspaceStrokes);

    // 通常経路が確定 → 通常経路を最優先
    if (normalResult.type === "committed") {
      return this.consume(normalResult.stroke);
    }
    if (normalResult.type === "pending") {
      return InputResult.PENDING;
    }

    // 通常経路が ignored / failed のとき、backspace 判定を試す
    if (bsResult.type === "matched") {
      if (this.onBackspace) {
        this.backspaceEventsAtCurrentNode.push(stroke);
        this.onBackspace(this as unknown as Automaton);
        return InputResult.BACK;
      }
      // ハンドラ未指定 → 既存挙動互換 (通常経路の結果を返す)
    }
    if (bsResult.type === "partial") {
      return InputResult.PENDING;
    }

    // 通常経路の結果を採用
    if (normalResult.type === "failed") {
      this.failedEventsAtCurrentNode.push(normalResult.event);
      return InputResult.FAILED;
    }
    return InputResult.IGNORED;
  }

  /**
   * testInput の dryRun 結果を InputResult に変換する。
   * input() の判定ロジックと意味的に同じになるようにする。
   */
  private resolveResult(
    normalDry: ReturnType<StrokeCommitter["dryRun"]>,
    bsDry: ReturnType<typeof this.backspaceMatcher.dryRun>,
  ): InputResult {
    if (normalDry.type === "committed") {
      return this.edgeToResultType(this.currentNode.kanaIndex, normalDry.stroke.edge);
    }
    if (normalDry.type === "pending") {
      return InputResult.PENDING;
    }
    if (bsDry.type === "matched") {
      if (this.onBackspace) {
        return InputResult.BACK;
      }
    }
    if (bsDry.type === "partial") {
      return InputResult.PENDING;
    }
    if (normalDry.type === "failed") {
      return InputResult.FAILED;
    }
    return InputResult.IGNORED;
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

export function build(rule: Rule, kanaText: string, options?: AutomatonOptions): Automaton {
  const [_, endKanaNode] = buildKanaNode(rule, kanaText);
  const automaton = new AutomatonImpl(kanaText, buildStrokeNode(endKanaNode), rule, options);
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
