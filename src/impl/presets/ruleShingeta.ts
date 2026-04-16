import presetRuleShingeta from "../../assets/rules/shingeta.json";
import type { Rule } from "../../core/rule";
import { loadJsonRule } from "../jsonRuleLoader";

export function loadPresetRuleShingeta(): Rule {
  return loadJsonRule(presetRuleShingeta);
}
