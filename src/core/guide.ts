import { Automaton } from "./automaton";
import { Acceptable, Comparable } from "./rule";

export class ShortestStrokeGuide<U, T extends Comparable<T> & Acceptable<U>> {
  constructor(readonly automaton: Automaton<U, T>) {}
  get restStrokes(): T[] {
    let node = this.automaton.getCurrentNode();
    const result: T[] = [];
    while (node.nextEdges.length > 0) {
      result.push(node.nextEdges[0].input);
      node = node.nextEdges[0].next;
    }
    return result;
  }
}
