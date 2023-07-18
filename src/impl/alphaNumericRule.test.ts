import { expect, test } from "vitest";
import { getAlphaNumericRuleByLayout } from "./alphaNumericRule";
import { getKeyboardLayout } from "./defaultKeyboardLayout";

test("import alphaNumericRule", () => {
  const alphaNumericRule = getAlphaNumericRuleByLayout(
    getKeyboardLayout("qwerty-jis")
  );
  expect(alphaNumericRule.entries.length).toBe(96);
});
