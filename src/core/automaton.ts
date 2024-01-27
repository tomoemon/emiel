import { Comparable } from "./rule";
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
  ) {}
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
  // isSucceeded:true の場合の詳細な情報: 今回の1打鍵でかな1文字分の遷移をした
  get isKanaSucceeded(): boolean {
    return this.type === "kana_succeeded";
  }
  // isSucceeded:true の場合の詳細な情報: 今回の1打鍵でワードの入力が完了した
  get isFinished(): boolean {
    return this.type === "finished";
  }
}

const inputResultIgnored = new InputResult("ignored");
const inputResultFailed = new InputResult("failed");
const inputResultKeySucceeded = new InputResult("key_succeeded");
const inputResultKanaSucceeded = new InputResult("kana_succeeded");
const inputResultFinished = new InputResult("finished");

export class Automaton<T extends Comparable<T>> {
  private _currentNode: StrokeNode<T>;
  private _succeededInputs: {
    event: InputEvent<T>;
    lastEdge: StrokeEdge<T>;
  }[] = [];
  constructor(readonly word: string, readonly startNode: StrokeNode<T>) {
    this._currentNode = startNode;
  }
  get finishedWordSubstr(): string {
    return this.word.substring(0, this._currentNode.kanaIndex);
  }
  get pendingWordSubstr(): string {
    return this.word.substring(this._currentNode.kanaIndex);
  }
  get finishedRomanSubstr(): string {
    return this.succeededInputs.map((v) => v.matchedStroke.romanChar).join("");
  }
  get pendingRomanSubstr(): string {
    return this.shortestPendingStrokes.map((v) => v.romanChar).join("");
  }
  /**
   * 現在の入力状態から最短ストローク数で打ち切れるストローク列を返す
   */
  get shortestPendingStrokes(): RuleStroke<T>[] {
    let node = this.currentNode;
    const result: RuleStroke<T>[] = [];
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
  get currentNode(): StrokeNode<T> {
    return this._currentNode;
  }
  get succeededInputs(): {
    event: InputEvent<T>;
    matchedStroke: RuleStroke<T>;
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
  testInput(stroke: InputEvent<T>): {
    result: InputResult;
    acceptedEdge: StrokeEdge<T> | undefined;
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
            result: inputResultFinished,
            acceptedEdge: acceptedEdge,
          };
        }
        return {
          result: inputResultKanaSucceeded,
          acceptedEdge: acceptedEdge,
        };
      }
      return {
        result: inputResultKeySucceeded,
        acceptedEdge: acceptedEdge,
      };
    }
    const ignoredEdges = this._currentNode.nextEdges.filter(
      (edge) => stroke.match(edge) === "ignored"
    );
    if (ignoredEdges.length > 0) {
      return { result: inputResultIgnored, acceptedEdge: undefined };
    }
    return { result: inputResultFailed, acceptedEdge: undefined };
  }
  /**
   * キー入力して状態遷移し、入力が成功するかどうかを返す
   */
  input(stroke: InputEvent<T>): InputResult {
    const { result, acceptedEdge } = this.testInput(stroke);
    this.moveState(stroke, result, acceptedEdge);
    return result;
  }
  protected moveState(
    stroke: InputEvent<T>,
    result: InputResult,
    acceptedEdge: StrokeEdge<T> | undefined
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

/**
 * 入力ミスしたキーを蓄積していき、Backspace 等の消去キーを入力して消さないと次の入力ができないオートマトン
 */
export class BackspaceAutomaton<
  T extends Comparable<T>,
  U extends Automaton<T>
> extends Automaton<T> {
  private _failedInputs: InputEvent<T>[] = [];

  constructor(readonly base: U) {
    super(base.word, base.startNode);
  }

  get failedInputs(): readonly InputEvent<T>[] {
    return this._failedInputs;
  }

  input(stroke: InputEvent<T>): InputResult {
    const { result, acceptedEdge } = this.testInput(stroke);
    if (result.isIgnored) {
      return result;
    }
    if (this._failedInputs.length > 0) {
      // すでにミスしたキーが存在する場合は、それ以降の入力も自動的に失敗扱いにする
      this._failedInputs.push(stroke);
      return inputResultFailed;
    }
    if (result.isFailed) {
      this._failedInputs.push(stroke);
    }
    // 状態遷移する
    this.moveState(stroke, result, acceptedEdge);
    return result;
  }

  backFailedInput(): void {
    if (this._failedInputs.length > 0) {
      this._failedInputs.pop();
    }
  }

  reset(): void {
    this._failedInputs = [];
    super.reset();
  }
}

/**
 * かなテキストと漢字かな混じりテキストの入力状態を同時に表すオートマトン
 * mixedText: 今日,は,い,い,天,気
 * kanaText: きょう,は,い,い,てん,き
 * という入力が与えられた場合、「きょう」まで入力された時点で
 * mixedText の「今日」の入力が終わった状態になる
 */
export class MixedTextAutomaton<T extends Comparable<T>> extends Automaton<T> {
  constructor(
    readonly automaton: Automaton<T>,
    readonly mixedText: string,
    readonly mixedTextIndex: number[]
  ) {
    super(automaton.word, automaton.startNode);
  }
  get finishedMixedSubstr(): string {
    return this.mixedText.substring(
      0,
      this.mixedTextIndex[this.currentNode.kanaIndex]
    );
  }
  get pendingMixedSubstr(): string {
    return this.mixedText.substring(
      this.mixedTextIndex[this.currentNode.kanaIndex]
    );
  }
}
