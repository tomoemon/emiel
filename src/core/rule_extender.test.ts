import { expect, test } from "vitest";
import { Comparable, RuleEntry } from "./rule";
import { RuleStroke } from "./stroke";
import { extendCommonPrefixOverlappedEntriesDeeply } from "./rule_extender";
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
      false
    ),
    new RuleEntry<Key>(
      [
        new RuleStroke<Key>(keys.N, nullModifier, []),
        new RuleStroke<Key>(keys.A, nullModifier, []),
      ],
      "な",
      [],
      false
    ),
    new RuleEntry<Key>(
      [
        new RuleStroke<Key>(keys.K, nullModifier, []),
        new RuleStroke<Key>(keys.A, nullModifier, []),
      ],
      "か",
      [],
      false
    ),
  ];
  const result = extendCommonPrefixOverlappedEntriesDeeply(entries);
  // console.log(result);
});
