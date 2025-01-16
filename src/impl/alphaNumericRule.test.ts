import { expect, test } from "vitest";
import { getAlphaNumericRuleByLayout } from "./alphaNumericRule";
import { loadPresetKeyboardLayoutQwertyJis } from "./defaultKeyboardLayout";

test("import alphaNumericRule", () => {
  const alphaNumericRule = getAlphaNumericRuleByLayout(
    loadPresetKeyboardLayoutQwertyJis()
  );
  expect(alphaNumericRule.entries.length).toBe(96);
});
