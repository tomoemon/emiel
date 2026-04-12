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
export { type Rule, RulePrimitive, RuleEntry, type normalizerFunc } from "./core/rule";
export { ModifierStroke, SimultaneousStroke, type RuleStroke } from "./core/ruleStroke";
export { Selector, type Inputtable } from "./core/selector";
export { VirtualKey, VirtualKeys } from "./core/virtualKey";

export { activate } from "./browser/eventHandler";
export { InputResult } from "./core/inputResult";
export {
  KeyboardGuide,
  type KeyboardGuideLabel,
  type KeyboardGuideLabelMapping,
} from "./core/keyboardGuide";
export { placeKeyboardGuide, type KeyPlacement, type Rect } from "./impl/keyboardGuide";
export {
  loadJsonPhysicalKeyboardLayout,
  type PhysicalKeyboardLayout,
} from "./impl/physicalKeyboardLayout";

export { detectKeyboardLayout } from "./browser/osKeyboardLayout";
export * from "./impl/alphaNumericRule";
export { loadJsonKeyboardLayout } from "./impl/keyboardLayoutLoader";

export { loadJsonRule } from "./impl/jsonRuleLoader";
export { loadMozcRule } from "./impl/mozcRuleLoader";

export { loadJsonKeyboardGuide } from "./impl/keyboardGuideLoader";
export * from "./impl/presets";
export * from "./impl/stats";

export {
  defaultKanaNormalize,
  defaultAlphaNumericNormalize,
  defaultComposedNormalize,
} from "./impl/charNormalizer";

export { build, type Automaton, type BaseExtensionType } from "./impl/buildAutomaton";
export { backspaceExtension, type BackspaceExtensionType } from "./impl/automatonQuery";
