import { Comparable } from "./rule";
import { InputEvent } from "./stroke";
import { StrokeNode } from "./builder_stroke_graph";

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
  isIgnored(): boolean {
    return this.type === "ignored";
  }
  isFailed(): boolean {
    return this.type === "failed";
  }
  isKeySucceeded(): boolean {
    return (
      this.type === "key_succeeded" ||
      this.type === "kana_succeeded" ||
      this.type === "finished"
    );
  }
  isKanaSucceeded(): boolean {
    return this.type === "kana_succeeded" || this.type === "finished";
  }
  isFinished(): boolean {
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
  private succeededStack: { input: InputEvent<T>; lastNode: StrokeNode<T> }[] =
    [];
  constructor(readonly startNode: StrokeNode<T>) {
    this._currentNode = startNode;
  }
  /**
   * 入力状態をリセットする
   */
  reset(): void {
    this._currentNode = this.startNode;
  }
  get currentNode(): StrokeNode<T> {
    return this._currentNode;
  }
  get succeededInputs(): InputEvent<T>[] {
    return this.succeededStack.map((v) => v.input);
  }
  /**
   * 1 stroke 分の入力を戻す
   */
  back(): void {
    if (this._currentNode !== this.startNode) {
      const last = this.succeededStack.pop();
      if (last) {
        this._currentNode = last.lastNode;
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
        lastNode: this._currentNode,
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
    const failedEdges = this._currentNode.nextEdges.filter(
      (edge) => stroke.match(edge) === "failed"
    );
    if (failedEdges.length > 0) {
      return inputResultFailed;
    }
    return inputResultIgnored;
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
