import { Automaton } from "./automaton";
import { Comparable, Matchable } from "./rule";

export class ShortestStrokeGuide<
  T extends Comparable<T>,
  U extends Matchable<T>
> {
  constructor(readonly automaton: Automaton<T, U>) {}
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
