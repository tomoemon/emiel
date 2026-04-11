import type { KeyboardLayout } from "../core/keyboardLayout";
import type { Rule } from "../core/rule";
import { newAlphaNumericRuleByLayout } from "./alphaNumericRule";
import { loadJsonRule } from "./jsonRuleLoader";
import { loadMozcRule } from "./mozcRuleLoader";

export function loadMozcRuleWithLayout(
  ruleData: string,
  layout: KeyboardLayout,
  name: string = "",
): Rule {
  return loadMozcRule(ruleData, layout, name, newAlphaNumericRuleByLayout(layout));
}

export function loadJsonRuleWithLayout(
  ruleData: unknown,
  layout: KeyboardLayout,
  name: string = "",
): Rule {
  return loadJsonRule(ruleData, name, newAlphaNumericRuleByLayout(layout));
}
