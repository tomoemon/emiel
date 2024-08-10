import { KeyboardLayout } from "../core/keyboardLayout";
import { Rule, RuleEntry } from "../core/rule";
import { setDefaultFunc } from "../utils/map";
import { defaultAlphaNumericNormalize } from "./charNormalizer";

const alphaNumericRuleByLayout = new Map<string, Rule>();

export function getAlphaNumericRuleByLayout(
  layout: KeyboardLayout
): Rule {
  return setDefaultFunc(alphaNumericRuleByLayout, layout.name, () => {
    const entries = Array.from(layout.mapping).map(
      ([key, stroke]) => new RuleEntry([stroke], key, [], false)
    );
    return new Rule(
      "alpha-numeric",
      entries,
      layout.modifiers,
      defaultAlphaNumericNormalize
    );
  });
}
