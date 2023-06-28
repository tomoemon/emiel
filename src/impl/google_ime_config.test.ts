import { rules } from "./google_ime_config";
import { expect, test } from "vitest";

test("load google ime roman rule", () => {
  const rule = rules.roman;
  expect(rule.entries.length).toBe(406);
});
