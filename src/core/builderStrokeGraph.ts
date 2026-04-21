import { setDefault } from "../utils/map";
import type { KanaNode } from "./builderKanaGraph";
import type { RuleEntry } from "./rule";
import type { RuleStroke } from "./ruleStroke";

/**
 * Automaton グラフ上の 1 つの状態 (ノード) を表す。
 * currentNode としてユーザの入力位置を保持し、次打鍵の候補 nextEdges を持つ。
 */
export class StrokeNode {
  private cost: number = 0; // このノードから打ち切るまでの最短ストローク数
  constructor(
    /** このノードが対応するかな文字列上の位置 */
    readonly kanaIndex: number,
    /** このノードへ遷移してくる辺の一覧 */
    readonly previousEdges: StrokeEdge[],
    /** このノードから次へ遷移する辺の一覧（先頭が最小コスト経路） */
    readonly nextEdges: StrokeEdge[],
  ) {}
  /** このノードから終端まで打ち切るのに必要な最小ストローク数を返す */
  getCost(): number {
    return this.cost;
  }
  /** このノードが終端（次の遷移候補なし）かどうか */
  get isFinished(): boolean {
    return this.nextEdges.length === 0;
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

/**
 * 2 つの StrokeNode を 1 打鍵で結ぶ有向辺。
 * input が受理されると previous から next へ遷移する。
 */
export class StrokeEdge {
  constructor(
    /** この辺が受理する 1 打鍵 */
    readonly input: RuleStroke,
    /** 遷移元のノード */
    readonly previous: StrokeNode,
    /** 遷移先のノード */
    readonly next: StrokeNode,
    /**
     * この辺が由来する RuleEntry。
     * 通常の edge では必ず設定される。backspace 用の sentinel edge のみ undefined。
     * `edge.entry?.sources` で由来 RulePrimitive を辿れる。
     */
    readonly entry?: RuleEntry,
  ) {}
}

/**
 * かなグラフ (KanaNode) から StrokeNode グラフを構築し、開始ノードを返す。
 * 各ノードの nextEdges は最小コスト経路を先頭とする順序で整列される。
 */
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
            const strokeEdge = new StrokeEdge(
              input.input,
              previousStrokeNode,
              nextStrokeNode,
              input.entry,
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

  return kanaStrokeNodeMap.get(0) as StrokeNode;
}
