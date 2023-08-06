import { expect, test } from "vitest";
import { Comparable, RuleEntry } from "./rule";
import { RuleStroke } from "./ruleStroke";
import { extendCommonPrefixOverlappedEntriesDeeply } from "./ruleExtender";
import { AndModifier } from "./modifier";

class Key implements Comparable<Key> {
  constructor(public readonly code: string) {}
  equals(other: Key): boolean {
    return this.code === other.code;
  }
  toString(): string {
    return this.code;
  }
}

const keys = {
  A: new Key("A"),
  B: new Key("B"),
  C: new Key("C"),
  D: new Key("D"),
  E: new Key("E"),
  K: new Key("K"),
  N: new Key("N"),
} as const;

const nullModifier = new AndModifier<Key>();

test("英数字は展開しない", () => {
  const entries = [
    new RuleEntry<Key>(
      [new RuleStroke<Key>(keys.A, nullModifier, [])],
      "a",
      [],
      true
    ),
    new RuleEntry<Key>(
      [new RuleStroke<Key>(keys.B, nullModifier, [])],
      "b",
      [],
      true
    ),
  ];
  const result = extendCommonPrefixOverlappedEntriesDeeply(entries);
  expect(result.length).toBe(2);
});

test("んの展開", () => {
  const entries = [
    new RuleEntry<Key>(
      [new RuleStroke<Key>(keys.N, nullModifier, [])],
      "ん",
      [],
      true
    ),
    new RuleEntry<Key>(
      [
        new RuleStroke<Key>(keys.N, nullModifier, []),
        new RuleStroke<Key>(keys.A, nullModifier, []),
      ],
      "な",
      [],
      true
    ),
    new RuleEntry<Key>(
      [
        new RuleStroke<Key>(keys.K, nullModifier, []),
        new RuleStroke<Key>(keys.A, nullModifier, []),
      ],
      "か",
      [],
      true
    ),
  ];
  const result = extendCommonPrefixOverlappedEntriesDeeply(entries);
  const extendedN = result.filter((e) => e.output === "ん");
  expect(extendedN.length).toBe(1);
  expect(extendedN[0].input.length).toBe(2);
  expect(extendedN[0].input[0].key).toBe(keys.N);
  expect(extendedN[0].input[1].key).toBe(keys.K);
  expect(extendedN[0].nextInput.length).toBe(1);
  expect(extendedN[0].nextInput[0].key).toBe(keys.K);
});
