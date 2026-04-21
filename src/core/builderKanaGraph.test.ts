import { expect, test } from "vitest";
import { buildKanaNode } from "./builderKanaGraph";
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
// sources タグ付け済みの実体を引くためのインデックス
const [A_A, T_TA, LTU_TSU, TT_TSU_T, X_AI] = defaultRule.rawEntries;

test("test buildKanaNode: empty text", () => {
  const { startNode, endNode } = buildKanaNode(defaultRule, "", identityNormalize);
  expect(startNode).toBe(endNode);
});

test("test buildKanaNode: あ", () => {
  const { startNode, endNode } = buildKanaNode(defaultRule, "あ", identityNormalize);
  expect(startNode).not.toBe(endNode);
  expect(startNode.nextEdges.length).toBe(1);
  expect(startNode.nextEdges[0].entries).toEqual([A_A]);
  expect(startNode.nextEdges[0].next).toBe(endNode);
});

test("test buildKanaNode: あっ", () => {
  const { startNode, endNode } = buildKanaNode(defaultRule, "あっ", identityNormalize);
  expect(startNode).not.toBe(endNode);
  expect(startNode.nextEdges.length).toBe(1);
  expect(startNode.nextEdges[0].entries).toEqual([A_A]);
  const secondNode = startNode.nextEdges[0].next;
  expect(secondNode.nextEdges.length).toBe(1);
  expect(secondNode.nextEdges[0].entries).toEqual([LTU_TSU]);
  expect(secondNode.nextEdges[0].next).toBe(endNode);
});

test("test buildKanaNode: あった", () => {
  const { startNode, endNode } = buildKanaNode(defaultRule, "あった", identityNormalize);
  expect(startNode).not.toBe(endNode);
  expect(startNode.nextEdges.length).toBe(1);
  expect(startNode.nextEdges[0].entries).toEqual([A_A]);
  const secondNode = startNode.nextEdges[0].next;
  expect(secondNode.nextEdges.length).toBe(2);
  expect(secondNode.nextEdges[0].entries).toEqual([LTU_TSU]);
  const thirdNode = secondNode.nextEdges[0].next;
  expect(thirdNode.nextEdges.length).toBe(1);
  expect(thirdNode.nextEdges[0].entries).toEqual([T_TA]);
  expect(thirdNode.nextEdges[0].next).toBe(endNode);
  expect(secondNode.nextEdges[1].entries).toEqual([TT_TSU_T, T_TA]);
  expect(secondNode.nextEdges[1].next).toBe(endNode);
});

test("test buildKanaNode: あいた, erase あ->い edge", () => {
  // 「あ」単独で入力できるエントリは存在するが
  // 「い」「いた」を入力できるエントリは存在しないため、
  // 「あ」単独で入力する Edge は削除される
  const { startNode, endNode } = buildKanaNode(defaultRule, "あいた", identityNormalize);
  expect(startNode).not.toBe(endNode);
  expect(startNode.nextEdges.length).toBe(1);
  expect(startNode.nextEdges[0].entries).toEqual([X_AI]);
  const secondNode = startNode.nextEdges[0].next;
  expect(secondNode.nextEdges.length).toBe(1);
  expect(secondNode.nextEdges[0].entries).toEqual([T_TA]);
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
