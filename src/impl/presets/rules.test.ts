import { expect, test } from "vitest";
import {
  loadPresetKeyboardLayoutQwertyJis,
  loadPresetRuleAsuka123,
  loadPresetRuleAsuka290,
  loadPresetRuleAzikRomantable,
  loadPresetRuleJisKana,
  loadPresetRuleNicola,
  loadPresetRuleRoman,
  loadPresetRuleShingeta,
  loadPresetRuleTsuki2_263,
} from "./index";

// 各 preset は素の Rule を返す（directInput との合成は呼び出し側で行う）。
test("load google ime roman rule", () => {
  const rule = loadPresetRuleRoman(loadPresetKeyboardLayoutQwertyJis());
  expect(rule.entries.length).toBe(324);
});

test("load azik romantable rule", () => {
  const rule = loadPresetRuleAzikRomantable(loadPresetKeyboardLayoutQwertyJis());
  expect(rule.entries.length).toBeGreaterThan(500);
});

test("load jis kana rule", () => {
  const rule = loadPresetRuleJisKana();
  expect(rule.entries.length).toBe(82);
});

test("load nicola rule", () => {
  const rule = loadPresetRuleNicola();
  // 以前は相互モディファイア展開により 1 エントリを 2 エントリに膨らませていたが、
  // SimultaneousStroke として 1 エントリで扱うようになったため件数が減少している
  expect(rule.entries.length).toBe(95);
});

test("load asuka 123 rule", () => {
  const rule = loadPresetRuleAsuka123();
  expect(rule.entries.length).toBeGreaterThan(80);
});

test("load asuka 290 rule", () => {
  const rule = loadPresetRuleAsuka290();
  expect(rule.entries.length).toBeGreaterThan(100);
});

test("load shingeta rule", () => {
  const rule = loadPresetRuleShingeta();
  expect(rule.entries.length).toBeGreaterThan(80);
});

test("load tsuki 2-263 rule", () => {
  const rule = loadPresetRuleTsuki2_263();
  expect(rule.entries.length).toBeGreaterThan(100);
});
