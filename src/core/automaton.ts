import { StrokeEdge, StrokeNode } from "./builderStrokeGraph";
import { InputEvent, RuleStroke } from "./ruleStroke";

export class InputResult {
  constructor(
    private readonly type:
      | "ignored" // modifier キーの単独入力等で無視された
      | "failed" // 入力ミス
      | "key_succeeded" // 1打鍵の成功
      | "kana_succeeded" // かな1文字の成功
      | "finished" // 完了
      | "staged" // 仮確定状態
  ) { }

  static readonly IGNORED = new InputResult("ignored");
  static readonly FAILED = new InputResult("failed");
  static readonly KEY_SUCCEEDED = new InputResult("key_succeeded");
  static readonly KANA_SUCCEEDED = new InputResult("kana_succeeded");
  static readonly FINISHED = new InputResult("finished");
  static readonly STAGED = new InputResult("staged");

  toString(): string {
    return this.type;
  }
  // 今回の打鍵が無視されたかどうか（シフトキー等のモディファイアキーの単独入力の場合）
  get isIgnored(): boolean {
    return this.type === "ignored";
  }
  get isStaged(): boolean {
    return this.type === "staged";
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

type edgeHistory = {
  // 遷移のきっかけになった成功した入力イベント
  event: InputEvent;
  // 今回の遷移で利用されたエッジ（この Edge をたどると startNode まで戻れる）
  previousEdge: StrokeEdge;
  // 今回の遷移に成功するまでに失敗した入力イベント
  // failedEvents[0], failedEvents[1], ..., event(入力成功) という時系列
  failedEvents: InputEvent[];
};

export class Automaton {
  /**
   * @param word かな文字列（配列定義 Rule で使用可能な文字で構成される文字列）
   * @param startNode 打鍵を受け付ける開始ノード
   */
  constructor(readonly word: string, readonly startNode: StrokeNode) {
    this._currentNode = startNode;
  }
  private _currentNode: StrokeNode;
  /** 入力成功して遷移した履歴 */
  private _edgeHistories: edgeHistory[] = [];
  /** 現在のノード入力中に失敗した入力イベント。次のノードに遷移するとリセットされる */
  private _failedEventsAtCurrentNode: InputEvent[] = [];
  /**
   * 入力が完了したかな文字列
   */
  get finishedWord(): string {
    return this.word.substring(0, this._currentNode.kanaIndex);
  }
  /**
   * 入力が完了していないかな文字列
   */
  get pendingWord(): string {
    return this.word.substring(this._currentNode.kanaIndex);
  }
  /**
   * 入力が完了したローマ字列（ローマ字系の Rule の場合のみ）
   */
  get finishedRoman(): string {
    return this._edgeHistories.map((v) => v.previousEdge.input.romanChar).join("");
  }
  /**
   * 入力が完了していないローマ字列（ローマ字系の Rule の場合のみ）
   */
  get pendingRoman(): string {
    return this.pendingStroke.map((v) => v.romanChar).join("");
  }
  /**
   * 入力が完了したキーストローク列
   */
  get finishedStroke(): RuleStroke[] {
    return this._edgeHistories.map((v) => v.previousEdge.input);
  }
  /**
   * 現在の入力状態から最短ストローク数で打ち切れるストローク列を返す
   */
  get pendingStroke(): RuleStroke[] {
    let node = this.currentNode;
    const result: RuleStroke[] = [];
    while (node.nextEdges.length > 0) {
      result.push(node.nextEdges[0].input);
      node = node.nextEdges[0].next;
    }
    return result;
  }
  /**
   * 入力履歴
   */
  get histories(): edgeHistory[] {
    return this._edgeHistories;
  }
  /**
   * 1打目の入力時刻
   */
  get firstInputTime(): Date {
    return this._edgeHistories[0].event.timestamp;
  }
  /**
   * 最後の入力時刻
   */
  get lastInputTime(): Date {
    return this._edgeHistories[this._edgeHistories.length - 1].event.timestamp;
  }
  /**
   * ミス入力数の合計
   */
  get failedInputCount(): number {
    return this._failedEventsAtCurrentNode.length + this._edgeHistories.reduce((acc, v) => acc + v.failedEvents.length, 0);
  }
  /**
   * ミス入力も含めた打鍵数の合計
   */
  get totalInputCount(): number {
    return this._failedEventsAtCurrentNode.length + this._edgeHistories.reduce((acc, v) => acc + v.failedEvents.length, 0) + this._edgeHistories.length;
  }
  /**
   * 入力状態をリセットする
   */
  reset(): void {
    this._currentNode = this.startNode;
    this._edgeHistories = [];
    this._failedEventsAtCurrentNode = [];
  }
  get currentNode(): StrokeNode {
    return this._currentNode;
  }
  /**
   * 1 stroke 分の入力を戻す
   */
  back(): void {
    if (this._currentNode !== this.startNode) {
      const history = this._edgeHistories.pop();
      if (history) {
        this._currentNode = history.previousEdge.previous;
      }
    }
    this._failedEventsAtCurrentNode = [];
  }
  /**
   * 入力が完了しているかどうか
   */
  get isFinished(): boolean {
    return this._currentNode.nextEdges.length === 0;
  }

  /**
   * 仮確定状態のエッジ、または入力イベント
   */
  private stagedEdge: StrokeEdge | InputEvent | undefined = undefined;
  /**
   * 状態遷移せずに、入力が成功するかどうかをテストする
   * 
   * @returns [result, apply] result: 入力結果, apply: 状態遷移を適用する関数
   */
  testInput(stroke: InputEvent): [
    InputResult,
    () => void
  ] {
    if (stroke.input.type === "keyup") {
      // 仮確定状態があるときに keyup が発生したら、それを確定させる
      if (this.stagedEdge) {
        if (this.stagedEdge instanceof StrokeEdge) {
          const acceptedEdge = this.stagedEdge;
          const resultType = this.edgeToResultType(this._currentNode.kanaIndex, acceptedEdge);
          return [
            resultType,
            () => {
              this.applyState(stroke, resultType, acceptedEdge);
            }
          ];
        }
        return [
          InputResult.FAILED,
          () => {
            this.applyState(stroke, InputResult.FAILED, undefined);
          }
        ];
      }
      return [InputResult.IGNORED, () => { }];
    }
    const matchResult = this._currentNode.nextEdges.map((edge) => {
      const result = stroke.match(edge); return { edge, result }
    });
    const acceptedEdges = matchResult
      .filter((match) => match.result === "matched")
      .map((match) => match.edge);
    const modifiedEdges = matchResult
      .filter((match) => match.result === "modified")
      .map((match) => match.edge);
    // modifiedEdges が1個以上ある場合は、仮確定状態にする
    // このとき、acceptedEdges が1個以上ある場合は、それを仮確定状態にする
    // acceptedEdges が0個の場合は、単発キーを仮確定状態にする
    console.log("modifiedEdges", modifiedEdges);
    console.log("acceptedEdges", acceptedEdges);
    if (modifiedEdges.length > 0) {
      if (acceptedEdges.length > 0) {
        return [InputResult.STAGED, () => {
          this.stagedEdge = acceptedEdges[0];
        }];
      }
      return [InputResult.STAGED, () => {
        this.stagedEdge = stroke;
      }];
    }

    if (acceptedEdges.length > 0) {
      const acceptedEdge = acceptedEdges[0];
      const resultType = this.edgeToResultType(this._currentNode.kanaIndex, acceptedEdge);
      return [
        resultType,
        () => {
          this.applyState(stroke, resultType, acceptedEdge);
        }
      ];
    }
    // ローマ字入力における Shift キーの単独押下などの場合は無視する
    const ignoredEdges = this._currentNode.nextEdges.filter(
      (edge) => stroke.match(edge) === "ignored"
    );
    if (ignoredEdges.length > 0) {
      return [InputResult.IGNORED, () => { }];
    }
    return [
      InputResult.FAILED, () => {
        this.applyState(stroke, InputResult.FAILED, undefined);
      }
    ];
  }
  /**
   * キー入力して状態遷移し、入力が成功したかどうかを返す
   */
  input(stroke: InputEvent): InputResult {
    const [result, apply] = this.testInput(stroke);
    apply();
    return result;
  }
  /**
   * testInput の結果を適用して内部の状態を変更する
   */
  private applyState(
    stroke: InputEvent,
    result: InputResult,
    acceptedEdge: StrokeEdge | undefined
  ) {
    // 仮確定状態解除
    this.stagedEdge = undefined;

    if (result.isSucceeded) {
      this._edgeHistories.push({
        event: stroke,
        previousEdge: acceptedEdge!,
        failedEvents: this._failedEventsAtCurrentNode,
      });
      this._currentNode = acceptedEdge!.next;
      this._failedEventsAtCurrentNode = [];
    } else if (result.isFailed) {
      this._failedEventsAtCurrentNode.push(stroke);
    }
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
}
