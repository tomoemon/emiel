import roman from "../assets/rules/google_ime_default_roman.txt?raw";
import jis_kana from "../assets/rules/jis_kana.json";
import naginatashiki_v15 from "../assets/rules/naginatashiki_v15.json?raw";
import nicola from "../assets/rules/nicola.json";
import { KeyboardLayout } from "../core/keyboardLayout";
import { Rule } from "../core/rule";
import { mergeRule } from "../core/ruleMerger";
import { newAlphaNumericRuleByLayout } from "./alphaNumericRule";
import { loadJsonRule } from "./jsonRuleLoader";
import { loadMozcRule } from "./mozcRuleLoader";

export function loadPresetRuleRoman(layout: KeyboardLayout): Rule {
  return mergeRule(
    loadMozcRule("roman", roman, layout),
    newAlphaNumericRuleByLayout(layout)
  )
}

export function loadPresetRuleJisKana(layout: KeyboardLayout): Rule {
  return mergeRule(
    loadJsonRule("jis-kana", jis_kana),
    newAlphaNumericRuleByLayout(layout)
  )
}

export function loadPresetRuleNicola(layout: KeyboardLayout): Rule {
  return mergeRule(
    loadJsonRule("nicola", nicola),
    newAlphaNumericRuleByLayout(layout)
  )
}

export function loadPresetRuleNaginatashikiV15(layout: KeyboardLayout): Rule {
  return mergeRule(
    loadJsonRule("naginatashiki_v15", naginatashiki_v15),
    newAlphaNumericRuleByLayout(layout)
  )
}
