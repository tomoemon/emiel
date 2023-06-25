import { StrokeNode } from "./builder";
import { Acceptable, Comparable } from "./rule";

export const InputResultTypes = {
  // 現在入力可能ないずれのパターンにもマッチしない
  Failed: 1, // 1 << 0
  // 1つ以上の入力可能な Entry にマッチした
  KeySucceeded: 2, // 1 << 1
  // 1つ以上のかなの入力を進めた
  KanaSucceeded: 6, // 1 << 1 | 1 << 2
  // 入力全体を完了した
  Finished: 14, // 1 << 1 | 1 << 2 | 1 << 3
} as const;

export type InputResultType =
  (typeof InputResultTypes)[keyof typeof InputResultTypes];

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
  input(stroke: U): InputResultType {
    const lastKanaIndex = this.currentNode.kanaIndex;
    const acceptedEdges = this.currentNode.nextEdges.filter((edge) =>
      edge.input.accept(stroke)
    );
    if (acceptedEdges.length > 0) {
      this.succeededStack.push({
        input: stroke,
        lastNode: this.currentNode,
      });
      const nextStrokeNode = acceptedEdges[0].next;
      if (lastKanaIndex < nextStrokeNode.kanaIndex) {
        if (nextStrokeNode.nextEdges.length === 0) {
          return InputResultTypes.Finished;
        }
        return InputResultTypes.KanaSucceeded;
      }
      return InputResultTypes.KeySucceeded;
    }
    return InputResultTypes.Failed;
  }
}

export class SelectorInputResult<T> {
  constructor(readonly type: InputResultType, readonly automaton: T) {}
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
      if (type !== InputResultTypes.Failed) {
        succeeded = true;
        if (type != InputResultTypes.Finished) {
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
