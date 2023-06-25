import { assert } from "vitest";
import { Automaton, KanaEdge, KanaEdgeState, KanaNode } from "./automaton";
import { Acceptable, Comparable } from "./rule";
import { setDefault } from "../utils/map";

export class ShortestStrokeGuide<U, T extends Comparable<T> & Acceptable<U>> {
  readonly minEdgeToEnd: Map<number, KanaEdge<U, T>>;
  readonly minNodeCostToEnd: Map<number, number>;

  constructor(readonly automaton: Automaton<U, T>) {
    const defaultMinCost = Infinity;
    // index の指す node に到達するまでの最小のコストを記録する
    const minNodeCostToEnd: Map<number, number> = new Map();
    // index の指す node から最小コストで終端に向かう edge を記録する
    const minEdgeToEnd: Map<number, KanaEdge<U, T>> = new Map();

    // init
    let searchingNodes = [automaton.endNode];
    minNodeCostToEnd.set(automaton.endNode.startIndex, 0);

    while (searchingNodes.length > 0) {
      const searchedNodes: Set<KanaNode<U, T>> = new Set();
      searchingNodes.forEach((node) => {
        const nodeCost = minNodeCostToEnd.get(node.startIndex) as number;
        node.previousEdges.forEach((edge) => {
          const currentPreviousNodeCost = setDefault(
            minNodeCostToEnd,
            edge.previous.startIndex,
            defaultMinCost
          );
          const newPreviousNodeCost = nodeCost + edge.inputLength;
          if (newPreviousNodeCost < currentPreviousNodeCost) {
            minNodeCostToEnd.set(edge.previous.startIndex, newPreviousNodeCost);
            minEdgeToEnd.set(edge.previous.startIndex, edge);
          }
          searchedNodes.add(edge.previous);
        });
      });
      // DAG(循環のないグラフ)なので、単純に今回探索した Node を次の探索の起点とする
      searchingNodes = Array.from(searchedNodes.values());
    }
    this.minEdgeToEnd = minEdgeToEnd;
    this.minNodeCostToEnd = minNodeCostToEnd;
  }
  get restStrokes(): T[] {
    if (this.automaton.isFinished) {
      return [];
    }
    // 今アクティブなエッジの中から、終端に最短で向かうエッジを選択する
    const [minEdgeState, _] = this.automaton
      .getActiveEdgeStates()
      .map((edgeState) => {
        const nextNode = edgeState.edge.next;
        const nextNodeCost = this.minNodeCostToEnd.get(
          nextNode.startIndex
        ) as number;
        const currentEdgeCost = edgeState.strokesToBeDone.length;
        const currentTotalCost = nextNodeCost + currentEdgeCost;
        return [edgeState, currentTotalCost] as const;
      })
      .sort((a, b) => a[1] - b[1])[0];

    // 最短のエッジから終端までのエッジをたどっていき、「入力」を結合する
    const result: T[] = [...minEdgeState.strokesToBeDone];
    let edge = minEdgeState.edge;
    while (edge.next !== this.automaton.endNode) {
      result.push(...edge.entries.flatMap((v) => v.input));
      const newEdge = this.minEdgeToEnd.get(minEdgeState.edge.next.startIndex);
      assert(newEdge);
      edge = newEdge;
    }
    return result;
  }
}
