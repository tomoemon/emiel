import presetRuleShingeta from "../../assets/rules/shingeta.json";
import type { Rule } from "../../core/rule";
import { loadJsonRule } from "../jsonRuleLoader";

/** 新下駄配列 (同時押し系) のプリセット `Rule` を返す。 */
export function loadPresetRuleShingeta(): Rule {
  return loadJsonRule(presetRuleShingeta);
}
