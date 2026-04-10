import presetRuleNaginatashikiV15 from "../../assets/rules/naginatashiki_v15.json";
import type { KeyboardLayout } from "../../core/keyboardLayout";
import type { Rule } from "../../core/rule";
import { loadJsonRuleWithLayout } from "../ruleLoaderWithLayout";

export function loadPresetRuleNaginatashikiV15(layout: KeyboardLayout): Rule {
  return loadJsonRuleWithLayout(presetRuleNaginatashikiV15, layout);
}
