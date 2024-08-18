export { KeyboardLayout } from "./core/keyboardLayout";
import { getKeyboardLayout } from "./impl/defaultKeyboardLayout";
import { loadJsonKeyboardLayout } from "./impl/keyboardLayoutLoader";
import { rules } from "./impl/defaultRules";
export { Automaton } from "./core/automaton";
export { Selector, type Inputtable } from "./core/selector";
export { Rule, RuleEntry } from "./core/rule";
export {
  RuleStroke,
  InputStroke,
  InputEvent,
} from "./core/ruleStroke";
export {
  StrokeNode,
  StrokeEdge,
} from "./core/builderStrokeGraph";
export {
  AndModifier,
  ModifierGroup,
} from "./core/modifier";
export { VirtualKey, VirtualKeys } from "./core/virtualKey";
import { loadJsonRule } from "./impl/jsonRuleLoader";
import { loadMozcRule } from "./impl/mozcRuleLoader";
export {
  KeyboardState,
  type KeyboardStateReader,
} from "./core/keyboardState";
import { detectKeyboardLayout } from "./browser/osKeyboardLayout";
import { getKeyboardGuide } from "./impl/defaultKeyboardGuide";
import { KeyboardLayout } from "./core/keyboardLayout";
import { Rule } from "./core/rule";

export { InputResult } from "./core/automaton";
export { activate } from "./browser/eventHandler";
export { KeyboardGuide, type KeyRect, type KeyTop } from "./impl/keyboardGuide";

export const keyboard = {
  detect: detectKeyboardLayout,
  loadJson: loadJsonKeyboardLayout,
  get: getKeyboardLayout,
  getQwertyJis: () => getKeyboardLayout("qwerty-jis"),
  getQwertyUs: () => getKeyboardLayout("qwerty-us"),
  getDvorak: () => getKeyboardLayout("dvorak"),
} as const;

export const guide = {
  get: getKeyboardGuide,
} as const;

export type { PhysicalKeyboardLayoutName } from "./impl/keyboardGuide";

export const rule = {
  get: rules.get,
  getRoman: (layout?: KeyboardLayout): Rule =>
    layout
      ? rules.get("roman", layout)
      : rules.get("roman", getKeyboardLayout("qwerty-jis")),
  getJisKana: (layout?: KeyboardLayout): Rule =>
    layout
      ? rules.get("jis-kana", layout)
      : rules.get("jis-kana", getKeyboardLayout("qwerty-jis")),
  loadJson: loadJsonRule,
  loadMozcRule: loadMozcRule,
};
export { stats } from "./impl/stats";
