import { setDefault } from "../utils/map";
import { KanaNode } from "./builderKanaGraph";
import { Comparable, Rule } from "./rule";
import { RuleStroke } from "./stroke";

export class StrokeNode<T extends Comparable<T>> {
  private cost: number = 0; // このノードから打ち切るまでの最短ストローク数
  constructor(
    readonly kanaIndex: number, // 今入力しようとしている KanaNode
    readonly previousEdges: StrokeEdge<T>[],
    readonly nextEdges: StrokeEdge<T>[]
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

export class StrokeEdge<T extends Comparable<T>> {
  constructor(
    readonly rule: Rule<T>, // このグラフ生成元になった Rule
    readonly input: RuleStroke<T>,
    readonly previous: StrokeNode<T>,
    readonly next: StrokeNode<T>
  ) {}
}

export function buildStrokeNode<T extends Comparable<T>>(
  rule: Rule<T>,
  endKanaNode: KanaNode<T>
): StrokeNode<T> {
  // KanaNode の index に対応する StrokeNode
  const kanaStrokeNodeMap = new Map<number, StrokeNode<T>>();
  let searchingKanaNodes = [endKanaNode];
  let nextSearchingKanaNodes = new Set<KanaNode<T>>();
  while (searchingKanaNodes.length > 0) {
    searchingKanaNodes.forEach((kanaNode) => {
      // console.log("searching", kanaNode.startIndex);
      kanaNode.previousEdges.forEach((edge) => {
        // console.log( edge.next.startIndex, "->", edge.previous.startIndex, edge.inputs);
        const nextKanaStrokeNode = setDefault(
          kanaStrokeNodeMap,
          kanaNode.startIndex,
          new StrokeNode<T>(kanaNode.startIndex, [], [])
        );
        const previousKanaStrokeNode = setDefault(
          kanaStrokeNodeMap,
          edge.previous.startIndex,
          new StrokeNode<T>(edge.previous.startIndex, [], [])
        );
        const edgeInputs = edge.inputs;
        // このエッジを経由して前のかなノードに到達した場合のコスト
        let lastCost = nextKanaStrokeNode.getCost() + edgeInputs.length;
        previousKanaStrokeNode.updateCostIfLessThan(lastCost);
        let previousStrokeNode = previousKanaStrokeNode;
        edgeInputs.forEach((input, index) => {
          const reusableEdges = previousStrokeNode.nextEdges.filter(
            (strokeEdge) => strokeEdge.input.equals(input.input)
          );
          if (reusableEdges.length > 0) {
            previousStrokeNode = reusableEdges[0].next;
          } else {
            const nextStrokeNode =
              index === edgeInputs.length - 1
                ? nextKanaStrokeNode
                : new StrokeNode<T>(edgeInputs[index + 1].kanaIndex, [], []);
            const strokeEdge = new StrokeEdge<T>(
              rule,
              input.input,
              previousStrokeNode,
              nextStrokeNode
            );
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

  return kanaStrokeNodeMap.get(0) as StrokeNode<T>;
}
