import { expect, test } from "vitest";
import { Comparable, Rule, RuleEntry } from "./rule";
import { AndModifier } from "./modifier";
import { RuleStroke } from "./stroke";
import { buildKanaNode } from "./builder_kana_graph";

const nullModifier = new AndModifier<Key>();

class Key implements Comparable<Key> {
  constructor(public readonly code: string) {}
  equals(other: Key): boolean {
    return this.code === other.code;
  }
  toString(): string {
    return this.code;
  }
}

const defaultRule = new Rule<Key>(
  "test-rule",
  [
    new RuleEntry<Key>(
      [new RuleStroke<Key>(new Key("A"), nullModifier, [])],
      "あ",
      [],
      true
    ),
    new RuleEntry<Key>(
      [
        new RuleStroke<Key>(new Key("T"), nullModifier, []),
        new RuleStroke<Key>(new Key("A"), nullModifier, []),
      ],
      "た",
      [],
      true
    ),
    new RuleEntry<Key>(
      [
        new RuleStroke<Key>(new Key("L"), nullModifier, []),
        new RuleStroke<Key>(new Key("T"), nullModifier, []),
        new RuleStroke<Key>(new Key("U"), nullModifier, []),
      ],
      "っ",
      [],
      true
    ),
    new RuleEntry<Key>(
      [
        new RuleStroke<Key>(new Key("T"), nullModifier, []),
        new RuleStroke<Key>(new Key("T"), nullModifier, []),
      ],
      "っ",
      [new RuleStroke<Key>(new Key("T"), nullModifier, [])],
      true
    ),
    new RuleEntry<Key>(
      [new RuleStroke<Key>(new Key("X"), nullModifier, [])],
      "あい",
      [],
      true
    ),
  ],
  []
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
    new RuleEntry<Key>(
      [new RuleStroke<Key>(new Key("A"), nullModifier, [])],
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
    new RuleEntry<Key>(
      [new RuleStroke<Key>(new Key("A"), nullModifier, [])],
      "あ",
      [],
      true
    ),
  ]);
  const secondNode = startNode.nextEdges[0].next;
  expect(secondNode.nextEdges.length).toBe(1);
  expect(secondNode.nextEdges[0].entries).toEqual([
    new RuleEntry<Key>(
      [
        new RuleStroke<Key>(new Key("L"), nullModifier, []),
        new RuleStroke<Key>(new Key("T"), nullModifier, []),
        new RuleStroke<Key>(new Key("U"), nullModifier, []),
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
    new RuleEntry<Key>(
      [new RuleStroke<Key>(new Key("A"), nullModifier, [])],
      "あ",
      [],
      true
    ),
  ]);
  const secondNode = startNode.nextEdges[0].next;
  expect(secondNode.nextEdges.length).toBe(2);
  expect(secondNode.nextEdges[0].entries).toEqual([
    new RuleEntry<Key>(
      [
        new RuleStroke<Key>(new Key("L"), nullModifier, []),
        new RuleStroke<Key>(new Key("T"), nullModifier, []),
        new RuleStroke<Key>(new Key("U"), nullModifier, []),
      ],
      "っ",
      [],
      true
    ),
  ]);
  const thirdNode = secondNode.nextEdges[0].next;
  expect(thirdNode.nextEdges.length).toBe(1);
  expect(thirdNode.nextEdges[0].entries).toEqual([
    new RuleEntry<Key>(
      [
        new RuleStroke<Key>(new Key("T"), nullModifier, []),
        new RuleStroke<Key>(new Key("A"), nullModifier, []),
      ],
      "た",
      [],
      true
    ),
  ]);
  expect(thirdNode.nextEdges[0].next).toBe(endNode);
  expect(secondNode.nextEdges[1].entries).toEqual([
    new RuleEntry<Key>(
      [
        new RuleStroke<Key>(new Key("T"), nullModifier, []),
        new RuleStroke<Key>(new Key("T"), nullModifier, []),
      ],
      "っ",
      [new RuleStroke<Key>(new Key("T"), nullModifier, [])],
      true
    ),
    new RuleEntry<Key>(
      [
        new RuleStroke<Key>(new Key("T"), nullModifier, []),
        new RuleStroke<Key>(new Key("A"), nullModifier, []),
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
    new RuleEntry<Key>(
      [new RuleStroke<Key>(new Key("X"), nullModifier, [])],
      "あい",
      [],
      true
    ),
  ]);
  const secondNode = startNode.nextEdges[0].next;
  expect(secondNode.nextEdges.length).toBe(1);
  expect(secondNode.nextEdges[0].entries).toEqual([
    new RuleEntry<Key>(
      [
        new RuleStroke<Key>(new Key("T"), nullModifier, []),
        new RuleStroke<Key>(new Key("A"), nullModifier, []),
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
