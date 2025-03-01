import presetRuleGoogleImeRoman from "../assets/rules/google_ime_default_roman.txt?raw";
import presetRuleJisKana from "../assets/rules/jis_kana.json";
import presetRuleNaginatashikiV15 from "../assets/rules/naginatashiki_v15.json";
import presetRuleNicola from "../assets/rules/nicola.json";
import { KeyboardLayout } from "../core/keyboardLayout";
import { Rule } from "../core/rule";
import { loadJsonRuleWithLayout, loadMozcRuleWithLayout } from "./ruleLoaderWithLayout";


export function loadPresetRuleRoman(layout: KeyboardLayout): Rule {
  return loadMozcRuleWithLayout(presetRuleGoogleImeRoman, layout);
}

export function loadPresetRuleJisKana(layout: KeyboardLayout): Rule {
  return loadJsonRuleWithLayout(presetRuleJisKana, layout);
}

export function loadPresetRuleNaginatashikiV15(layout: KeyboardLayout): Rule {
  return loadJsonRuleWithLayout(presetRuleNaginatashikiV15, layout);
}

export function loadPresetRuleNicola(layout: KeyboardLayout): Rule {
  return loadJsonRuleWithLayout(presetRuleNicola, layout);
}
