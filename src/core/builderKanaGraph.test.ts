import { expect, test } from "vitest";
import { Rule, RuleEntry } from "./rule";
import { AndModifier, ModifierGroup } from "./modifier";
import { RuleStroke } from "./ruleStroke";
import { buildKanaNode } from "./builderKanaGraph";
import { VirtualKeys } from "./virtualKey";

const defaultRule = new Rule(
  "test-rule",
  [
    new RuleEntry(
      [new RuleStroke(VirtualKeys.A, AndModifier.empty, ModifierGroup.empty)],
      "あ",
      [],
      true
    ),
    new RuleEntry(
      [
        new RuleStroke(VirtualKeys.T, AndModifier.empty, ModifierGroup.empty),
        new RuleStroke(VirtualKeys.A, AndModifier.empty, ModifierGroup.empty),
      ],
      "た",
      [],
      true
    ),
    new RuleEntry(
      [
        new RuleStroke(VirtualKeys.L, AndModifier.empty, ModifierGroup.empty),
        new RuleStroke(VirtualKeys.T, AndModifier.empty, ModifierGroup.empty),
        new RuleStroke(VirtualKeys.U, AndModifier.empty, ModifierGroup.empty),
      ],
      "っ",
      [],
      true
    ),
    new RuleEntry(
      [
        new RuleStroke(VirtualKeys.T, AndModifier.empty, ModifierGroup.empty),
        new RuleStroke(VirtualKeys.T, AndModifier.empty, ModifierGroup.empty),
      ],
      "っ",
      [new RuleStroke(VirtualKeys.T, AndModifier.empty, ModifierGroup.empty)],
      true
    ),
    new RuleEntry(
      [new RuleStroke(VirtualKeys.X, AndModifier.empty, ModifierGroup.empty)],
      "あい",
      [],
      true
    ),
  ],
  ModifierGroup.empty,
  (v) => v
);

test("test buildKanaNode: empty text", () => {
  const [startNode, endNode] = buildKanaNode(defaultRule, "");
  expect(startNode).toBe(endNode);
});

test("test buildKanaNode: あ", () => {
  const [startNode, endNode] = buildKanaNode(defaultRule, "あ");
  expect(startNode).not.toBe(endNode);
  expect(startNode.nextEdges.length).toBe(1);
  expect(startNode.nextEdges[0].entries).toEqual([
    new RuleEntry(
      [new RuleStroke(VirtualKeys.A, AndModifier.empty, ModifierGroup.empty)],
      "あ",
      [],
      true
    ),
  ]);
  expect(startNode.nextEdges[0].next).toBe(endNode);
});

test("test buildKanaNode: あっ", () => {
  const [startNode, endNode] = buildKanaNode(defaultRule, "あっ");
  expect(startNode).not.toBe(endNode);
  expect(startNode.nextEdges.length).toBe(1);
  expect(startNode.nextEdges[0].entries).toEqual([
    new RuleEntry(
      [new RuleStroke(VirtualKeys.A, AndModifier.empty, ModifierGroup.empty)],
      "あ",
      [],
      true
    ),
  ]);
  const secondNode = startNode.nextEdges[0].next;
  expect(secondNode.nextEdges.length).toBe(1);
  expect(secondNode.nextEdges[0].entries).toEqual([
    new RuleEntry(
      [
        new RuleStroke(VirtualKeys.L, AndModifier.empty, ModifierGroup.empty),
        new RuleStroke(VirtualKeys.T, AndModifier.empty, ModifierGroup.empty),
        new RuleStroke(VirtualKeys.U, AndModifier.empty, ModifierGroup.empty),
      ],
      "っ",
      [],
      true
    ),
  ]);
  expect(secondNode.nextEdges[0].next).toBe(endNode);
});

