import presetRuleAzikRomantable from "../../assets/rules/azik.txt?raw";
import type { KeyboardLayout } from "../../core/keyboardLayout";
import type { Rule } from "../../core/rule";
import { loadMozcRule } from "../mozcRuleLoader";

export function loadPresetRuleAzikRomantable(layout: KeyboardLayout): Rule {
  return loadMozcRule(presetRuleAzikRomantable, layout);
}
