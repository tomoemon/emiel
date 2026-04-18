import presetRuleJisKana from "../../assets/rules/jis_kana.json";
import type { Rule } from "../../core/rule";
import { loadJsonRule } from "../jsonRuleLoader";

/** JIS かな入力のプリセット `Rule` を返す。 */
export function loadPresetRuleJisKana(): Rule {
  return loadJsonRule(presetRuleJisKana);
}
