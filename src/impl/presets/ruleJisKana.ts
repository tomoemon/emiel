import presetRuleJisKana from "../../assets/rules/jis_kana.json";
import type { KeyboardLayout } from "../../core/keyboardLayout";
import type { Rule } from "../../core/rule";
import { loadJsonRuleWithLayout } from "../ruleLoaderWithLayout";

export function loadPresetRuleJisKana(layout: KeyboardLayout): Rule {
  return loadJsonRuleWithLayout(presetRuleJisKana, layout);
}
