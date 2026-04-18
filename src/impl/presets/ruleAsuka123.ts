import presetRuleAsuka123 from "../../assets/rules/asuka_123.json";
import type { Rule } from "../../core/rule";
import { loadJsonRule } from "../jsonRuleLoader";

/** 飛鳥カナ配列 (123 配列) のプリセット `Rule` を返す。 */
export function loadPresetRuleAsuka123(): Rule {
  return loadJsonRule(presetRuleAsuka123);
}
