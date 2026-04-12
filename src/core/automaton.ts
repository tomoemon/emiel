import type { AutomatonState, HistoryEntry } from "./automatonState";
import type { StrokeEdge, StrokeNode } from "./builderStrokeGraph";
import {
  type BackspaceAwareResult,
  BackspaceAwareCommitter,
  type CommittedStroke,
} from "./committer";
import type { InputEvent } from "./inputEvent";
import { InputResult } from "./inputResult";
import type { Rule, RulePrimitive } from "./rule";
import type { VirtualKey } from "./virtualKey";

export class AutomatonImpl implements AutomatonState {
  /**
   * @param word かな文字列（配列定義 Rule で使用可能な文字で構成される文字列）
   * @param startNode 打鍵を受け付ける開始ノード
   * @param rule このAutomatonを生成した入力ルール
   * @param rulesByKanaIndex 各 kanaIndex で入力を始めるエントリを寄与した primitive 集合
   */
  constructor(
    readonly word: string,
    readonly startNode: StrokeNode,
    readonly rule: Rule,
    private readonly rulesByKanaIndex: readonly (readonly RulePrimitive[])[],
  ) {
    this.currentNode = startNode;
    this.committer = new BackspaceAwareCommitter(rule.backspaceStrokes);
  }

  /**
   * 現在の入力位置 (currentNode.kanaIndex) で入力対象となっている primitive の集合を返す。
   * 合成された Rule では、この位置から入力を始めるエントリを提供した primitive が
   * 合成順で列挙される。候補がない位置 (ワード完了後など) では空配列。
   */
  getCurrentOriginRules(): readonly RulePrimitive[] {
    return this.rulesByKanaIndex[this.currentNode.kanaIndex] ?? [];
  }
  /** 現在の入力位置を表すノード。入力が進むと次のノードに遷移し、back() で前のノードに戻る。 */
  currentNode: StrokeNode;
  /**
   * すべての入力イベントと back() 操作の時系列ログ。
   * input() の結果（IGNORED, PENDING 含む）と back() の BackHistoryEntry が記録される。
   *
   * 有効な遷移 edge の取得: build 後の Automaton で automaton.getEffectiveEdges()
   * 失敗イベントの抽出: inputHistory.filter(e => !("back" in e) && e.result.isFailed)
   */
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
   * 入力状態をリセットする。
   * currentNode を startNode に戻し、inputHistory を空にする。
   * ワードを最初から入力し直す場合に使用する。
   */
  reset(): void {
    this.currentNode = this.startNode;
    this.inputHistory = [];
    this.committer.reset();
  }
  /**
   * 直前の成功遷移を1つ取り消し、currentNode を遷移前のノードに戻す。
   * inputHistory に BackHistoryEntry を追記する（履歴は削除しない）。
   * startNode にいる場合は何もしない。
   *
   * 実装: inputHistory を末尾から逆順に走査し、既出の back() で取り消し済みの
   * 成功 edge を skip しながら、最初に見つかった未取り消しの成功 edge を取り消す。
   */
  back(): void {
    if (this.currentNode === this.startNode) return;
    let skip = 0;
    for (let i = this.inputHistory.length - 1; i >= 0; i--) {
      const entry = this.inputHistory[i];
      if ("back" in entry) {
        skip++;
        continue;
      }
      if (entry.edge) {
        if (skip > 0) {
          skip--;
          continue;
        }
        this.inputHistory.push({ back: true, undoneEdge: entry.edge });
        this.currentNode = entry.edge.previous;
        break;
      }
    }
    this.committer.reset();
  }

  /**
   * 状態遷移せずに、入力が成功するかどうかをテストする。
   * apply() を呼ぶまで inputHistory や currentNode は変更されない。
   *
   * ```
   * const [result, apply] = automaton.testInput(event);
   * if (result.isFailed) {
   *   // ミス表示等の処理
   * }
   * apply(); // ここで初めて状態が変わる
   * ```
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
   * @example
   * ```typescript
   * const extended = automaton.with({
   *   getProgress: (state) => (state.currentNode.kanaIndex / state.word.length) * 100,
   * });
   * console.log(extended.getProgress()); // number
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
