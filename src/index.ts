import { KeyboardLayout as coreKeyboardLayout } from "./core/keyboardLayout";
import { getKeyboardLayout } from "./impl/defaultKeyboardLayout";
import {
  loadFromJsonConfig,
  loadFromJsonConfigText,
} from "./impl/jsonConfigRuleLoader";
import {
  loadLayoutFromJsonConfig,
  loadLayoutFromJsonConfigText,
} from "./impl/keyboardLayoutLoader";
import { rules } from "./impl/defaultRules";
import { loadFromGoogleImeText } from "./impl/googleImeConfigRuleLoader";
import { Automaton as coreAutomaton } from "./core/automaton";
import { Rule as coreRule, RuleEntry as coreRuleEntry } from "./core/rule";
import { StrokeNode as coreStrokeNode } from "./core/builderStrokeGraph";
import {
  AndModifier as coreAndModifier,
  ModifierGroup as coreModifierGroup,
} from "./core/modifier";
import { VirtualKey } from "./impl/virtualKey";

export { activate } from "./browser/eventHandler";

export { buildAutomaton as build } from "./impl/builder";

export const keyboard = {
  loadFromJsonConfig: loadLayoutFromJsonConfig,
  loadFromJsonConfigText: loadLayoutFromJsonConfigText,
  get: getKeyboardLayout,
  getQwertyJis: () => getKeyboardLayout("qwerty-jis"),
  getQwertyUs: () => getKeyboardLayout("qwerty-us"),
};

export const rule = {
  loadFromText: loadFromGoogleImeText,
  loadFromJsonConfig: loadFromJsonConfig,
  loadFromJsonConfigText: loadFromJsonConfigText,
  get: rules.get,
  getRoman: (layout: KeyboardLayout) => rules.get("roman", layout),
  getJisKana: (layout: KeyboardLayout) => rules.get("jis-kana", layout),
};

export type Automaton = coreAutomaton<VirtualKey>;
export { DefaultGuide } from "./impl/defaultGuide";
export { VirtualKey } from "./impl/virtualKey";
export { VirtualKeys } from "./impl/virtualKey";
export type KeyboardLayout = coreKeyboardLayout<VirtualKey>;
export type Rule = coreRule<VirtualKey>;
export type RuleStroke = coreRule<VirtualKey>;
export type RuleEntry = coreRuleEntry<VirtualKey>;
export type StrokeNode = coreStrokeNode<VirtualKey>;
export type ModifierGroup = coreModifierGroup<VirtualKey>;
export type AndModifier = coreAndModifier<VirtualKey>;
