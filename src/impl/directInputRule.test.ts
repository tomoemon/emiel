import { expect, test } from "vitest";
import { createDirectInputRule } from "./directInputRule";
import { loadPresetKeyboardLayoutQwertyJis } from "./presets";

test("import directInputRule", () => {
  const rule = createDirectInputRule(loadPresetKeyboardLayoutQwertyJis());
  expect(rule.entries.length).toBe(96);
});
