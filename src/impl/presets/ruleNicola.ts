import presetRuleNicola from "../../assets/rules/nicola.json";
import type { KeyboardLayout } from "../../core/keyboardLayout";
import type { Rule } from "../../core/rule";
import { loadJsonRuleWithLayout } from "../ruleLoaderWithLayout";

export function loadPresetRuleNicola(layout: KeyboardLayout): Rule {
  return loadJsonRuleWithLayout(presetRuleNicola, layout);
}
