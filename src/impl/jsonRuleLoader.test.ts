import * as v from "valibot";
import { describe, expect, test } from "vitest";
import { AndModifier, ModifierGroup } from "../core/modifier";
import { RuleEntry } from "../core/rule";
import { ModifierStroke, SimultaneousStroke } from "../core/ruleStroke";
import { VirtualKeys } from "../core/virtualKey";
import { loadJsonRule } from "./jsonRuleLoader";

test("empty", () => {
  const rule = loadJsonRule({
    extendCommonPrefixEntry: true,
    entries: [],
  });
  expect(rule.entries.length).toBe(0);
});

test("simple 1 entry", () => {
  const rule = loadJsonRule({
    extendCommonPrefixEntry: false,
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
        new ModifierStroke(VirtualKeys.A, AndModifier.empty),
        new ModifierStroke(VirtualKeys.B, AndModifier.empty),
      ],
      "あ",
      [],
      false,
    ),
  );
});

test("simple 2 entries with modifier (unnecessary modifier)", () => {
  const rule = loadJsonRule({
    extendCommonPrefixEntry: false,
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
        new ModifierStroke(
          VirtualKeys.A,
          new AndModifier(new ModifierGroup(["ShiftLeft", "ShiftRight"])),
        ),
      ],
      "あ",
      [],
      false,
    ),
  );
  expect(rule.entries[1]).toEqual(
    new RuleEntry([new ModifierStroke(VirtualKeys.I, AndModifier.empty)], "い", [], false),
  );
  expect(rule.entries[2]).toEqual(
    new RuleEntry(
      [new ModifierStroke(VirtualKeys.U, new AndModifier(new ModifierGroup(["ShiftLeft"])))],
      "う",
      [],
      false,
    ),
  );
});

test("simultaneous stroke, 1 entry, no modifier", () => {
  const rule = loadJsonRule({
    extendCommonPrefixEntry: false,
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
  // 新仕様: 複数キーは SimultaneousStroke 1 個として読み込まれる (相互モディファイア展開はしない)
  expect(rule.entries.length).toBe(1);
  expect(rule.entries[0]).toEqual(
    new RuleEntry([new SimultaneousStroke([VirtualKeys.A, VirtualKeys.B])], "あ", [], false),
  );
});

test("simultaneous stroke with modifier: 同時押し + 先押し modifier", () => {
  // naginata の A+J 同時押し + Space 先押しのようなケース。
  // SimultaneousStroke が requiredModifier を持つ 1 エントリとして読み込まれる。
  const rule = loadJsonRule({
    extendCommonPrefixEntry: false,
    entries: [
      {
        input: [
          {
            keys: ["A", "B"],
            modifiers: [["Space"]],
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
        new SimultaneousStroke(
          [VirtualKeys.A, VirtualKeys.B],
          new AndModifier(new ModifierGroup([VirtualKeys.Space])),
        ),
      ],
      "あ",
      [],
      false,
    ),
  );
});

test("simultaneous stroke followed by single-key stroke, 1 entry", () => {
  const rule = loadJsonRule({
    extendCommonPrefixEntry: false,
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
  // 新仕様: SimultaneousStroke と ModifierStroke を並べた 1 エントリ
  expect(rule.entries.length).toBe(1);
  expect(rule.entries[0]).toEqual(
    new RuleEntry(
      [
        new SimultaneousStroke([VirtualKeys.A, VirtualKeys.B]),
        new ModifierStroke(VirtualKeys.C, AndModifier.empty),
      ],
      "あ",
      [],
      false,
    ),
  );
});

describe("validation errors", () => {
  // バリデーションテストでは意図的に不正なデータを渡すため unknown にキャスト
  const load = loadJsonRule as (data: unknown) => ReturnType<typeof loadJsonRule>;

  test("entries is missing", () => {
    expect(() => load({})).toThrow(v.ValiError);
  });

  test("entries is not an array", () => {
    expect(() => load({ entries: "not array" })).toThrow(v.ValiError);
  });

  test("entry.output is missing", () => {
    expect(() =>
      load({
        entries: [{ input: [{ keys: ["A"] }] }],
      }),
    ).toThrow(v.ValiError);
  });

  test("entry.output is not a string", () => {
    expect(() =>
      load({
        entries: [{ input: [{ keys: ["A"] }], output: 123 }],
      }),
    ).toThrow(v.ValiError);
  });

  test("unknown virtual key", () => {
    expect(() =>
      load({
        entries: [{ input: [{ keys: ["InvalidKey"] }], output: "あ" }],
      }),
    ).toThrow(v.ValiError);
  });

  test("empty keys array", () => {
    expect(() =>
      load({
        entries: [{ input: [{ keys: [] }], output: "あ" }],
      }),
    ).toThrow(v.ValiError);
  });

  test("JSON string with invalid data", () => {
    expect(() => loadJsonRule('{"entries": "not array"}')).toThrow(v.ValiError);
  });

  test("comment-only entry is valid", () => {
    const rule = loadJsonRule({
      entries: [{ comment: "this is a comment" }],
    });
    expect(rule.entries.length).toBe(0);
  });
});

describe("backspaces field", () => {
  test("omitted backspaces defaults to Backspace key only", () => {
    const rule = loadJsonRule({
      entries: [{ input: [{ keys: ["A"] }], output: "あ" }],
    });
    // JSON で backspaces を指定しなければ、Rule 側のデフォルト (Backspace 単独) が適用される
    expect(rule.backspaceStrokes.length).toBe(1);
    expect(rule.backspaceStrokes[0]).toEqual(
      new ModifierStroke(VirtualKeys.Backspace, AndModifier.empty),
    );
  });

  test("explicit backspaces replaces the default entirely", () => {
    const rule = loadJsonRule({
      entries: [{ input: [{ keys: ["A"] }], output: "あ" }],
      backspaces: [{ keys: ["U"] }],
    });
    // 明示的に指定した場合はその指定のみ (Backspace は自動追加されない)
    expect(rule.backspaceStrokes.length).toBe(1);
    expect(rule.backspaceStrokes[0]).toEqual(new ModifierStroke(VirtualKeys.U, AndModifier.empty));
  });

  test("empty backspaces array disables backspace feature", () => {
    const rule = loadJsonRule({
      entries: [{ input: [{ keys: ["A"] }], output: "あ" }],
      backspaces: [],
    });
    expect(rule.backspaceStrokes.length).toBe(0);
  });

  test("simultaneous backspace stroke (2 keys) is parsed as SimultaneousStroke", () => {
    const rule = loadJsonRule({
      entries: [{ input: [{ keys: ["A"] }], output: "あ" }],
      backspaces: [{ keys: ["U", "F"] }],
    });
    expect(rule.backspaceStrokes.length).toBe(1);
    expect(rule.backspaceStrokes[0]).toEqual(
      new SimultaneousStroke([VirtualKeys.U, VirtualKeys.F], AndModifier.empty),
    );
  });

  test("backspace stroke with required modifier", () => {
    const rule = loadJsonRule({
      entries: [{ input: [{ keys: ["A"] }], output: "あ" }],
      backspaces: [{ keys: ["U"], modifiers: [["ShiftLeft", "ShiftRight"]] }],
    });
    expect(rule.backspaceStrokes.length).toBe(1);
    expect(rule.backspaceStrokes[0]).toEqual(
      new ModifierStroke(
        VirtualKeys.U,
        new AndModifier(new ModifierGroup([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])),
      ),
    );
  });
});
