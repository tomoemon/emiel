import { Rule, RuleEntry } from "./rule";
import { validateRule } from "./ruleValidator";
import { expect, test } from "vitest";
import { RuleStroke } from "./ruleStroke";
import { AndModifier, ModifierGroup } from "./modifier";
import { VirtualKeys } from "./virtualKey";

test("entry 1つのときに矛盾はない", () => {
  const modifierGroup = new ModifierGroup([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight]);
  const rule = new Rule(
    "test-rule",
    [
      new RuleEntry(
        [new RuleStroke(VirtualKeys.A, AndModifier.empty, modifierGroup)],
        "あ",
        [],
        false
      ),
    ],
    modifierGroup,
    (v) => v
  );
  expect(() => validateRule(rule)).not.toThrowError();
});

test("異なる output を持つ時、異なる unnecesary modifier があっても問題ない", () => {
  const modifierGroup = new ModifierGroup([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight]);
  const rule = new Rule(
    "test-rule",
    [
      new RuleEntry(
        [new RuleStroke(VirtualKeys.A, AndModifier.empty, modifierGroup)],
        "あ",
        [],
        false
      ),
      new RuleEntry(
        [
          new RuleStroke(VirtualKeys.A, AndModifier.empty,
            new ModifierGroup([VirtualKeys.ControlLeft])
          ),
        ],
        "い",
        [],
        false
      ),
    ],
    modifierGroup,
    (v) => v
  );
  expect(() => validateRule(rule)).not.toThrowError();
});

test("同じ output を持つ時、異なる unnecesary modifier があると矛盾", () => {
  const modifierGroup = new ModifierGroup([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight]);
  const rule = new Rule(
    "test-rule",
    [
      new RuleEntry(
        [new RuleStroke(VirtualKeys.A, AndModifier.empty, modifierGroup)],
        "あ",
        [],
        false
      ),
      new RuleEntry(
        [
          new RuleStroke(VirtualKeys.A, AndModifier.empty,
            new ModifierGroup([VirtualKeys.ControlLeft]),
          ),
        ],
        "あ",
        [],
        false
      ),
    ],
    modifierGroup,
    (v) => v
  );
  expect(() => validateRule(rule)).toThrowError();
});