test("test buildKanaNode: あった", () => {
  const [startNode, endNode] = buildKanaNode(defaultRule, "あった");
  expect(startNode).not.toBe(endNode);
  expect(startNode.nextEdges.length).toBe(1);
  expect(startNode.nextEdges[0].entries).toEqual([
    new RuleEntry(
      [new RuleStroke(VirtualKeys.A, AndModifier.empty, ModifierGroup.empty)],
      "あ",
      [],
      true
    ),
  ]);
  const secondNode = startNode.nextEdges[0].next;
  expect(secondNode.nextEdges.length).toBe(2);
  expect(secondNode.nextEdges[0].entries).toEqual([
    new RuleEntry(
      [
        new RuleStroke(VirtualKeys.L, AndModifier.empty, ModifierGroup.empty),
        new RuleStroke(VirtualKeys.T, AndModifier.empty, ModifierGroup.empty),
        new RuleStroke(VirtualKeys.U, AndModifier.empty, ModifierGroup.empty),
      ],
      "っ",
      [],
      true
    ),
  ]);
  const thirdNode = secondNode.nextEdges[0].next;
  expect(thirdNode.nextEdges.length).toBe(1);
  expect(thirdNode.nextEdges[0].entries).toEqual([
    new RuleEntry(
      [
        new RuleStroke(VirtualKeys.T, AndModifier.empty, ModifierGroup.empty),
        new RuleStroke(VirtualKeys.A, AndModifier.empty, ModifierGroup.empty),
      ],
      "た",
      [],
      true
    ),
  ]);
  expect(thirdNode.nextEdges[0].next).toBe(endNode);
  expect(secondNode.nextEdges[1].entries).toEqual([
    new RuleEntry(
      [
        new RuleStroke(VirtualKeys.T, AndModifier.empty, ModifierGroup.empty),
        new RuleStroke(VirtualKeys.T, AndModifier.empty, ModifierGroup.empty),
      ],
      "っ",
      [new RuleStroke(VirtualKeys.T, AndModifier.empty, ModifierGroup.empty)],
      true
    ),
    new RuleEntry(
      [
        new RuleStroke(VirtualKeys.T, AndModifier.empty, ModifierGroup.empty),
        new RuleStroke(VirtualKeys.A, AndModifier.empty, ModifierGroup.empty),
      ],
      "た",
      [],
      true
    ),
  ]);
  expect(secondNode.nextEdges[1].next).toBe(endNode);
});

test("test buildKanaNode: あいた, erase あ->い edge", () => {
  // 「あ」単独で入力できるエントリは存在するが
  // 「い」「いた」を入力できるエントリは存在しないため、
  // 「あ」単独で入力する Edge は削除される
  const [startNode, endNode] = buildKanaNode(defaultRule, "あいた");
  expect(startNode).not.toBe(endNode);
  expect(startNode.nextEdges.length).toBe(1);
  expect(startNode.nextEdges[0].entries).toEqual([
    new RuleEntry(
      [new RuleStroke(VirtualKeys.X, AndModifier.empty, ModifierGroup.empty)],
      "あい",
      [],
      true
    ),
  ]);
  const secondNode = startNode.nextEdges[0].next;
  expect(secondNode.nextEdges.length).toBe(1);
  expect(secondNode.nextEdges[0].entries).toEqual([
    new RuleEntry(
      [
        new RuleStroke(VirtualKeys.T, AndModifier.empty, ModifierGroup.empty),
        new RuleStroke(VirtualKeys.A, AndModifier.empty, ModifierGroup.empty),
      ],
      "た",
      [],
      true
    ),
  ]);
  expect(secondNode.nextEdges[0].next).toBe(endNode);
});

test("test buildKanaNode: can't generate error", () => {
  expect(() => buildKanaNode(defaultRule, "ほげ")).toThrowError(
    "can't generate"
  );
  expect(() => buildKanaNode(defaultRule, "あっち")).toThrowError(
    "can't generate"
  );
  expect(() => buildKanaNode(defaultRule, "ちあっ")).toThrowError(
    "can't generate"
  );
});
