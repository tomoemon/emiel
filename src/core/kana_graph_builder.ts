// kanaText の特定の位置に対応する Node

import { Acceptable, Comparable, Rule, RuleEntry } from "./rule";

// build 中にのみ使用する
export class KanaNode<U, T extends Comparable<T> & Acceptable<U>> {
  constructor(
    readonly startIndex: number,
    readonly nextEdges: KanaEdge<U, T>[],
    readonly previousEdges: KanaEdge<U, T>[]
  ) {}
  connectEdgesWithNextInput(
    previousNode: KanaNode<U, T>,
    entry: RuleEntry<U, T>
  ) {
    this.nextEdges
      .filter((edge) => edge.canConnectWithNextInput(entry.nextInput))
      .forEach((edge) => {
        // この段階では「次の入力」の分を次のEntryの「入力」から削除することはしない
        // edge の inputs を参照するときに重なる部分が除去される
        const newEdge = new KanaEdge(
          [entry, ...edge.entries],
          edge.next,
          previousNode
        );
        previousNode.nextEdges.push(newEdge);
        edge.next.previousEdges.push(newEdge);
      });
  }
  clearNextEdgesTo(targetNode: KanaNode<U, T>) {
    const newNodes = this.nextEdges.filter((edge) => edge.next !== targetNode);
    this.nextEdges.splice(0, this.nextEdges.length, ...newNodes);
  }
  isEnd(): boolean {
    return this.nextEdges.length === 0;
  }
}

// KanaNode間をつなぐ辺
// build 中にのみ使用する
export class KanaEdge<U, T extends Comparable<T> & Acceptable<U>> {
  constructor(
    readonly entries: RuleEntry<U, T>[],
    readonly next: KanaNode<U, T>,
    readonly previous: KanaNode<U, T>
  ) {}

  /**
   * entries に含まれる input を結合して返す
   * entry の nextInput が次とつながる分を除いて結合する
   * 例：entires: [tt っ t], [ta た] → tta を返す
   */
  get inputs(): { input: T; kanaIndex: number }[] {
    const result: { input: T; kanaIndex: number }[] = [];
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

  /*
	nextInput を渡されたときに、この Edge からつながる Entry の input が nextInput とつながるかどうかを判定する
   */
  canConnectWithNextInput(nextInput: T[]): boolean {
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
export function buildKanaNode<U, T extends Comparable<T> & Acceptable<U>>(
  rule: Rule<U, T>,
  kanaText: string
): [KanaNode<U, T>, KanaNode<U, T>] {
  // かなテキスト1文字1文字に対応する KanaNode を作成する
  const kanaNodes = [...kanaText].map((_, i) => new KanaNode<U, T>(i, [], []));
  const endNode = new KanaNode<U, T>(kanaText.length, [], []); // 終端ノード
  const kanaNodesWithEnd = [...kanaNodes, endNode];
  /*
  kanaText: あいうえお
  に対して
  i=5 あいうえお の末尾から手前にチェック
  i=4 あいうえ の末尾から手前にチェック
  i=3 あいう の末尾から手前にチェック
  i=2 あい の末尾から手前にチェック
  i=1 あ の末尾から手前にチェック
  */
  for (let i = kanaText.length; i > 0; i--) {
    const kanaPrefix = kanaText.substring(0, i);
    const nextNode = kanaNodesWithEnd[i];
    for (let entry of rule.entries) {
      if (kanaPrefix.endsWith(entry.output)) {
        const previousNode =
          kanaNodesWithEnd[kanaPrefix.length - entry.output.length];
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
  eraseInvalidEdges(kanaNodes);
  return [kanaNodes[0], endNode];
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
function eraseInvalidEdges<U, T extends Comparable<T> & Acceptable<U>>(
  kanaNodes: KanaNode<U, T>[]
) {
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
