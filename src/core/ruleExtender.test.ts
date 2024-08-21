import { expect, test } from "vitest";
import { RuleEntry } from "./rule";
import { RuleStroke } from "./ruleStroke";
import { extendCommonPrefixOverlappedEntriesDeeply } from "./ruleExtender";
import { AndModifier, ModifierGroup } from "./modifier";
import { VirtualKeys } from "./virtualKey";

test("英数字は展開しない", () => {
  const entries = [
    new RuleEntry(
      [new RuleStroke(VirtualKeys.A, AndModifier.empty, ModifierGroup.empty)],
      "a",
      [],
      true
    ),
    new RuleEntry(
      [new RuleStroke(VirtualKeys.B, AndModifier.empty, ModifierGroup.empty)],
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
      [new RuleStroke(VirtualKeys.N, AndModifier.empty, ModifierGroup.empty)],
      "ん",
      [],
      true
    ),
    new RuleEntry(
      [
        new RuleStroke(VirtualKeys.N, AndModifier.empty, ModifierGroup.empty),
        new RuleStroke(VirtualKeys.A, AndModifier.empty, ModifierGroup.empty),
      ],
      "な",
      [],
      true
    ),
    new RuleEntry(
      [
        new RuleStroke(VirtualKeys.K, AndModifier.empty, ModifierGroup.empty),
        new RuleStroke(VirtualKeys.A, AndModifier.empty, ModifierGroup.empty),
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
