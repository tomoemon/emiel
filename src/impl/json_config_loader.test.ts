import { expect, test } from "vitest";
import { loadFromJsonConfig } from "./json_config_loader";
import { RuleEntry } from "../core/rule";
import { VirtualKey, VirtualKeys } from "./virtual_key";
import { RuleStroke } from "../core/stroke";
import { AndModifier, ModifierGroup } from "../core/modifier";
import { prettyPrint } from "@base2/pretty-print-object";

const nullModifier = new AndModifier<VirtualKey>();

test("empty", () => {
  const rule = loadFromJsonConfig("rule", { modifierGroups: [], entries: [] });
  expect(rule.entries.length).toBe(0);
});

test("simple 1 entry", () => {
  const rule = loadFromJsonConfig("rule", {
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
  console.log(rule.entries[0]);
  expect(
    rule.entries[0].equals(
      new RuleEntry<VirtualKey>(
        [
          new RuleStroke<VirtualKey>(VirtualKeys.A, nullModifier, []),
          new RuleStroke<VirtualKey>(VirtualKeys.B, nullModifier, []),
        ],
        "あ",
        [],
        false
      )
    )
  ).toBe(true);
});

test("multiple key 2 stroke, 1 entry, no modifier", () => {
  const rule = loadFromJsonConfig("rule", {
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
  expect(
    rule.entries[0].equals(
      new RuleEntry<VirtualKey>(
        [
          new RuleStroke<VirtualKey>(
            VirtualKeys.A,
            new AndModifier(new ModifierGroup([VirtualKeys.B])),
            []
          ),
        ],
        "あ",
        [],
        false
      )
    )
  ).toBe(true);

  expect(
    rule.entries[1].equals(
      new RuleEntry<VirtualKey>(
        [
          new RuleStroke<VirtualKey>(
            VirtualKeys.B,
            new AndModifier(new ModifierGroup([VirtualKeys.A])),
            []
          ),
        ],
        "あ",
        [],
        false
      )
    )
  ).toBe(true);
});

test("multiple key 1 stroke, 1 entry, with modifier", () => {
  const rule = loadFromJsonConfig("rule", {
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
  console.log(prettyPrint(rule.entries[0]));
  expect(
    rule.entries[0].equals(
      new RuleEntry<VirtualKey>(
        [
          new RuleStroke<VirtualKey>(
            VirtualKeys.A,
            new AndModifier(
              new ModifierGroup([
                VirtualKeys.ShiftLeft,
                VirtualKeys.ShiftRight,
              ]),
              new ModifierGroup([VirtualKeys.B])
            ),
            []
          ),
        ],
        "あ",
        [],
        false
      )
    )
  ).toBe(true);

  expect(
    rule.entries[1].equals(
      new RuleEntry<VirtualKey>(
        [
          new RuleStroke<VirtualKey>(
            VirtualKeys.B,
            new AndModifier(
              new ModifierGroup([
                VirtualKeys.ShiftLeft,
                VirtualKeys.ShiftRight,
              ]),
              new ModifierGroup([VirtualKeys.A])
            ),
            []
          ),
        ],
        "あ",
        [],
        false
      )
    )
  ).toBe(true);
});

test("multiple key 2 stroke, 1 entry, no modifier", () => {
  const rule = loadFromJsonConfig("rule", {
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
  expect(
    rule.entries[0].equals(
      new RuleEntry<VirtualKey>(
        [
          new RuleStroke<VirtualKey>(
            VirtualKeys.A,
            new AndModifier(new ModifierGroup([VirtualKeys.B])),
            []
          ),
          new RuleStroke<VirtualKey>(VirtualKeys.C, nullModifier, []),
        ],
        "あ",
        [],
        false
      )
    )
  ).toBe(true);

  expect(
    rule.entries[1].equals(
      new RuleEntry<VirtualKey>(
        [
          new RuleStroke<VirtualKey>(
            VirtualKeys.B,
            new AndModifier(new ModifierGroup([VirtualKeys.A])),
            []
          ),
          new RuleStroke<VirtualKey>(VirtualKeys.C, nullModifier, []),
        ],
        "あ",
        [],
        false
      )
    )
  ).toBe(true);
});

test("multiple key 1 entry, with modifier", () => {
  const rule = loadFromJsonConfig("rule", {
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
  console.log(prettyPrint(rule.entries[0]));
  expect(
    rule.entries[0].equals(
      new RuleEntry<VirtualKey>(
        [
          new RuleStroke<VirtualKey>(
            VirtualKeys.A,
            new AndModifier(
              new ModifierGroup([
                VirtualKeys.ShiftLeft,
                VirtualKeys.ShiftRight,
              ]),
              new ModifierGroup([VirtualKeys.B])
            ),
            []
          ),
        ],
        "あ",
        [],
        false
      )
    )
  ).toBe(true);

  expect(
    rule.entries[1].equals(
      new RuleEntry<VirtualKey>(
        [
          new RuleStroke<VirtualKey>(
            VirtualKeys.B,
            new AndModifier(
              new ModifierGroup([
                VirtualKeys.ShiftLeft,
                VirtualKeys.ShiftRight,
              ]),
              new ModifierGroup([VirtualKeys.A])
            ),
            []
          ),
        ],
        "あ",
        [],
        false
      )
    )
  ).toBe(true);
});
