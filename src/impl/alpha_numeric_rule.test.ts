import { expect, test } from "vitest";
import { alphaNumericRule } from "./alpha_numeric_rule";

test("import alphaNumericRule", () => {
  expect(alphaNumericRule.entries.length).toBe(95);
});
