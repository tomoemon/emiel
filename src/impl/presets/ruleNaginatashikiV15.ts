import presetRuleNaginatashikiV15 from "../../assets/rules/naginatashiki_v15.json";
import type { Rule } from "../../core/rule";
import { loadJsonRule } from "../jsonRuleLoader";

/** 薙刀式 V15 (同時押し系) のプリセット `Rule` を返す。 */
export function loadPresetRuleNaginatashikiV15(): Rule {
  return loadJsonRule(presetRuleNaginatashikiV15);
}
