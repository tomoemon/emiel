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

test("nicola: 「ね」のキー (Comma) と親指の同時押しで「む」「ぺ」を出力する", () => {
  const rule = loadPresetRuleNicola();
  const outputsOf = (keys: string[]) =>
    rule.rawEntries
      .filter((e) => {
        const s = e.input[0];
        return (
          e.input.length === 1 &&
          s.kind === "simultaneous" &&
          s.keys.length === keys.length &&
          keys.every((k) => s.keys.includes(k as (typeof s.keys)[number]))
        );
      })
      .map((e) => e.output);
  expect(outputsOf(["Comma", "LangRight"])).toEqual(["む"]);
  expect(outputsOf(["Comma", "LangLeft"])).toEqual(["ぺ"]);
  expect(outputsOf(["Semicolon", "LangRight"])).toEqual(["っ"]);
  expect(outputsOf(["Semicolon", "LangLeft"])).toEqual([]);
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
