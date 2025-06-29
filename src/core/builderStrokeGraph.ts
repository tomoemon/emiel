import { setDefault } from "../utils/map";
import { KanaNode } from "./builderKanaGraph";
import { RuleStroke } from "./ruleStroke";

export class StrokeNode {
  private cost: number = 0; // このノードから打ち切るまでの最短ストローク数
  constructor(
    readonly kanaIndex: number, // 今入力しようとしている KanaNode
    readonly previousEdges: StrokeEdge[],
    readonly nextEdges: StrokeEdge[],
  ) {}
  getCost(): number {
    return this.cost;
  }
  /**
   * cost 計算中にのみ必要な関数。状態遷移時は不要
   */
  updateCostIfLessThan(cost: number): void {
    if (this.cost === 0 || cost < this.cost) {
      this.cost = cost;
    }
  }
}

export class StrokeEdge {
  constructor(
    readonly input: RuleStroke,
    readonly previous: StrokeNode,
    readonly next: StrokeNode,
  ) {}
}

export function buildStrokeNode(endKanaNode: KanaNode): StrokeNode {
  // KanaNode の index に対応する StrokeNode
  const kanaStrokeNodeMap = new Map<number, StrokeNode>();
  let searchingKanaNodes = [endKanaNode];
  let nextSearchingKanaNodes = new Set<KanaNode>();
  while (searchingKanaNodes.length > 0) {
    searchingKanaNodes.forEach((kanaNode) => {
      // console.log("searching", kanaNode.startIndex);
      kanaNode.previousEdges.forEach((edge) => {
        // console.log( edge.next.startIndex, "->", edge.previous.startIndex, edge.inputs);
        const nextKanaStrokeNode = setDefault(
          kanaStrokeNodeMap,
          kanaNode.startIndex,
          new StrokeNode(kanaNode.startIndex, [], []),
        );
        const previousKanaStrokeNode = setDefault(
          kanaStrokeNodeMap,
          edge.previous.startIndex,
          new StrokeNode(edge.previous.startIndex, [], []),
        );
        const edgeInputs = edge.inputs;
        // このエッジを経由して前のかなノードに到達した場合のコスト
        let lastCost = nextKanaStrokeNode.getCost() + edgeInputs.length;
        previousKanaStrokeNode.updateCostIfLessThan(lastCost);
        let previousStrokeNode = previousKanaStrokeNode;
        edgeInputs.forEach((input, index) => {
          const reusableEdges = previousStrokeNode.nextEdges.filter((strokeEdge) =>
            strokeEdge.input.equals(input.input),
          );
          if (reusableEdges.length > 0) {
            previousStrokeNode = reusableEdges[0].next;
          } else {
            const nextStrokeNode =
              index === edgeInputs.length - 1
                ? nextKanaStrokeNode
                : new StrokeNode(edgeInputs[index + 1].kanaIndex, [], []);
            const strokeEdge = new StrokeEdge(input.input, previousStrokeNode, nextStrokeNode);
            previousStrokeNode.nextEdges.push(strokeEdge);
            nextStrokeNode.previousEdges.push(strokeEdge);
            previousStrokeNode = nextStrokeNode;
          }
          previousStrokeNode.updateCostIfLessThan(--lastCost);
        });
        nextSearchingKanaNodes.add(edge.previous);
      });
    });
    searchingKanaNodes = Array.from(nextSearchingKanaNodes.values());
    nextSearchingKanaNodes.clear();
    // console.log( "next", searchingKanaNodes.map((n) => n.startIndex));
  }

  // 各かなに対応する StrokeNode から次へ遷移する時、低コストなものを先頭に並べる
  // これにより、nextEdges[0] でたどる経路が最小コストの経路であることを保証できる
  kanaStrokeNodeMap.forEach((strokeNode) => {
    strokeNode.nextEdges.sort((a, b) => a.next.getCost() - b.next.getCost());
  });

  return kanaStrokeNodeMap.get(0) as StrokeNode;
}
