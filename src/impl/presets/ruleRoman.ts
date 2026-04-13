import presetRuleGoogleImeRoman from "../../assets/rules/google_ime_default_roman.txt?raw";
import type { KeyboardLayout } from "../../core/keyboardLayout";
import type { Rule } from "../../core/rule";
import { loadMozcRule } from "../mozcRuleLoader";

export function loadPresetRuleRoman(layout: KeyboardLayout): Rule {
  return loadMozcRule(presetRuleGoogleImeRoman, layout);
}
