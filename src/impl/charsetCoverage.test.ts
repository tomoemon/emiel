import { expect, test } from "vitest";
import { AndModifier } from "../core/modifier";
import { RuleEntry, RulePrimitive } from "../core/rule";
import { SingleStroke } from "../core/ruleStroke";
import { VirtualKeys } from "../core/virtualKey";
import { coreCharset, findUntypableChars, findUntypableWords } from "./charsetCoverage";
import { createDirectInputRule } from "./directInputRule";
import { loadPresetKeyboardLayoutQwertyJis, loadPresetRuleRoman } from "./presets";

function makeRule(pairs: [keyof typeof VirtualKeys, string][]): RulePrimitive {
  return new RulePrimitive(
    pairs.map(
      ([key, output]) =>
        new RuleEntry([new SingleStroke(VirtualKeys[key], AndModifier.empty)], output, [], false),
    ),
  );
}

test("findUntypableChars は打てない文字だけを重複なく返す", () => {
  const rule = makeRule([["A", "あ"]]);
  expect(findUntypableChars(rule, "あいいあう")).toEqual(["い", "う"]);
});

test("findUntypableWords は打てない単語だけを返す", () => {
  const rule = makeRule([
    ["A", "あ"],
    ["I", "い"],
  ]);
  expect(findUntypableWords(rule, ["あい", "いう", "あ"])).toEqual(["いう"]);
});

test("ローマ字と直接入力を合成したルールでは coreCharset をすべて打てる", () => {
  const layout = loadPresetKeyboardLayoutQwertyJis();
  const rule = loadPresetRuleRoman(layout).merge(createDirectInputRule(layout));
  expect(findUntypableChars(rule, coreCharset)).toEqual([]);
});
