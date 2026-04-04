import type { KeyboardLayout } from "../core/keyboardLayout";
import type { Rule } from "../core/rule";
import { mergeRule } from "../core/ruleMerger";
import { newAlphaNumericRuleByLayout } from "./alphaNumericRule";
import type { jsonSchema} from "./jsonRuleLoader";
import { loadJsonRule } from "./jsonRuleLoader";
import { loadMozcRule } from "./mozcRuleLoader";

export function loadMozcRuleWithLayout(
  ruleData: string,
  layout: KeyboardLayout,
  name: string = "",
): Rule {
  return mergeRule(loadMozcRule(ruleData, layout), newAlphaNumericRuleByLayout(layout), name);
}

export function loadJsonRuleWithLayout(
  ruleData: string | jsonSchema,
  layout: KeyboardLayout,
  name: string = "",
): Rule {
  return mergeRule(loadJsonRule(ruleData), newAlphaNumericRuleByLayout(layout), name);
}
