import { KeyboardLayout } from "../core/keyboard_layout";
import { Rule, RuleEntry } from "../core/rule";
import { setDefaultFunc } from "../utils/map";
import { defaultAlphaNumericNormalize } from "./char_normalizer";
import { VirtualKey } from "./virtual_key";

const alphaNumericRuleByLayout = new Map<string, Rule<VirtualKey>>();

export function getAlphaNumericRuleByLayout(
  layout: KeyboardLayout<VirtualKey>
): Rule<VirtualKey> {
  return setDefaultFunc(alphaNumericRuleByLayout, layout.name, () => {
    const entries = Array.from(layout.mapping).map(
      ([key, stroke]) => new RuleEntry<VirtualKey>([stroke], key, [], false)
    );
    return new Rule<VirtualKey>(
      "alpha-numeric",
      entries,
      layout.modifiers,
      defaultAlphaNumericNormalize
    );
  });
}
