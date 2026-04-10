import presetRuleGoogleImeRoman from "../../assets/rules/google_ime_default_roman.txt?raw";
import type { KeyboardLayout } from "../../core/keyboardLayout";
import type { Rule } from "../../core/rule";
import { loadMozcRuleWithLayout } from "../ruleLoaderWithLayout";

export function loadPresetRuleRoman(layout: KeyboardLayout): Rule {
  return loadMozcRuleWithLayout(presetRuleGoogleImeRoman, layout);
}
