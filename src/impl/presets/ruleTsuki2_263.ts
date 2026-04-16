import presetRuleTsuki2_263 from "../../assets/rules/tsuki_2_263.json";
import type { Rule } from "../../core/rule";
import { loadJsonRule } from "../jsonRuleLoader";

export function loadPresetRuleTsuki2_263(): Rule {
  return loadJsonRule(presetRuleTsuki2_263);
}
