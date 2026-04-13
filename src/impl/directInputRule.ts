import type { KeyboardLayout } from "../core/keyboardLayout";
import { RuleEntry, RulePrimitive } from "../core/rule";
import { loadPresetKeyboardGuideDirectInput } from "./presets/keyboardGuideDirectInput";

export function createDirectInputRule(layout: KeyboardLayout): RulePrimitive {
  const entries = Array.from(layout.mapping).map(
    ([key, stroke]) => new RuleEntry([stroke], key, [], false),
  );
  return new RulePrimitive(
    entries,
    { name: "directInput", url: "" },
    undefined,
    loadPresetKeyboardGuideDirectInput(),
  );
}
