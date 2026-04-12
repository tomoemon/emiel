import type { KeyboardLayout } from "../core/keyboardLayout";
import { RuleEntry, RulePrimitive } from "../core/rule";
import { loadPresetKeyboardGuideAlphanumeric } from "./presets/keyboardGuideAlphanumeric";

export function newAlphaNumericRuleByLayout(layout: KeyboardLayout): RulePrimitive {
  const entries = Array.from(layout.mapping).map(
    ([key, stroke]) => new RuleEntry([stroke], key, [], false),
  );
  return new RulePrimitive(
    entries,
    "alphanumeric",
    undefined,
    loadPresetKeyboardGuideAlphanumeric(),
  );
}
