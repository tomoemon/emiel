import { setDefaultFunc } from "../utils/map";
import type { normalizerFunc, Rule, RuleEntry, RulePrimitive } from "./rule";
import type { RuleStroke } from "./ruleStroke";

/**
 * Automaton 構築中にのみ利用する中間表現。かな文字列上の 1 位置を表すノード。
 */
export class KanaNode {
  constructor(
    /** このノードが対応する、かな文字列の開始位置 */
    readonly startIndex: number,
    /** このノードから次のノードへ遷移する辺 */
    readonly nextEdges: KanaEdge[],
    /** 前のノードからこのノードへ遷移してくる辺 */
    readonly previousEdges: KanaEdge[],
  ) {}
  /** entry の nextInput が次ノードの入力先頭と繋がる場合、その連結エッジを previousNode に追加する */
  connectEdgesWithNextInput(previousNode: KanaNode, entry: RuleEntry) {
    this.nextEdges
      .filter((edge) => edge.canConnectWithNextInput(entry.nextInput))
      .forEach((edge) => {
        // この段階では「次の入力」の分を次のEntryの「入力」から削除することはしない
        // StrokeNode 構築時に、edge の inputs の重なる部分が除去される
        const newEdge = new KanaEdge([entry, ...edge.entries], edge.next, previousNode);
        previousNode.nextEdges.push(newEdge);
        edge.next.previousEdges.push(newEdge);
      });
  }
  /** targetNode を next とする辺を、この KanaNode の nextEdges から除去する */
  clearNextEdgesTo(targetNode: KanaNode) {
    const newNodes = this.nextEdges.filter((edge) => edge.next !== targetNode);
    this.nextEdges.splice(0, this.nextEdges.length, ...newNodes);
  }
  /** このノードから先へ遷移する辺がないか（＝終端かどうか） */
  isEnd(): boolean {
    return this.nextEdges.length === 0;
  }
}

/**
 * KanaNode 間を繋ぐ辺。Automaton 構築中にのみ利用する中間表現。
 * 1 つの辺が 1 つ以上の RuleEntry 列を担う（nextInput による連結も含む）。
 */
export class KanaEdge {
  constructor(
    /** この辺を構成するエントリ列 */
    readonly entries: RuleEntry[],
    /** 遷移先 KanaNode */
    readonly next: KanaNode,
    /** 遷移元 KanaNode */
    readonly previous: KanaNode,
  ) {}

  /**
   * entries に含まれる input を結合して返す
   * entry の nextInput が次とつながる分を除いて結合する
   * 例：entries: [tt っ t], [ta た] → tta を返す
   */
  get inputs(): { input: RuleStroke; kanaIndex: number }[] {
    const result: { input: RuleStroke; kanaIndex: number }[] = [];
    let lastNextInputLength = 0;
    let lastTotalEntryOutputLength = 0;
    const previousKanaNodeIndex = this.previous.startIndex;
    this.entries.forEach((entry) => {
      entry.input.slice(lastNextInputLength).forEach((input) => {
        result.push({
          input: input,
          kanaIndex: previousKanaNodeIndex + lastTotalEntryOutputLength,
        });
      });
      lastNextInputLength = entry.nextInput.length;
      lastTotalEntryOutputLength += entry.output.length;
    });
    return result;
  }

  /**
   * 渡された nextInput と、この Edge の先頭 Entry の input が連結可能かを判定する。
   */
  canConnectWithNextInput(nextInput: RuleStroke[]): boolean {
    return this.entries[0].isConnetableAfter(nextInput);
  }
}

/*
や     っ      た     $
   ya     ltu    ta
   ya     xtu    ta
   ya           tta

や     っ      ち     $
   ya     ltu    ti
   ya     xtu    ti
   ya     ltu    chi
   ya     xtu    chi
   ya            tti
   ya           cchi
*/
export type BuildKanaNodeResult = {
  startNode: KanaNode;
  endNode: KanaNode;
};

/**
 * Rule と入力対象のかな文字列から KanaNode グラフを構築する。
 * 終端に繋がらない辺は除去され、開始ノードから終端まで到達可能な経路のみが残る。
 * 構築不能な場合は例外を投げる。
 */
