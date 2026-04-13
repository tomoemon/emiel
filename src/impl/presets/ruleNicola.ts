import presetRuleNicola from "../../assets/rules/nicola.json";
import type { Rule } from "../../core/rule";
import { loadJsonRule } from "../jsonRuleLoader";

export function loadPresetRuleNicola(): Rule {
  return loadJsonRule(presetRuleNicola);
}
