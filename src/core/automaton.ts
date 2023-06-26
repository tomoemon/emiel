import { Acceptable, Comparable } from "./rule";
import { StrokeNode } from "./stroke_graph_builder";

export class InputResult {
  constructor(
    private readonly type:
      | "failed"
      | "key_succeeded"
      | "kana_succeeded"
      | "finished"
  ) {}
  toString(): string {
    return this.type;
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

const inputResultFailed = new InputResult("failed");
const inputResultKeySucceeded = new InputResult("key_succeeded");
const inputResultKanaSucceeded = new InputResult("kana_succeeded");
const inputResultFinished = new InputResult("finished");

export class Automaton<U, T extends Comparable<T> & Acceptable<U>> {
  private currentNode: StrokeNode<U, T>;
  private succeededStack: { input: U; lastNode: StrokeNode<U, T> }[] = [];
  constructor(readonly startNode: StrokeNode<U, T>) {
    this.currentNode = startNode;
  }
  /**
   * 入力状態をリセットする
   */
  reset(): void {
    this.currentNode = this.startNode;
  }
  getCurrentNode(): StrokeNode<U, T> {
    return this.currentNode;
  }
  get succeededInputs(): U[] {
    return this.succeededStack.map((v) => v.input);
  }
  /**
   * 1 stroke 分の入力を戻す
   */
  back(): void {
    if (this.currentNode !== this.startNode) {
      const last = this.succeededStack.pop();
      if (last) {
        this.currentNode = last.lastNode;
      }
    }
  }
  get finished(): boolean {
    return this.currentNode.nextEdges.length === 0;
  }
  input(stroke: U): InputResult {
    const lastKanaIndex = this.currentNode.kanaIndex;
    const acceptedEdges = this.currentNode.nextEdges.filter((edge) =>
      edge.input.accept(stroke)
    );
    console.log(acceptedEdges);
    if (acceptedEdges.length > 0) {
      this.succeededStack.push({
        input: stroke,
        lastNode: this.currentNode,
      });
      this.currentNode = acceptedEdges[0].next;
      if (lastKanaIndex < this.currentNode.kanaIndex) {
        if (this.currentNode.nextEdges.length === 0) {
          return inputResultFinished;
        }
        return inputResultKanaSucceeded;
      }
      return inputResultKeySucceeded;
    }
    return inputResultFailed;
  }
}

export class SelectorInputResult<T> {
  constructor(readonly type: InputResult, readonly automaton: T) {}
}

export class Selector<U, T extends Comparable<T> & Acceptable<U>> {
  // 現在入力試行対象になっている automaton
  private activeAutomatons: Automaton<U, T>[];
  constructor(private automatons: Automaton<U, T>[]) {
    this.activeAutomatons = automatons;
  }
  input(stroke: U): SelectorInputResult<Automaton<U, T>>[] {
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
  append(automaton: Automaton<U, T>) {
    this.automatons.push(automaton);
  }
}
