import { describe, expect, test } from "vitest";
import { buildKanaNode, computeRulesByKanaIndex } from "./builderKanaGraph";
import { AndModifier } from "./modifier";
import { RuleEntry, RulePrimitive } from "./rule";
import { SingleStroke } from "./ruleStroke";
import { VirtualKeys } from "./virtualKey";

const identityNormalize = (v: string) => v;

const defaultRule = new RulePrimitive([
  new RuleEntry([new SingleStroke(VirtualKeys.A, AndModifier.empty)], "あ", [], true),
  new RuleEntry(
    [
      new SingleStroke(VirtualKeys.T, AndModifier.empty),
      new SingleStroke(VirtualKeys.A, AndModifier.empty),
    ],
    "た",
    [],
    true,
  ),
  new RuleEntry(
    [
      new SingleStroke(VirtualKeys.L, AndModifier.empty),
      new SingleStroke(VirtualKeys.T, AndModifier.empty),
      new SingleStroke(VirtualKeys.U, AndModifier.empty),
    ],
    "っ",
    [],
    true,
  ),
  new RuleEntry(
    [
      new SingleStroke(VirtualKeys.T, AndModifier.empty),
      new SingleStroke(VirtualKeys.T, AndModifier.empty),
    ],
    "っ",
    [new SingleStroke(VirtualKeys.T, AndModifier.empty)],
    true,
  ),
  new RuleEntry([new SingleStroke(VirtualKeys.X, AndModifier.empty)], "あい", [], true),
]);

test("test buildKanaNode: empty text", () => {
  const { startNode, endNode } = buildKanaNode(defaultRule, "", identityNormalize);
  expect(startNode).toBe(endNode);
});

test("test buildKanaNode: あ", () => {
  const { startNode, endNode } = buildKanaNode(defaultRule, "あ", identityNormalize);
  expect(startNode).not.toBe(endNode);
  expect(startNode.nextEdges.length).toBe(1);
  expect(startNode.nextEdges[0].entries).toEqual([
    new RuleEntry([new SingleStroke(VirtualKeys.A, AndModifier.empty)], "あ", [], true),
  ]);
  expect(startNode.nextEdges[0].next).toBe(endNode);
});

test("test buildKanaNode: あっ", () => {
  const { startNode, endNode } = buildKanaNode(defaultRule, "あっ", identityNormalize);
  expect(startNode).not.toBe(endNode);
  expect(startNode.nextEdges.length).toBe(1);
  expect(startNode.nextEdges[0].entries).toEqual([
    new RuleEntry([new SingleStroke(VirtualKeys.A, AndModifier.empty)], "あ", [], true),
  ]);
  const secondNode = startNode.nextEdges[0].next;
  expect(secondNode.nextEdges.length).toBe(1);
  expect(secondNode.nextEdges[0].entries).toEqual([
    new RuleEntry(
      [
        new SingleStroke(VirtualKeys.L, AndModifier.empty),
        new SingleStroke(VirtualKeys.T, AndModifier.empty),
        new SingleStroke(VirtualKeys.U, AndModifier.empty),
      ],
      "っ",
      [],
      true,
    ),
  ]);
  expect(secondNode.nextEdges[0].next).toBe(endNode);
});

test("test buildKanaNode: あった", () => {
  const { startNode, endNode } = buildKanaNode(defaultRule, "あった", identityNormalize);
  expect(startNode).not.toBe(endNode);
  expect(startNode.nextEdges.length).toBe(1);
  expect(startNode.nextEdges[0].entries).toEqual([
    new RuleEntry([new SingleStroke(VirtualKeys.A, AndModifier.empty)], "あ", [], true),
  ]);
  const secondNode = startNode.nextEdges[0].next;
  expect(secondNode.nextEdges.length).toBe(2);
  expect(secondNode.nextEdges[0].entries).toEqual([
    new RuleEntry(
      [
        new SingleStroke(VirtualKeys.L, AndModifier.empty),
        new SingleStroke(VirtualKeys.T, AndModifier.empty),
        new SingleStroke(VirtualKeys.U, AndModifier.empty),
      ],
      "っ",
      [],
      true,
    ),
  ]);
  const thirdNode = secondNode.nextEdges[0].next;
  expect(thirdNode.nextEdges.length).toBe(1);
  expect(thirdNode.nextEdges[0].entries).toEqual([
    new RuleEntry(
      [
        new SingleStroke(VirtualKeys.T, AndModifier.empty),
        new SingleStroke(VirtualKeys.A, AndModifier.empty),
      ],
      "た",
      [],
      true,
    ),
  ]);
  expect(thirdNode.nextEdges[0].next).toBe(endNode);
  expect(secondNode.nextEdges[1].entries).toEqual([
    new RuleEntry(
      [
        new SingleStroke(VirtualKeys.T, AndModifier.empty),
        new SingleStroke(VirtualKeys.T, AndModifier.empty),
      ],
      "っ",
      [new SingleStroke(VirtualKeys.T, AndModifier.empty)],
      true,
    ),
    new RuleEntry(
      [
        new SingleStroke(VirtualKeys.T, AndModifier.empty),
        new SingleStroke(VirtualKeys.A, AndModifier.empty),
      ],
      "た",
      [],
      true,
    ),
  ]);
  expect(secondNode.nextEdges[1].next).toBe(endNode);
});

