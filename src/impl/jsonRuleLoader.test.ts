import { expect, test } from "vitest";
import { loadJsonRule } from "./jsonRuleLoader";
import { RuleEntry } from "../core/rule";
import { RuleStroke } from "../core/ruleStroke";
import { AndModifier, ModifierGroup } from "../core/modifier";
import { VirtualKeys } from "../core/virtualKey";

test("empty", () => {
  const rule = loadJsonRule("rule", {
    extendCommonPrefixEntry: true,
    modifiers: [],
    entries: [],
  });
  expect(rule.entries.length).toBe(0);
});

test("simple 1 entry", () => {
  const rule = loadJsonRule("rule", {
    extendCommonPrefixEntry: false,
    modifiers: [],
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
        new RuleStroke(VirtualKeys.A, AndModifier.empty, ModifierGroup.empty),
        new RuleStroke(VirtualKeys.B, AndModifier.empty, ModifierGroup.empty),
      ],
      "あ",
      [],
      false
    )
  );
});

test("simple 2 entries with modifier (unnecessary modifier)", () => {
  const rule = loadJsonRule("rule", {
    extendCommonPrefixEntry: false,
    modifiers: ["ShiftLeft", "ShiftRight"],
    entries: [
      {
        input: [
          {
            keys: ["A"],
            modifiers: [["ShiftLeft", "ShiftRight"]],
          },
        ],
        output: "あ",
        nextInput: [],
      },
      {
        input: [
          {
            keys: ["I"],
            modifiers: [],
          },
        ],
        output: "い",
        nextInput: [],
      },
      {
        input: [
          {
            keys: ["U"],
            modifiers: [["ShiftLeft"]],
          },
        ],
        output: "う",
        nextInput: [],
      },
    ],
  });
  expect(rule.entries.length).toBe(3);
  expect(rule.entries[0]).toEqual(
    new RuleEntry(
      [
        new RuleStroke(VirtualKeys.A,
          new AndModifier(new ModifierGroup(["ShiftLeft", "ShiftRight"])),
          ModifierGroup.empty,
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
        new RuleStroke(VirtualKeys.I,
          AndModifier.empty,
          new ModifierGroup(["ShiftLeft", "ShiftRight"]),
        ),
      ],
      "い",
      [],
      false
    )
  );
  expect(rule.entries[2]).toEqual(
    new RuleEntry(
      [
        new RuleStroke(VirtualKeys.U,
          new AndModifier(new ModifierGroup(["ShiftLeft"])),
          new ModifierGroup(["ShiftRight"]),
        ),
      ],
      "う",
      [],
      false
    )
  );
});

test("multiple key 2 stroke, 1 entry, no modifier", () => {
  const rule = loadJsonRule("rule", {
    extendCommonPrefixEntry: false,
    modifiers: [],
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
          ModifierGroup.empty
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
          ModifierGroup.empty
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
    modifiers: ["ShiftLeft", "ShiftRight"],
    entries: [
      {
        input: [
          {
            keys: ["A", "B"],
            modifiers: [["ShiftLeft", "ShiftRight"]],
          },
        ],
        output: "あ",
        nextInput: [],
      },
      {
        input: [
          {
            keys: ["I", "ShiftLeft"],
            modifiers: [],
          },
        ],
        output: "い",
        nextInput: [],
      },
    ],
  });
  expect(rule.entries.length).toBe(4);
  expect(rule.entries[0]).toEqual(
    new RuleEntry(
      [
        new RuleStroke(
          VirtualKeys.A,
          new AndModifier(
            new ModifierGroup([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight]),
            new ModifierGroup([VirtualKeys.B])
          ),
          ModifierGroup.empty
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
          ModifierGroup.empty
        ),
      ],
      "あ",
      [],
      false
    )
  );
  // 同時押し定義によって作られた modifier も「必要な modifier」に含まれるため、
  // そのキーは unnecessary として扱われない
  expect(rule.entries[2]).toEqual(
    new RuleEntry(
      [
        new RuleStroke(
          VirtualKeys.I,
          new AndModifier(
            new ModifierGroup([VirtualKeys.ShiftLeft]),
          ),
          new ModifierGroup([VirtualKeys.ShiftRight])
        ),
      ],
      "い",
      [],
      false
    )
  );
  expect(rule.entries[3]).toEqual(
    new RuleEntry(
      [
        new RuleStroke(
          VirtualKeys.ShiftLeft,
          new AndModifier(
            new ModifierGroup([VirtualKeys.I]),
          ),
          new ModifierGroup([VirtualKeys.ShiftRight])
        ),
      ],
      "い",
      [],
      false
    )
  );
});

test("multiple key 2 stroke, 1 entry, no modifier", () => {
  const rule = loadJsonRule("rule", {
    extendCommonPrefixEntry: false,
    modifiers: [],
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
          ModifierGroup.empty
        ),
        new RuleStroke(VirtualKeys.C, AndModifier.empty, ModifierGroup.empty),
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
          ModifierGroup.empty
        ),
        new RuleStroke(VirtualKeys.C, AndModifier.empty, ModifierGroup.empty),
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
    modifiers: ["ShiftLeft", "ShiftRight"],
    entries: [
      {
        input: [
          {
            keys: ["A", "B"],
            modifiers: [["ShiftLeft", "ShiftRight"]],
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
          ModifierGroup.empty
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
          ModifierGroup.empty
        ),
      ],
      "あ",
      [],
      false
    )
  );
});
