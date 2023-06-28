import { Automaton } from "./automaton";
import { Comparable } from "./rule";
import { RuleStroke } from "./stroke";

export class ShortestStrokeGuide<T extends Comparable<T>> {
  constructor(readonly automaton: Automaton<T>) {}
  get restStrokes(): RuleStroke<T>[] {
    let node = this.automaton.currentNode;
    const result: RuleStroke<T>[] = [];
    while (node.nextEdges.length > 0) {
      result.push(node.nextEdges[0].input);
      node = node.nextEdges[0].next;
    }
    return result;
  }
}
