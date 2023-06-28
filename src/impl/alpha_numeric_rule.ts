import { ModifierGroup, NullModifier, Rule, RuleEntry } from "../core/rule";
import { RuleStroke } from "../core/stroke";
import { VirtualKey, VirtualKeys } from "./virtual_key";

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

function build(): Rule<VirtualKey> {
  const entries: RuleEntry<VirtualKey>[] = [];
  Object.entries(charToRuleStroke).forEach(([key, stroke]) => {
    entries.push(new RuleEntry([stroke], key, []));
  });
  return new Rule("alpha_numeric", entries, Object.values(modifierGroupSet));
}

// Mac + JIS キーボード で取得した場合の code を前提にしている
// https://www.toptal.com/developers/keycode
const charToRuleStroke: { [key: string]: RuleStroke<VirtualKey> } = {
  a: new RuleStroke<VirtualKey>([VirtualKeys.A], new NullModifier()),
  b: new RuleStroke<VirtualKey>([VirtualKeys.B], new NullModifier()),
  c: new RuleStroke<VirtualKey>([VirtualKeys.C], new NullModifier()),
  d: new RuleStroke<VirtualKey>([VirtualKeys.D], new NullModifier()),
  e: new RuleStroke<VirtualKey>([VirtualKeys.E], new NullModifier()),
  f: new RuleStroke<VirtualKey>([VirtualKeys.F], new NullModifier()),
  g: new RuleStroke<VirtualKey>([VirtualKeys.G], new NullModifier()),
  h: new RuleStroke<VirtualKey>([VirtualKeys.H], new NullModifier()),
  i: new RuleStroke<VirtualKey>([VirtualKeys.I], new NullModifier()),
  j: new RuleStroke<VirtualKey>([VirtualKeys.J], new NullModifier()),
  k: new RuleStroke<VirtualKey>([VirtualKeys.K], new NullModifier()),
  l: new RuleStroke<VirtualKey>([VirtualKeys.L], new NullModifier()),
  m: new RuleStroke<VirtualKey>([VirtualKeys.M], new NullModifier()),
  n: new RuleStroke<VirtualKey>([VirtualKeys.N], new NullModifier()),
  o: new RuleStroke<VirtualKey>([VirtualKeys.O], new NullModifier()),
  p: new RuleStroke<VirtualKey>([VirtualKeys.P], new NullModifier()),
  q: new RuleStroke<VirtualKey>([VirtualKeys.Q], new NullModifier()),
  r: new RuleStroke<VirtualKey>([VirtualKeys.R], new NullModifier()),
  s: new RuleStroke<VirtualKey>([VirtualKeys.S], new NullModifier()),
  t: new RuleStroke<VirtualKey>([VirtualKeys.T], new NullModifier()),
  u: new RuleStroke<VirtualKey>([VirtualKeys.U], new NullModifier()),
  v: new RuleStroke<VirtualKey>([VirtualKeys.V], new NullModifier()),
  w: new RuleStroke<VirtualKey>([VirtualKeys.W], new NullModifier()),
  x: new RuleStroke<VirtualKey>([VirtualKeys.X], new NullModifier()),
  y: new RuleStroke<VirtualKey>([VirtualKeys.Y], new NullModifier()),
  z: new RuleStroke<VirtualKey>([VirtualKeys.Z], new NullModifier()),
  A: new RuleStroke<VirtualKey>([VirtualKeys.A], modifierGroupSet.shift),
  B: new RuleStroke<VirtualKey>([VirtualKeys.B], modifierGroupSet.shift),
  C: new RuleStroke<VirtualKey>([VirtualKeys.C], modifierGroupSet.shift),
  D: new RuleStroke<VirtualKey>([VirtualKeys.D], modifierGroupSet.shift),
  E: new RuleStroke<VirtualKey>([VirtualKeys.E], modifierGroupSet.shift),
  F: new RuleStroke<VirtualKey>([VirtualKeys.F], modifierGroupSet.shift),
  G: new RuleStroke<VirtualKey>([VirtualKeys.G], modifierGroupSet.shift),
  H: new RuleStroke<VirtualKey>([VirtualKeys.H], modifierGroupSet.shift),
  I: new RuleStroke<VirtualKey>([VirtualKeys.I], modifierGroupSet.shift),
  J: new RuleStroke<VirtualKey>([VirtualKeys.J], modifierGroupSet.shift),
  K: new RuleStroke<VirtualKey>([VirtualKeys.K], modifierGroupSet.shift),
  L: new RuleStroke<VirtualKey>([VirtualKeys.L], modifierGroupSet.shift),
  M: new RuleStroke<VirtualKey>([VirtualKeys.M], modifierGroupSet.shift),
  N: new RuleStroke<VirtualKey>([VirtualKeys.N], modifierGroupSet.shift),
  O: new RuleStroke<VirtualKey>([VirtualKeys.O], modifierGroupSet.shift),
  P: new RuleStroke<VirtualKey>([VirtualKeys.P], modifierGroupSet.shift),
  Q: new RuleStroke<VirtualKey>([VirtualKeys.Q], modifierGroupSet.shift),
  R: new RuleStroke<VirtualKey>([VirtualKeys.R], modifierGroupSet.shift),
  S: new RuleStroke<VirtualKey>([VirtualKeys.S], modifierGroupSet.shift),
  T: new RuleStroke<VirtualKey>([VirtualKeys.T], modifierGroupSet.shift),
  U: new RuleStroke<VirtualKey>([VirtualKeys.U], modifierGroupSet.shift),
  V: new RuleStroke<VirtualKey>([VirtualKeys.V], modifierGroupSet.shift),
  W: new RuleStroke<VirtualKey>([VirtualKeys.W], modifierGroupSet.shift),
  X: new RuleStroke<VirtualKey>([VirtualKeys.X], modifierGroupSet.shift),
  Y: new RuleStroke<VirtualKey>([VirtualKeys.Y], modifierGroupSet.shift),
  Z: new RuleStroke<VirtualKey>([VirtualKeys.Z], modifierGroupSet.shift),
  "1": new RuleStroke<VirtualKey>([VirtualKeys.Digit1], new NullModifier()),
  "2": new RuleStroke<VirtualKey>([VirtualKeys.Digit2], new NullModifier()),
  "3": new RuleStroke<VirtualKey>([VirtualKeys.Digit3], new NullModifier()),
  "4": new RuleStroke<VirtualKey>([VirtualKeys.Digit4], new NullModifier()),
  "5": new RuleStroke<VirtualKey>([VirtualKeys.Digit5], new NullModifier()),
  "6": new RuleStroke<VirtualKey>([VirtualKeys.Digit6], new NullModifier()),
  "7": new RuleStroke<VirtualKey>([VirtualKeys.Digit7], new NullModifier()),
  "8": new RuleStroke<VirtualKey>([VirtualKeys.Digit8], new NullModifier()),
  "9": new RuleStroke<VirtualKey>([VirtualKeys.Digit9], new NullModifier()),
  "0": new RuleStroke<VirtualKey>([VirtualKeys.Digit0], new NullModifier()),
  "!": new RuleStroke<VirtualKey>([VirtualKeys.Digit1], modifierGroupSet.shift),
  '"': new RuleStroke<VirtualKey>([VirtualKeys.Digit2], modifierGroupSet.shift),
  "#": new RuleStroke<VirtualKey>([VirtualKeys.Digit3], modifierGroupSet.shift),
  $: new RuleStroke<VirtualKey>([VirtualKeys.Digit4], modifierGroupSet.shift),
  "%": new RuleStroke<VirtualKey>([VirtualKeys.Digit5], modifierGroupSet.shift),
  "&": new RuleStroke<VirtualKey>([VirtualKeys.Digit6], modifierGroupSet.shift),
  "'": new RuleStroke<VirtualKey>([VirtualKeys.Digit7], modifierGroupSet.shift),
  "(": new RuleStroke<VirtualKey>([VirtualKeys.Digit8], modifierGroupSet.shift),
  ")": new RuleStroke<VirtualKey>([VirtualKeys.Digit9], modifierGroupSet.shift),
  "-": new RuleStroke<VirtualKey>([VirtualKeys.Minus], new NullModifier()),
  "^": new RuleStroke<VirtualKey>([VirtualKeys.Equal], new NullModifier()),
  "\\": new RuleStroke<VirtualKey>([VirtualKeys.JpnYen], new NullModifier()),
  "@": new RuleStroke<VirtualKey>(
    [VirtualKeys.BracketLeft],
    new NullModifier()
  ),
  "[": new RuleStroke<VirtualKey>(
    [VirtualKeys.BracketRight],
    new NullModifier()
  ),
  ";": new RuleStroke<VirtualKey>([VirtualKeys.Semicolon], new NullModifier()),
  ":": new RuleStroke<VirtualKey>([VirtualKeys.Quote], new NullModifier()),
  "]": new RuleStroke<VirtualKey>([VirtualKeys.Backslash], new NullModifier()),
  ",": new RuleStroke<VirtualKey>([VirtualKeys.Comma], new NullModifier()),
  ".": new RuleStroke<VirtualKey>([VirtualKeys.Period], new NullModifier()),
  "/": new RuleStroke<VirtualKey>([VirtualKeys.Slash], new NullModifier()),
  "=": new RuleStroke<VirtualKey>([VirtualKeys.Minus], modifierGroupSet.shift),
  "~": new RuleStroke<VirtualKey>([VirtualKeys.Equal], modifierGroupSet.shift),
  "|": new RuleStroke<VirtualKey>([VirtualKeys.JpnYen], modifierGroupSet.shift),
  "`": new RuleStroke<VirtualKey>(
    [VirtualKeys.BracketLeft],
    modifierGroupSet.shift
  ),
  "{": new RuleStroke<VirtualKey>(
    [VirtualKeys.BracketRight],
    modifierGroupSet.shift
  ),
  "+": new RuleStroke<VirtualKey>(
    [VirtualKeys.Semicolon],
    modifierGroupSet.shift
  ),
  "*": new RuleStroke<VirtualKey>([VirtualKeys.Quote], modifierGroupSet.shift),
  "}": new RuleStroke<VirtualKey>(
    [VirtualKeys.Backslash],
    modifierGroupSet.shift
  ),
  "<": new RuleStroke<VirtualKey>([VirtualKeys.Comma], modifierGroupSet.shift),
  ">": new RuleStroke<VirtualKey>([VirtualKeys.Period], modifierGroupSet.shift),
  "?": new RuleStroke<VirtualKey>([VirtualKeys.Slash], modifierGroupSet.shift),
  _: new RuleStroke<VirtualKey>([VirtualKeys.JpnRo], modifierGroupSet.shift),
};

export const alphaNumericRule = build();
