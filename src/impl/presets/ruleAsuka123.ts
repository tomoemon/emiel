import presetRuleAsuka123 from "../../assets/rules/asuka_123.json";
import type { Rule } from "../../core/rule";
import { loadJsonRule } from "../jsonRuleLoader";

export function loadPresetRuleAsuka123(): Rule {
  return loadJsonRule(presetRuleAsuka123);
}
