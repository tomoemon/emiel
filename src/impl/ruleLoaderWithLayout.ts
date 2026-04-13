import type { KeyboardLayout } from "../core/keyboardLayout";
import type { Metadata } from "../core/metadata";
import { emptyMetadata } from "../core/metadata";
import type { Rule } from "../core/rule";
import { newAlphaNumericRuleByLayout } from "./alphaNumericRule";
import { loadJsonRule } from "./jsonRuleLoader";
import { loadMozcRule } from "./mozcRuleLoader";

export function loadMozcRuleWithLayout(
  ruleData: string,
  layout: KeyboardLayout,
  metadata: Metadata = emptyMetadata(),
): Rule {
  return loadMozcRule(ruleData, layout, metadata).compose(newAlphaNumericRuleByLayout(layout));
}

export function loadJsonRuleWithLayout(
  ruleData: unknown,
  layout: KeyboardLayout,
  metadata: Metadata = emptyMetadata(),
): Rule {
  return loadJsonRule(ruleData, metadata).compose(newAlphaNumericRuleByLayout(layout));
}
