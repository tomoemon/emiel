import type { KeyboardLayout } from "../core/keyboardLayout";
import { Rule, RuleEntry } from "../core/rule";
import { defaultAlphaNumericNormalize } from "./charNormalizer";
import { loadPresetKeyboardGuideAlphanumeric } from "./presets/keyboardGuideAlphanumeric";

export function newAlphaNumericRuleByLayout(layout: KeyboardLayout): Rule {
  const entries = Array.from(layout.mapping).map(
    ([key, stroke]) => new RuleEntry([stroke], key, [], false),
  );
  return new Rule(
    entries,
    defaultAlphaNumericNormalize,
    "alphanumeric",
    undefined,
    loadPresetKeyboardGuideAlphanumeric(),
  );
}
