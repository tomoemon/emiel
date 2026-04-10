export type {
  AutomatonState,
  InputHistoryEntry,
  BackHistoryEntry,
  HistoryEntry,
} from "./core/automatonState";
export { StrokeEdge, StrokeNode } from "./core/builderStrokeGraph";
export { InputEvent, InputStroke } from "./core/inputEvent";
export { KeyboardLayout } from "./core/keyboardLayout";
export { KeyboardState, type KeyboardStateReader } from "./core/keyboardState";
export { AndModifier, ModifierGroup } from "./core/modifier";
export { Rule, RuleEntry } from "./core/rule";
export { ModifierStroke, SimultaneousStroke, type RuleStroke } from "./core/ruleStroke";
export { Selector, type Inputtable } from "./core/selector";
export { VirtualKey, VirtualKeys } from "./core/virtualKey";

export { activate } from "./browser/eventHandler";
export { InputResult } from "./core/inputResult";
export { KeyboardGuide, type KeyRect, type KeyTop } from "./impl/keyboardGuide";

export { detectKeyboardLayout } from "./browser/osKeyboardLayout";
export * from "./impl/alphaNumericRule";
export { loadJsonKeyboardLayout } from "./impl/keyboardLayoutLoader";

export { loadJsonRule } from "./impl/jsonRuleLoader";
export { loadMozcRule } from "./impl/mozcRuleLoader";

export { loadJsonKeyboardGuide } from "./impl/keyboardGuideLoader";
export type { PhysicalKeyboardLayoutName } from "./impl/keyboardGuide";
export * from "./impl/presets";
export * from "./impl/stats";

export { build } from "./core/automaton";
export type { Automaton, BackspaceExtensionType } from "./core/automaton";
