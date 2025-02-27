import { expect, test } from "vitest";
import { AndModifier } from "./modifier";
import { RuleEntry } from "./rule";
import { extendCommonPrefixOverlappedEntriesDeeply } from "./ruleExtender";
import { RuleStroke } from "./ruleStroke";
import { VirtualKeys } from "./virtualKey";

test("英数字は展開しない", () => {
  const entries = [
    new RuleEntry(
      [new RuleStroke(VirtualKeys.A, AndModifier.empty)],
      "a",
      [],
      true
    ),
    new RuleEntry(
      [new RuleStroke(VirtualKeys.B, AndModifier.empty)],
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
    new RuleEntry(
      [new RuleStroke(VirtualKeys.N, AndModifier.empty)],
      "ん",
      [],
      true
    ),
    new RuleEntry(
      [
        new RuleStroke(VirtualKeys.N, AndModifier.empty),
        new RuleStroke(VirtualKeys.A, AndModifier.empty),
      ],
      "な",
      [],
      true
    ),
    new RuleEntry(
      [
        new RuleStroke(VirtualKeys.K, AndModifier.empty),
        new RuleStroke(VirtualKeys.A, AndModifier.empty),
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
  expect(extendedN[0].input[0].key).toBe(VirtualKeys.N);
  expect(extendedN[0].input[1].key).toBe(VirtualKeys.K);
  expect(extendedN[0].nextInput.length).toBe(1);
  expect(extendedN[0].nextInput[0].key).toBe(VirtualKeys.K);
});
