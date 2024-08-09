import { expect, test } from "vitest";
import { loadJsonRule } from "./jsonRuleLoader";
import { RuleEntry } from "../core/rule";
import { RuleStroke } from "../core/ruleStroke";
import { AndModifier, ModifierGroup } from "../core/modifier";
import { VirtualKeys } from "../core/virtualKey";

const nullModifier = new AndModifier();

test("empty", () => {
  const rule = loadJsonRule("rule", {
    extendCommonPrefixEntry: true,
    modifierGroups: [],
    entries: [],
  });
  expect(rule.entries.length).toBe(0);
});

test("simple 1 entry", () => {
  const rule = loadJsonRule("rule", {
    extendCommonPrefixEntry: false,
    modifierGroups: [],
    entries: [
      {
        input: [
          {
            keys: ["A"],
            modifiers: [],
          },
          {
            keys: ["B"],
            modifiers: [],
          },
        ],
        output: "あ",
        nextInput: [],
      },
    ],
  });
  expect(rule.entries.length).toBe(1);
  expect(rule.entries[0]).toEqual(
    new RuleEntry(
      [
        new RuleStroke(VirtualKeys.A, nullModifier, []),
        new RuleStroke(VirtualKeys.B, nullModifier, []),
      ],
      "あ",
      [],
      false
    )
  );
});

test("multiple key 2 stroke, 1 entry, no modifier", () => {
  const rule = loadJsonRule("rule", {
    extendCommonPrefixEntry: false,
    modifierGroups: [],
    entries: [
      {
        input: [
          {
            keys: ["A", "B"],
            modifiers: [],
          },
        ],
        output: "あ",
        nextInput: [],
      },
    ],
  });
  expect(rule.entries.length).toBe(2);
  expect(rule.entries[0]).toEqual(
    new RuleEntry(
      [
        new RuleStroke(
          VirtualKeys.A,
          new AndModifier(new ModifierGroup([VirtualKeys.B])),
          []
        ),
      ],
      "あ",
      [],
      false
    )
  );

  expect(rule.entries[1]).toEqual(
    new RuleEntry(
      [
        new RuleStroke(
          VirtualKeys.B,
          new AndModifier(new ModifierGroup([VirtualKeys.A])),
          []
        ),
      ],
      "あ",
      [],
      false
    )
  );
});

test("multiple key 1 stroke, 1 entry, with modifier", () => {
  const rule = loadJsonRule("rule", {
    extendCommonPrefixEntry: false,
    modifierGroups: [{ name: "$shift", keys: ["ShiftLeft", "ShiftRight"] }],
    entries: [
      {
        input: [
          {
            keys: ["A", "B"],
            modifiers: ["$shift"],
          },
        ],
        output: "あ",
        nextInput: [],
      },
    ],
  });
  expect(rule.entries.length).toBe(2);
  expect(rule.entries[0]).toEqual(
    new RuleEntry(
      [
        new RuleStroke(
          VirtualKeys.A,
          new AndModifier(
            new ModifierGroup([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight]),
            new ModifierGroup([VirtualKeys.B])
          ),
          []
        ),
      ],
      "あ",
      [],
      false
    )
  );

  expect(rule.entries[1]).toEqual(
    new RuleEntry(
      [
        new RuleStroke(
          VirtualKeys.B,
          new AndModifier(
            new ModifierGroup([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight]),
            new ModifierGroup([VirtualKeys.A])
          ),
          []
        ),
      ],
      "あ",
      [],
      false
    )
  );
});

test("multiple key 2 stroke, 1 entry, no modifier", () => {
  const rule = loadJsonRule("rule", {
    extendCommonPrefixEntry: false,
    modifierGroups: [],
    entries: [
      {
        input: [
          {
            keys: ["A", "B"],
            modifiers: [],
          },
          {
            keys: ["C"],
            modifiers: [],
          },
        ],
        output: "あ",
        nextInput: [],
      },
    ],
  });
  expect(rule.entries.length).toBe(2);
  expect(rule.entries[0]).toEqual(
    new RuleEntry(
      [
        new RuleStroke(
          VirtualKeys.A,
          new AndModifier(new ModifierGroup([VirtualKeys.B])),
          []
        ),
        new RuleStroke(VirtualKeys.C, nullModifier, []),
      ],
      "あ",
      [],
      false
    )
  );

  expect(rule.entries[1]).toEqual(
    new RuleEntry(
      [
        new RuleStroke(
          VirtualKeys.B,
          new AndModifier(new ModifierGroup([VirtualKeys.A])),
          []
        ),
        new RuleStroke(VirtualKeys.C, nullModifier, []),
      ],
      "あ",
      [],
      false
    )
  );
});

test("multiple key 1 entry, with modifier", () => {
  const rule = loadJsonRule("rule", {
    extendCommonPrefixEntry: false,
    modifierGroups: [{ name: "$shift", keys: ["ShiftLeft", "ShiftRight"] }],
    entries: [
      {
        input: [
          {
            keys: ["A", "B"],
            modifiers: ["$shift"],
          },
        ],
        output: "あ",
        nextInput: [],
      },
    ],
  });
  expect(rule.entries.length).toBe(2);
  expect(rule.entries[0]).toEqual(
    new RuleEntry(
      [
        new RuleStroke(
          VirtualKeys.A,
          new AndModifier(
            new ModifierGroup([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight]),
            new ModifierGroup([VirtualKeys.B])
          ),
          []
        ),
      ],
      "あ",
      [],
      false
    )
  );
  expect(rule.entries[1]).toEqual(
    new RuleEntry(
      [
        new RuleStroke(
          VirtualKeys.B,
          new AndModifier(
            new ModifierGroup([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight]),
            new ModifierGroup([VirtualKeys.A])
          ),
          []
        ),
      ],
      "あ",
      [],
      false
    )
  );
});
