import presetRuleAsuka290 from "../../assets/rules/asuka_290.json";
import type { Rule } from "../../core/rule";
import { loadJsonRule } from "../jsonRuleLoader";

/** 飛鳥カナ配列 (290 配列) のプリセット `Rule` を返す。 */
export function loadPresetRuleAsuka290(): Rule {
  return loadJsonRule(presetRuleAsuka290);
}
