import { expect, test } from "vitest";
import {
  loadPresetKeyboardLayoutQwertyJis,
  loadPresetRuleJisKana,
  loadPresetRuleNicola,
  loadPresetRuleRoman,
} from "./index";

// 合成後の Rule 先頭 primitive (head) の entries 数を確認する。
// head = かな系の primitive、tail = alphanumeric primitive。
test("load google ime roman rule", () => {
  const rule = loadPresetRuleRoman(loadPresetKeyboardLayoutQwertyJis());
  expect(rule.primitives[0].entries.length).toBe(324);
});

test("load jis kana rule", () => {
  const rule = loadPresetRuleJisKana(loadPresetKeyboardLayoutQwertyJis());
  expect(rule.primitives[0].entries.length).toBe(82);
});

test("load nicola rule", () => {
  const rule = loadPresetRuleNicola(loadPresetKeyboardLayoutQwertyJis());
  // 以前は相互モディファイア展開により 1 エントリを 2 エントリに膨らませていたが、
  // SimultaneousStroke として 1 エントリで扱うようになったため件数が減少している
  expect(rule.primitives[0].entries.length).toBe(95);
});
