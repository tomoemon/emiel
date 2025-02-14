import { KeyboardLayout } from "../core/keyboardLayout";
import { Rule, RuleEntry } from "../core/rule";
import { defaultAlphaNumericNormalize } from "./charNormalizer";

export function newAlphaNumericRuleByLayout(
  layout: KeyboardLayout
): Rule {
  const entries = Array.from(layout.mapping).map(
    ([key, stroke]) => new RuleEntry([stroke], key, [], false)
  );
  return new Rule(
    "alpha-numeric",
    entries,
    layout.modifierGroup,
    defaultAlphaNumericNormalize
  );
}
