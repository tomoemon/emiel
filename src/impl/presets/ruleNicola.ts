import presetRuleNicola from "../../assets/rules/nicola.json";
import type { Rule } from "../../core/rule";
import { loadJsonRule } from "../jsonRuleLoader";

/** NICOLA (親指シフト) のプリセット `Rule` を返す。 */
export function loadPresetRuleNicola(): Rule {
  return loadJsonRule(presetRuleNicola);
}
