import presetRuleTsuki2_263 from "../../assets/rules/tsuki_2_263.json";
import type { Rule } from "../../core/rule";
import { loadJsonRule } from "../jsonRuleLoader";

/** 月配列 2-263 のプリセット `Rule` を返す。 */
export function loadPresetRuleTsuki2_263(): Rule {
  return loadJsonRule(presetRuleTsuki2_263);
}
