import { expect, test } from "vitest";
import { newAlphaNumericRuleByLayout } from "./alphaNumericRule";
import { loadPresetKeyboardLayoutQwertyJis } from "./presetKeyboardLayout";

test("import alphaNumericRule", () => {
  const alphaNumericRule = newAlphaNumericRuleByLayout(loadPresetKeyboardLayoutQwertyJis());
  expect(alphaNumericRule.entries.length).toBe(96);
});
