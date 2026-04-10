import { expect, test } from "vitest";
import {
  loadPresetKeyboardLayoutQwertyJis,
  loadPresetRuleJisKana,
  loadPresetRuleNicola,
  loadPresetRuleRoman,
} from "./index";

test("load google ime roman rule", () => {
  const rule = loadPresetRuleRoman(loadPresetKeyboardLayoutQwertyJis());
  // rule.entries.forEach((entry) => {
  //   console.log(entryToString(entry));
  // });
  expect(rule.entries.length).toBe(420);
});

test("load jis kana rule", () => {
  const rule = loadPresetRuleJisKana(loadPresetKeyboardLayoutQwertyJis());
  expect(rule.entries.length).toBe(178);
});

test("load nicola rule", () => {
  const rule = loadPresetRuleNicola(loadPresetKeyboardLayoutQwertyJis());
  // 以前は相互モディファイア展開により 1 エントリを 2 エントリに膨らませていたが、
  // SimultaneousStroke として 1 エントリで扱うようになったため件数が減少している
  expect(rule.entries.length).toBe(191);
});