export function buildKanaNode(
  rule: Rule,
  kanaText: string,
  normalize: normalizerFunc,
): BuildKanaNodeResult {
  const normalizedKanaText = normalize(kanaText);
  // かなテキスト1文字1文字に対応する KanaNode を作成する
  const kanaNodes = [...normalizedKanaText].map((_, i) => new KanaNode(i, [], []));
  const endNode = new KanaNode(normalizedKanaText.length, [], []); // 終端ノード
  const kanaNodesWithEnd = [...kanaNodes, endNode];
  if (normalizedKanaText.length === 0) {
    // 空文字列の場合は終端ノードのみを返す
    return { startNode: endNode, endNode };
  }
  /*
  kanaText: あいうえお
  に対して
  i=5 あいうえお の末尾から手前にチェック
  i=4 あいうえ の末尾から手前にチェック
  i=3 あいう の末尾から手前にチェック
  i=2 あい の末尾から手前にチェック
  i=1 あ の末尾から手前にチェック
  */
  const normalizedEntryOutputMap: Map<RuleEntry, string> = new Map();
  const primitives = rule.primitives;
  for (let i = normalizedKanaText.length; i > 0; i--) {
    const kanaPrefix = normalizedKanaText.substring(0, i);
    const nextNode = kanaNodesWithEnd[i];
    for (const r of primitives) {
      for (let entry of r.entries) {
        const normalizedEntryOutput = setDefaultFunc(normalizedEntryOutputMap, entry, () =>
          normalize(entry.output),
        );
        if (kanaPrefix.endsWith(normalizedEntryOutput)) {
          const previousNode = kanaNodesWithEnd[kanaPrefix.length - entry.output.length];
          if (entry.hasNextInput) {
            // 「次の入力」を持つエントリの場合、「次の入力」の値が次の KanaNode と組み合わせ可能な場合のみ連結する
            nextNode.connectEdgesWithNextInput(previousNode, entry);
          } else {
            // 「次の入力」がない場合は単純に KanaNode 同士をつなぐ
            const edge = new KanaEdge([entry], nextNode, previousNode);
            previousNode.nextEdges.push(edge);
            nextNode.previousEdges.push(edge);
          }
        }
      }
    }
  }
  // startNode から終端ノードまでの間で、終端ノードにつながらない Edge を削除する
  eraseInvalidEdges(kanaNodes);

  // 初期ノードから遷移する候補がない場合はオートマトン生成に失敗したらエラーを返す
  if (kanaNodes[0].nextEdges.length === 0) {
    throw new Error(`Rule ${rule.metadata.name} can't generate an automaton for "${kanaText}"`);
  }
  return {
    startNode: kanaNodes[0],
    endNode,
  };
}

/**
 * 剪定済み KanaNode グラフを走査し、各 kanaIndex で適用可能な RulePrimitive 集合を計算する。
 * 合成順（rule.primitives の順序）を保ったまま unique 化する。
 *
 * 例: NICOLA + directInput の合成で "ABCマート" を build した場合
 *   rulesByKanaIndex[0..2] = [directInput]  (A, B, C)
 *   rulesByKanaIndex[3..6] = [nicola]       (マ, ー, ト)
 */
export function computeRulesByKanaIndex(
  startNode: KanaNode,
  kanaLength: number,
  rule: Rule,
): readonly (readonly RulePrimitive[])[] {
  if (kanaLength === 0) return [];
  const entryToPrimitive = new Map<RuleEntry, RulePrimitive>();
  for (const p of rule.primitives) {
    for (const e of p.entries) entryToPrimitive.set(e, p);
  }
  const result: Set<RulePrimitive>[] = Array.from(
    { length: kanaLength + 1 },
    () => new Set<RulePrimitive>(),
  );
  const visited = new Set<KanaNode>();
  const queue: KanaNode[] = [startNode];
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i];
    if (visited.has(node)) continue;
    visited.add(node);
    for (const edge of node.nextEdges) {
      for (const entry of edge.entries) {
        const p = entryToPrimitive.get(entry);
        if (p) result[node.startIndex].add(p);
      }
      queue.push(edge.next);
    }
  }
  // 合成順を保つため、rule.primitives の順で並び直す
  return result.map((s) => rule.primitives.filter((p) => s.has(p)));
}

/**
startNode から終端ノードまでの間で、終端ノードにつながらない Edge を削除する

以下の構造の場合、そもそも startNode の「あ」から「い」はつながってないので、
startNode から遷移を始める場合は問題が起きない（「い」「う」の KanaNode は build 後参照されない）

あ     い     う     え     $
|      +------+     +------+
+-------------------+

以下の構造の場合、startNode の「あ」から「い」はつながっているが、
「い」から終端ノードまでたどり着けないので、「あ」から「い」の Edge を消す必要がある

あ     い     う     え     $
+------+            +------+
+-------------------+
*/
function eraseInvalidEdges(kanaNodes: KanaNode[]) {
  // 末尾の KanaNode から順にチェックし、次へ遷移できない KanaNode の場合は、
  // 前の KanaNode からその KanaNode に対する Edge を削除する
  for (let i = kanaNodes.length - 1; i > 0; i--) {
    const kanaNode = kanaNodes[i];
    if (kanaNode.nextEdges.length === 0) {
      for (let previousEdge of kanaNode.previousEdges) {
        previousEdge.previous.clearNextEdgesTo(kanaNode);
      }
    }
  }
}
