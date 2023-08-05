import { KeyboardLayout as coreKeyboardLayout } from "./core/keyboardLayout";
import { getKeyboardLayout } from "./impl/defaultKeyboardLayout";
import { loadJsonKeyboardLayout } from "./impl/keyboardLayoutLoader";
import { rules } from "./impl/defaultRules";
import {
  Automaton as coreAutomaton,
  MixedTextAutomaton as coreMixedTextAutomaton,
} from "./core/automaton";
import { Selector as coreSelector } from "./core/automatonSelector";
import { Rule as coreRule, RuleEntry as coreRuleEntry } from "./core/rule";
import {
  RuleStroke as coreRuleStroke,
  InputStroke as coreInputStroke,
  InputEvent as coreInputEvent,
} from "./core/ruleStroke";
import { StrokeNode as coreStrokeNode } from "./core/builderStrokeGraph";
import {
  AndModifier as coreAndModifier,
  ModifierGroup as coreModifierGroup,
} from "./core/modifier";
import { VirtualKey } from "./impl/virtualKey";
import { loadJsonRule } from "./impl/jsonRuleLoader";
import { loadMozcRule } from "./impl/mozcRuleLoader";

export { activate } from "./browser/eventHandler";
export { detectKeyboardLayout } from "./browser/osKeyboardLayout";

export const keyboard = {
  loadJson: loadJsonKeyboardLayout,
  get: getKeyboardLayout,
  getQwertyJis: () => getKeyboardLayout("qwerty-jis"),
  getQwertyUs: () => getKeyboardLayout("qwerty-us"),
};

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

export { VirtualKey } from "./impl/virtualKey";
export { VirtualKeys } from "./impl/virtualKey";

export class KeyboardLayout extends coreKeyboardLayout<VirtualKey> {}
export class Rule extends coreRule<VirtualKey> {}
export class RuleStroke extends coreRuleStroke<VirtualKey> {}
export class RuleEntry extends coreRuleEntry<VirtualKey> {}
export class InputStroke extends coreInputStroke<VirtualKey> {}
export class InputEvent extends coreInputEvent<VirtualKey> {}
export class StrokeNode extends coreStrokeNode<VirtualKey> {}
export class ModifierGroup extends coreModifierGroup<VirtualKey> {}
export class AndModifier extends coreAndModifier<VirtualKey> {}
export class Automaton extends coreAutomaton<VirtualKey> {}
export class MixedTextAutomaton extends coreMixedTextAutomaton<VirtualKey> {}
export class Selector<T extends coreAutomaton<VirtualKey>> extends coreSelector<
  VirtualKey,
  T
> {}
