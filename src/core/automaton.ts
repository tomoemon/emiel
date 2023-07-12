import { Comparable } from "./rule";
import { InputEvent, RuleStroke } from "./stroke";
import { StrokeEdge, StrokeNode } from "./builder_stroke_graph";

export class InputResult {
  constructor(
    private readonly type:
      | "ignored"
      | "failed"
      | "key_succeeded"
      | "kana_succeeded"
      | "finished"
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
    return (
      this.type === "key_succeeded" ||
      this.type === "kana_succeeded" ||
      this.type === "finished"
    );
  }
  get isKanaSucceeded(): boolean {
    return this.type === "kana_succeeded" || this.type === "finished";
  }
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
  get finished(): boolean {
    return this._currentNode.nextEdges.length === 0;
  }
  input(stroke: InputEvent<T>): InputResult {
    const lastKanaIndex = this._currentNode.kanaIndex;
    const acceptedEdges = this._currentNode.nextEdges.filter(
      (edge) => stroke.match(edge) === "matched"
    );
    console.log(acceptedEdges);
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

export class SelectorInputResult<T> {
  constructor(readonly type: InputResult, readonly automaton: T) {}
}

export class Selector<T extends Comparable<T>> {
  // 現在入力試行対象になっている automaton
  private activeAutomatons: Automaton<T>[];
  constructor(private automatons: Automaton<T>[]) {
    this.activeAutomatons = automatons;
  }
  input(stroke: InputEvent<T>): SelectorInputResult<Automaton<T>>[] {
    const result = [];
    const newActiveAutomatons = [];
    let succeeded = false;
    for (let automaton of this.activeAutomatons) {
      const type = automaton.input(stroke);
      result.push(new SelectorInputResult(type, automaton));
      if (type !== inputResultFailed) {
        succeeded = true;
        if (type != inputResultFinished) {
          newActiveAutomatons.push(automaton);
        }
      }
    }
    if (!succeeded) {
      return result;
    }
    this.activeAutomatons = newActiveAutomatons;
    return result;
  }
  /**
   * 完了していない automaton をすべてキャンセルして active な状態に戻す
   */
  reset() {
    this.activeAutomatons.forEach((v) => v.reset());
    this.activeAutomatons = this.automatons.filter((v) => !v.finished);
  }
  append(automaton: Automaton<T>) {
    this.automatons.push(automaton);
  }
}
