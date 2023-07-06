import { ModifierGroup, NullModifier, Rule, RuleEntry } from "../core/rule";
import { RuleStroke } from "../core/stroke";
import { VirtualKey, VirtualKeys } from "./virtual_key";

const nullModifier = new NullModifier<VirtualKey>();

const modifierGroupSet = {
  shift: new ModifierGroup<VirtualKey>([
    VirtualKeys.ShiftLeft,
    VirtualKeys.ShiftRight,
  ]),
  control: new ModifierGroup<VirtualKey>([
    VirtualKeys.ControlLeft,
    VirtualKeys.ControlRight,
  ]),
  alt: new ModifierGroup<VirtualKey>([
    VirtualKeys.AltLeft,
    VirtualKeys.AltRight,
  ]),
  meta: new ModifierGroup<VirtualKey>([
    VirtualKeys.MetaLeft,
    VirtualKeys.MetaRight,
  ]),
};
const allAvailableModifiers = Object.values(modifierGroupSet);
const modifiersExceptShift = allAvailableModifiers.filter(
  (v) => !v.equals(modifierGroupSet.shift)
);

// Mac + JIS キーボード で取得した場合の code を前提にしている
// https://www.toptal.com/developers/keycode
const charToRuleStroke: { [key: string]: RuleStroke<VirtualKey> } = {
  a: new RuleStroke<VirtualKey>(
    VirtualKeys.A,
    nullModifier,
    allAvailableModifiers
  ),
  b: new RuleStroke<VirtualKey>(
    VirtualKeys.B,
    nullModifier,
    allAvailableModifiers
  ),
  c: new RuleStroke<VirtualKey>(
    VirtualKeys.C,
    nullModifier,
    allAvailableModifiers
  ),
  d: new RuleStroke<VirtualKey>(
    VirtualKeys.D,
    nullModifier,
    allAvailableModifiers
  ),
  e: new RuleStroke<VirtualKey>(
    VirtualKeys.E,
    nullModifier,
    allAvailableModifiers
  ),
  f: new RuleStroke<VirtualKey>(
    VirtualKeys.F,
    nullModifier,
    allAvailableModifiers
  ),
  g: new RuleStroke<VirtualKey>(
    VirtualKeys.G,
    nullModifier,
    allAvailableModifiers
  ),
  h: new RuleStroke<VirtualKey>(
    VirtualKeys.H,
    nullModifier,
    allAvailableModifiers
  ),
  i: new RuleStroke<VirtualKey>(
    VirtualKeys.I,
    nullModifier,
    allAvailableModifiers
  ),
  j: new RuleStroke<VirtualKey>(
    VirtualKeys.J,
    nullModifier,
    allAvailableModifiers
  ),
  k: new RuleStroke<VirtualKey>(
    VirtualKeys.K,
    nullModifier,
    allAvailableModifiers
  ),
  l: new RuleStroke<VirtualKey>(
    VirtualKeys.L,
    nullModifier,
    allAvailableModifiers
  ),
  m: new RuleStroke<VirtualKey>(
    VirtualKeys.M,
    nullModifier,
    allAvailableModifiers
  ),
  n: new RuleStroke<VirtualKey>(
    VirtualKeys.N,
    nullModifier,
    allAvailableModifiers
  ),
  o: new RuleStroke<VirtualKey>(
    VirtualKeys.O,
    nullModifier,
    allAvailableModifiers
  ),
  p: new RuleStroke<VirtualKey>(
    VirtualKeys.P,
    nullModifier,
    allAvailableModifiers
  ),
  q: new RuleStroke<VirtualKey>(
    VirtualKeys.Q,
    nullModifier,
    allAvailableModifiers
  ),
  r: new RuleStroke<VirtualKey>(
    VirtualKeys.R,
    nullModifier,
    allAvailableModifiers
  ),
  s: new RuleStroke<VirtualKey>(
    VirtualKeys.S,
    nullModifier,
    allAvailableModifiers
  ),
  t: new RuleStroke<VirtualKey>(
    VirtualKeys.T,
    nullModifier,
    allAvailableModifiers
  ),
  u: new RuleStroke<VirtualKey>(
    VirtualKeys.U,
    nullModifier,
    allAvailableModifiers
  ),
  v: new RuleStroke<VirtualKey>(
    VirtualKeys.V,
    nullModifier,
    allAvailableModifiers
  ),
  w: new RuleStroke<VirtualKey>(
    VirtualKeys.W,
    nullModifier,
    allAvailableModifiers
  ),
  x: new RuleStroke<VirtualKey>(
    VirtualKeys.X,
    nullModifier,
    allAvailableModifiers
  ),
  y: new RuleStroke<VirtualKey>(
    VirtualKeys.Y,
    nullModifier,
    allAvailableModifiers
  ),
  z: new RuleStroke<VirtualKey>(
    VirtualKeys.Z,
    nullModifier,
    allAvailableModifiers
  ),
  A: new RuleStroke<VirtualKey>(
    VirtualKeys.A,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  B: new RuleStroke<VirtualKey>(
    VirtualKeys.B,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  C: new RuleStroke<VirtualKey>(
    VirtualKeys.C,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  D: new RuleStroke<VirtualKey>(
    VirtualKeys.D,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  E: new RuleStroke<VirtualKey>(
    VirtualKeys.E,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  F: new RuleStroke<VirtualKey>(
    VirtualKeys.F,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  G: new RuleStroke<VirtualKey>(
    VirtualKeys.G,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  H: new RuleStroke<VirtualKey>(
    VirtualKeys.H,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  I: new RuleStroke<VirtualKey>(
    VirtualKeys.I,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  J: new RuleStroke<VirtualKey>(
    VirtualKeys.J,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  K: new RuleStroke<VirtualKey>(
    VirtualKeys.K,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  L: new RuleStroke<VirtualKey>(
    VirtualKeys.L,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  M: new RuleStroke<VirtualKey>(
    VirtualKeys.M,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  N: new RuleStroke<VirtualKey>(
    VirtualKeys.N,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  O: new RuleStroke<VirtualKey>(
    VirtualKeys.O,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  P: new RuleStroke<VirtualKey>(
    VirtualKeys.P,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  Q: new RuleStroke<VirtualKey>(
    VirtualKeys.Q,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  R: new RuleStroke<VirtualKey>(
    VirtualKeys.R,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  S: new RuleStroke<VirtualKey>(
    VirtualKeys.S,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  T: new RuleStroke<VirtualKey>(
    VirtualKeys.T,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  U: new RuleStroke<VirtualKey>(
    VirtualKeys.U,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  V: new RuleStroke<VirtualKey>(
    VirtualKeys.V,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  W: new RuleStroke<VirtualKey>(
    VirtualKeys.W,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  X: new RuleStroke<VirtualKey>(
    VirtualKeys.X,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  Y: new RuleStroke<VirtualKey>(
    VirtualKeys.Y,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  Z: new RuleStroke<VirtualKey>(
    VirtualKeys.Z,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  "1": new RuleStroke<VirtualKey>(
    VirtualKeys.Digit1,
    nullModifier,
    allAvailableModifiers
  ),
  "2": new RuleStroke<VirtualKey>(
    VirtualKeys.Digit2,
    nullModifier,
    allAvailableModifiers
  ),
  "3": new RuleStroke<VirtualKey>(
    VirtualKeys.Digit3,
    nullModifier,
    allAvailableModifiers
  ),
  "4": new RuleStroke<VirtualKey>(
    VirtualKeys.Digit4,
    nullModifier,
    allAvailableModifiers
  ),
  "5": new RuleStroke<VirtualKey>(
    VirtualKeys.Digit5,
    nullModifier,
    allAvailableModifiers
  ),
  "6": new RuleStroke<VirtualKey>(
    VirtualKeys.Digit6,
    nullModifier,
    allAvailableModifiers
  ),
  "7": new RuleStroke<VirtualKey>(
    VirtualKeys.Digit7,
    nullModifier,
    allAvailableModifiers
  ),
  "8": new RuleStroke<VirtualKey>(
    VirtualKeys.Digit8,
    nullModifier,
    allAvailableModifiers
  ),
  "9": new RuleStroke<VirtualKey>(
    VirtualKeys.Digit9,
    nullModifier,
    allAvailableModifiers
  ),
  "0": new RuleStroke<VirtualKey>(
    VirtualKeys.Digit0,
    nullModifier,
    allAvailableModifiers
  ),
  "!": new RuleStroke<VirtualKey>(
    VirtualKeys.Digit1,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  '"': new RuleStroke<VirtualKey>(
    VirtualKeys.Digit2,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  "#": new RuleStroke<VirtualKey>(
    VirtualKeys.Digit3,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  $: new RuleStroke<VirtualKey>(
    VirtualKeys.Digit4,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  "%": new RuleStroke<VirtualKey>(
    VirtualKeys.Digit5,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  "&": new RuleStroke<VirtualKey>(
    VirtualKeys.Digit6,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  "'": new RuleStroke<VirtualKey>(
    VirtualKeys.Digit7,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  "(": new RuleStroke<VirtualKey>(
    VirtualKeys.Digit8,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  ")": new RuleStroke<VirtualKey>(
    VirtualKeys.Digit9,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  "-": new RuleStroke<VirtualKey>(
    VirtualKeys.Minus,
    nullModifier,
    allAvailableModifiers
  ),
  "^": new RuleStroke<VirtualKey>(
    VirtualKeys.Equal,
    nullModifier,
    allAvailableModifiers
  ),
  "\\": new RuleStroke<VirtualKey>(
    VirtualKeys.JpnYen,
    nullModifier,
    allAvailableModifiers
  ),
  "@": new RuleStroke<VirtualKey>(
    VirtualKeys.BracketLeft,
    nullModifier,
    allAvailableModifiers
  ),
  "[": new RuleStroke<VirtualKey>(
    VirtualKeys.BracketRight,
    nullModifier,
    allAvailableModifiers
  ),
  ";": new RuleStroke<VirtualKey>(
    VirtualKeys.Semicolon,
    nullModifier,
    allAvailableModifiers
  ),
  ":": new RuleStroke<VirtualKey>(
    VirtualKeys.Quote,
    nullModifier,
    allAvailableModifiers
  ),
  "]": new RuleStroke<VirtualKey>(
    VirtualKeys.Backslash,
    nullModifier,
    allAvailableModifiers
  ),
  ",": new RuleStroke<VirtualKey>(
    VirtualKeys.Comma,
    nullModifier,
    allAvailableModifiers
  ),
  ".": new RuleStroke<VirtualKey>(
    VirtualKeys.Period,
    nullModifier,
    allAvailableModifiers
  ),
  "/": new RuleStroke<VirtualKey>(
    VirtualKeys.Slash,
    nullModifier,
    allAvailableModifiers
  ),
  "=": new RuleStroke<VirtualKey>(
    VirtualKeys.Minus,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  "~": new RuleStroke<VirtualKey>(
    VirtualKeys.Equal,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  "|": new RuleStroke<VirtualKey>(
    VirtualKeys.JpnYen,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  "`": new RuleStroke<VirtualKey>(
    VirtualKeys.BracketLeft,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  "{": new RuleStroke<VirtualKey>(
    VirtualKeys.BracketRight,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  "+": new RuleStroke<VirtualKey>(
    VirtualKeys.Semicolon,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  "*": new RuleStroke<VirtualKey>(
    VirtualKeys.Quote,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  "}": new RuleStroke<VirtualKey>(
    VirtualKeys.Backslash,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  "<": new RuleStroke<VirtualKey>(
    VirtualKeys.Comma,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  ">": new RuleStroke<VirtualKey>(
    VirtualKeys.Period,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  "?": new RuleStroke<VirtualKey>(
    VirtualKeys.Slash,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  _: new RuleStroke<VirtualKey>(
    VirtualKeys.JpnRo,
    modifierGroupSet.shift,
    modifiersExceptShift
  ),
  " ": new RuleStroke<VirtualKey>(
    VirtualKeys.Space,
    nullModifier,
    allAvailableModifiers
  ),
};

export const alphaNumericEntriesMap = new Map<string, RuleEntry<VirtualKey>>(
  Object.entries(charToRuleStroke).map(([output, stroke]) => [
    output,
    new RuleEntry<VirtualKey>([stroke], output, [], false),
  ])
);

export const alphaNumericRule = new Rule<VirtualKey>(
  "alpha-numeric",
  Array.from(alphaNumericEntriesMap.values()),
  Object.values(modifierGroupSet)
);