test("test buildKanaNode: あいた, erase あ->い edge", () => {
  // 「あ」単独で入力できるエントリは存在するが
  // 「い」「いた」を入力できるエントリは存在しないため、
  // 「あ」単独で入力する Edge は削除される
  const { startNode, endNode } = buildKanaNode(defaultRule, "あいた", identityNormalize);
  expect(startNode).not.toBe(endNode);
  expect(startNode.nextEdges.length).toBe(1);
  expect(startNode.nextEdges[0].entries).toEqual([
    new RuleEntry([new SingleStroke(VirtualKeys.X, AndModifier.empty)], "あい", [], true),
  ]);
  const secondNode = startNode.nextEdges[0].next;
  expect(secondNode.nextEdges.length).toBe(1);
  expect(secondNode.nextEdges[0].entries).toEqual([
    new RuleEntry(
      [
        new SingleStroke(VirtualKeys.T, AndModifier.empty),
        new SingleStroke(VirtualKeys.A, AndModifier.empty),
      ],
      "た",
      [],
      true,
    ),
  ]);
  expect(secondNode.nextEdges[0].next).toBe(endNode);
});

test("test buildKanaNode: can't generate error", () => {
  expect(() => buildKanaNode(defaultRule, "ほげ", identityNormalize)).toThrowError(
    "can't generate",
  );
  expect(() => buildKanaNode(defaultRule, "あっち", identityNormalize)).toThrowError(
    "can't generate",
  );
  expect(() => buildKanaNode(defaultRule, "ちあっ", identityNormalize)).toThrowError(
    "can't generate",
  );
});

describe("computeRulesByKanaIndex", () => {
  test("空文字列では空配列を返す", () => {
    const { startNode, endNode } = buildKanaNode(defaultRule, "", identityNormalize);
    const result = computeRulesByKanaIndex(startNode, endNode.startIndex, defaultRule);
    expect(result).toEqual([]);
  });

  test("単一 primitive ルールでは全ての位置に同じ primitive が入る", () => {
    const { startNode, endNode } = buildKanaNode(defaultRule, "あった", identityNormalize);
    const result = computeRulesByKanaIndex(startNode, endNode.startIndex, defaultRule);
    // length = kanaLength + 1（終端ノード分）
    expect(result).toHaveLength(4);
    // 最後の index は終端ノードなのでエッジなし → 空配列
    expect(result[3]).toEqual([]);
    // 位置 0, 1, 2 では defaultRule が適用される
    expect(result[0]).toEqual([defaultRule]);
    expect(result[1]).toEqual([defaultRule]);
    expect(result[2]).toEqual([defaultRule]);
  });

  test("合成ルールでは各位置で適用可能な primitive のみを合成順で返す", () => {
    // directInput 相当: A 単独で A（出力）を入力するルール
    const directInputLike = new RulePrimitive([
      new RuleEntry([new SingleStroke(VirtualKeys.B, AndModifier.empty)], "B", [], true),
    ]);
    // defaultRule は「あ」「た」等を入力する
    // 合成: defaultRule + directInputLike
    const composed = defaultRule.compose(directInputLike);

    const { startNode, endNode } = buildKanaNode(composed, "あB", identityNormalize);
    const result = computeRulesByKanaIndex(startNode, endNode.startIndex, composed);

    expect(result).toHaveLength(3);
    // 位置 0 (あ) は defaultRule のみ
    expect(result[0]).toEqual([defaultRule]);
    // 位置 1 (B) は directInputLike のみ
    expect(result[1]).toEqual([directInputLike]);
    // 終端
    expect(result[2]).toEqual([]);
  });

  test("同じ位置で複数 primitive が適用可能な場合は合成順で列挙", () => {
    // 同じ「あ」を別のキーで入力できる primitive を追加
    const altRule = new RulePrimitive([
      new RuleEntry([new SingleStroke(VirtualKeys.Z, AndModifier.empty)], "あ", [], true),
    ]);
    const composed = defaultRule.compose(altRule);

    const { startNode, endNode } = buildKanaNode(composed, "あ", identityNormalize);
    const result = computeRulesByKanaIndex(startNode, endNode.startIndex, composed);

    expect(result).toHaveLength(2);
    // 両 primitive が同じ位置から入力可能 → 合成順 (defaultRule → altRule)
    expect(result[0]).toEqual([defaultRule, altRule]);
    expect(result[1]).toEqual([]);
  });

  test("剪定によりエッジが除去された primitive は含まれない", () => {
    // 「あ」だけ入力できる primitive（「い」や「いた」は入力できない）
    const onlyAnotherA = new RulePrimitive([
      new RuleEntry([new SingleStroke(VirtualKeys.Z, AndModifier.empty)], "あ", [], true),
    ]);
    const composed = defaultRule.compose(onlyAnotherA);

    // "あいた" で build すると、defaultRule の X ("あい") 経由だけが終端に到達する。
    // onlyAnotherA の「あ」単独エッジは終端に届かず剪定される。
    const { startNode, endNode } = buildKanaNode(composed, "あいた", identityNormalize);
    const result = computeRulesByKanaIndex(startNode, endNode.startIndex, composed);

    expect(result).toHaveLength(4);
    // 位置 0 は defaultRule のみ（onlyAnotherA は剪定で消える）
    expect(result[0]).toEqual([defaultRule]);
    expect(result[0]).not.toContain(onlyAnotherA);
  });
});
