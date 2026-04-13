import presetRuleNaginatashikiV15 from "../../assets/rules/naginatashiki_v15.json";
import type { Rule } from "../../core/rule";
import { loadJsonRule } from "../jsonRuleLoader";

export function loadPresetRuleNaginatashikiV15(): Rule {
  return loadJsonRule(presetRuleNaginatashikiV15);
}
