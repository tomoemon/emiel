import { expect, test } from "vitest";
import {
  loadPresetKeyboardLayoutQwertyJis,
  loadPresetRuleJisKana,
  loadPresetRuleNicola,
  loadPresetRuleRoman,
} from "./index";

// 各 preset は素の Rule を返す（directInput との合成は呼び出し側で行う）。
test("load google ime roman rule", () => {
  const rule = loadPresetRuleRoman(loadPresetKeyboardLayoutQwertyJis());
  expect(rule.primitives[0].entries.length).toBe(324);
});

test("load jis kana rule", () => {
  const rule = loadPresetRuleJisKana();
  expect(rule.primitives[0].entries.length).toBe(82);
});

test("load nicola rule", () => {
  const rule = loadPresetRuleNicola();
  // 以前は相互モディファイア展開により 1 エントリを 2 エントリに膨らませていたが、
  // SimultaneousStroke として 1 エントリで扱うようになったため件数が減少している
  expect(rule.primitives[0].entries.length).toBe(95);
});
