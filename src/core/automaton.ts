import { InputEvent, RuleStroke } from "./ruleStroke";
import { StrokeEdge, StrokeNode } from "./builderStrokeGraph";

export class InputResult {
  constructor(
    private readonly type:
      | "ignored" // modifier キーの単独入力等で無視された
      | "failed" // 入力ミス
      | "key_succeeded" // 1打鍵の成功
      | "kana_succeeded" // かな1文字の成功
      | "finished" // 完了
  ) { }

  static readonly IGNORED = new InputResult("ignored");
  static readonly FAILED = new InputResult("failed");
  static readonly KEY_SUCCEEDED = new InputResult("key_succeeded");
  static readonly KANA_SUCCEEDED = new InputResult("kana_succeeded");
  static readonly FINISHED = new InputResult("finished");

  toString(): string {
    return this.type;
  }
  // 今回の打鍵が無視されたかどうか（シフトキー等のモディファイアキーの単独入力の場合）
  get isIgnored(): boolean {
    return this.type === "ignored";
  }
  // 今回の1打鍵が入力ミスだったかどうか
  get isFailed(): boolean {
    return this.type === "failed";
  }
  // 今回の入力に成功したかどうか
  get isSucceeded(): boolean {
    return (
      this.type === "key_succeeded" ||
      this.type === "kana_succeeded" ||
      this.type === "finished"
    );
  }
  // isSucceeded:true の場合の詳細な情報: 今回の1打鍵でかな1文字分の遷移はしていない
  get isKeySucceeded(): boolean {
    return this.type === "key_succeeded";
  }
  // isSucceeded:true の場合の詳細な情報: 今回の1打鍵でかな1文字分以上の遷移をした
  get isKanaSucceeded(): boolean {
    return this.type === "kana_succeeded";
  }
  // isSucceeded:true の場合の詳細な情報: 今回の1打鍵でワードの入力が完了した
  get isFinished(): boolean {
    return this.type === "finished";
  }
}


export class Automaton {
  private _currentNode: StrokeNode;
  private _succeededInputs: {
    event: InputEvent;
    lastEdge: StrokeEdge;
  }[] = [];
  /**
   * @param word かな文字列（配列定義 Rule で使用可能な文字で構成される文字列）
   * @param startNode 打鍵を受け付ける開始ノード
   */
  constructor(readonly word: string, readonly startNode: StrokeNode) {
    this._currentNode = startNode;
  }
  // 入力が完了したかな文字列
  get finishedWord(): string {
    return this.word.substring(0, this._currentNode.kanaIndex);
  }
  // 入力が完了していないかな文字列
  get pendingWord(): string {
    return this.word.substring(this._currentNode.kanaIndex);
  }
  get finishedRoman(): string {
    return this.succeededInputs.map((v) => v.matchedStroke.romanChar).join("");
  }
  get pendingRoman(): string {
    return this.shortestPendingStrokes.map((v) => v.romanChar).join("");
  }
  /**
   * 現在の入力状態から最短ストローク数で打ち切れるストローク列を返す
   */
  get shortestPendingStrokes(): RuleStroke[] {
    let node = this.currentNode;
    const result: RuleStroke[] = [];
    while (node.nextEdges.length > 0) {
      result.push(node.nextEdges[0].input);
      node = node.nextEdges[0].next;
    }
    return result;
  }
  /**
   * 入力状態をリセットする
   */
  reset(): void {
    this._currentNode = this.startNode;
    this._succeededInputs = [];
  }
  get currentNode(): StrokeNode {
    return this._currentNode;
  }
  get succeededInputs(): {
    event: InputEvent;
    matchedStroke: RuleStroke;
  }[] {
    return this._succeededInputs.map((v) => ({
      event: v.event,
      matchedStroke: v.lastEdge.input,
    }));
  }
  /**
   * 1 stroke 分の入力を戻す
   */
  back(): void {
    if (this._currentNode !== this.startNode) {
      const history = this._succeededInputs.pop();
      if (history) {
        this._currentNode = history.lastEdge.previous;
      }
    }
  }
  get isFinished(): boolean {
    return this._currentNode.nextEdges.length === 0;
  }
  /**
   * 状態遷移せずに、入力が成功するかどうかをテストする
   */
  testInput(stroke: InputEvent): {
    result: InputResult;
    acceptedEdge: StrokeEdge | undefined;
  } {
    const lastKanaIndex = this._currentNode.kanaIndex;
    const acceptedEdges = this._currentNode.nextEdges.filter(
      (edge) => stroke.match(edge) === "matched"
    );
    if (acceptedEdges.length > 0) {
      const acceptedEdge = acceptedEdges[0];
      if (lastKanaIndex < acceptedEdge.next.kanaIndex) {
        if (acceptedEdge.next.nextEdges.length === 0) {
          return {
            result: InputResult.FINISHED,
            acceptedEdge: acceptedEdge,
          };
        }
        return {
          result: InputResult.KANA_SUCCEEDED,
          acceptedEdge: acceptedEdge,
        };
      }
      return {
        result: InputResult.KEY_SUCCEEDED,
        acceptedEdge: acceptedEdge,
      };
    }
    // ローマ字入力における Shift キーの単独押下などの場合は無視する
    const ignoredEdges = this._currentNode.nextEdges.filter(
      (edge) => stroke.match(edge) === "ignored"
    );
    if (ignoredEdges.length > 0) {
      return { result: InputResult.IGNORED, acceptedEdge: undefined };
    }
    return { result: InputResult.FAILED, acceptedEdge: undefined };
  }
  /**
   * キー入力して状態遷移し、入力が成功するかどうかを返す
   */
  input(stroke: InputEvent): InputResult {
    const { result, acceptedEdge } = this.testInput(stroke);
    this.applyState(stroke, result, acceptedEdge);
    return result;
  }
  /**
   * testInput の結果を適用して内部の状態を変更する
   */
  protected applyState(
    stroke: InputEvent,
    result: InputResult,
    acceptedEdge: StrokeEdge | undefined
  ) {
    if (result.isSucceeded) {
      this._succeededInputs.push({
        event: stroke,
        lastEdge: acceptedEdge!,
      });
      this._currentNode = acceptedEdge!.next;
    }
  }
}
