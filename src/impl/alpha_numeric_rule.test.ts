import { expect, test } from "vitest";
import { getAlphaNumericRuleByLayout } from "./alpha_numeric_rule";
import { getKeyboardLayout } from "./default_keyboard_layout";

test("import alphaNumericRule", () => {
  const alphaNumericRule = getAlphaNumericRuleByLayout(
    getKeyboardLayout("qwerty-jis")
  );
  expect(alphaNumericRule.entries.length).toBe(96);
});
