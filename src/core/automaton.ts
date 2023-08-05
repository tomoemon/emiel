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
  get isIgnored(): boolean {
    return this.type === "ignored";
  }
  get isFailed(): boolean {
    return this.type === "failed";
  }
  get isKeySucceeded(): boolean {
    return this.type === "key_succeeded";
  }
  get isKanaSucceeded(): boolean {
    return this.type === "kana_succeeded";
  }
  get isFinished(): boolean {
    return this.type === "finished";
  }
  get isSucceeded(): boolean {
    return (
      this.type === "key_succeeded" ||
      this.type === "kana_succeeded" ||
      this.type === "finished"
    );
  }
}

const inputResultIgnored = new InputResult("ignored");
const inputResultFailed = new InputResult("failed");
const inputResultKeySucceeded = new InputResult("key_succeeded");
const inputResultKanaSucceeded = new InputResult("kana_succeeded");
const inputResultFinished = new InputResult("finished");

export class Automaton<T extends Comparable<T>> {
  private _currentNode: StrokeNode<T>;
  private succeededStack: { input: InputEvent<T>; lastEdge: StrokeEdge<T> }[] =
    [];
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
    return this.succeededInputs.map((v) => v.romanChar).join("");
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
    this.succeededStack = [];
  }
  get currentNode(): StrokeNode<T> {
    return this._currentNode;
  }
  get succeededInputs(): RuleStroke<T>[] {
    return this.succeededStack.map((v) => v.lastEdge.input);
  }
  /**
   * 1 stroke 分の入力を戻す
   */
  back(): void {
    if (this._currentNode !== this.startNode) {
      const history = this.succeededStack.pop();
      if (history) {
        this._currentNode = history.lastEdge.previous;
      }
    }
  }
  get isFinished(): boolean {
    return this._currentNode.nextEdges.length === 0;
  }
  input(stroke: InputEvent<T>): InputResult {
    const lastKanaIndex = this._currentNode.kanaIndex;
    const acceptedEdges = this._currentNode.nextEdges.filter(
      (edge) => stroke.match(edge) === "matched"
    );
    if (acceptedEdges.length > 0) {
      this.succeededStack.push({
        input: stroke,
        lastEdge: acceptedEdges[0],
      });
      this._currentNode = acceptedEdges[0].next;
      if (lastKanaIndex < this._currentNode.kanaIndex) {
        if (this._currentNode.nextEdges.length === 0) {
          return inputResultFinished;
        }
        return inputResultKanaSucceeded;
      }
      return inputResultKeySucceeded;
    }
    const ignoredEdges = this._currentNode.nextEdges.filter(
      (edge) => stroke.match(edge) === "ignored"
    );
    if (ignoredEdges.length > 0) {
      return inputResultIgnored;
    }
    return inputResultFailed;
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
