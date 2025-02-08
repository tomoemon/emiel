import { expect, test } from "vitest";
import { loadPresetKeyboardLayoutQwertyJis } from "./defaultKeyboardLayout";
import { loadPresetRuleJisKana, loadPresetRuleNicola, loadPresetRuleRoman } from "./defaultRules";

// function entryToString(entry: RuleEntry<VirtualKey>): string {
//   return (
//     entry.input.map((i) => i.key.toString()).join("") +
//     " " +
//     entry.output +
//     " " +
//     entry.nextInput.map((i) => i.key.toString()).join("")
//   );
// }

test("load google ime roman rule", () => {
  const rule = loadPresetRuleRoman(loadPresetKeyboardLayoutQwertyJis());
  // rule.entries.forEach((entry) => {
  //   console.log(entryToString(entry));
  // });
  expect(rule.entries.length).toBe(421);
});

test("load jis kana rule", () => {
  const rule = loadPresetRuleJisKana(loadPresetKeyboardLayoutQwertyJis())
  expect(rule.entries.length).toBe(178);
});

test("load nicola rule", () => {
  const rule = loadPresetRuleNicola(loadPresetKeyboardLayoutQwertyJis())
  expect(rule.entries.length).toBe(256);
});
