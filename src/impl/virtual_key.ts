// ブラウザから渡される Keyboard Event とは直接関係のない仮想的なキー一覧

import { Comparable } from "../core/rule";

// Rule を json ファイル等で定義するときに使うキーはここで定義されている値を文字列として使う
const virtualKeys = {
  Escape: "Escape",
  F1: "F1",
  F2: "F2",
  F3: "F3",
  F4: "F4",
  F5: "F5",
  F6: "F6",
  F7: "F7",
  F8: "F8",
  F9: "F9",
  F10: "F10",
  F11: "F11",
  F12: "F12",
  Digit1: "Digit1",
  Digit2: "Digit2",
  Digit3: "Digit3",
  Digit4: "Digit4",
  Digit5: "Digit5",
  Digit6: "Digit6",
  Digit7: "Digit7",
  Digit8: "Digit8",
  Digit9: "Digit9",
  Digit0: "Digit0",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  E: "E",
  F: "F",
  G: "G",
  H: "H",
  I: "I",
  J: "J",
  K: "K",
  L: "L",
  M: "M",
  N: "N",
  O: "O",
  P: "P",
  Q: "Q",
  R: "R",
  S: "S",
  T: "T",
  U: "U",
  V: "V",
  W: "W",
  X: "X",
  Y: "Y",
  Z: "Z",
  Minus: "Minus",
  Equal: "Equal",
  JpnYen: "JpnYen",
  Backspace: "Backspace",
  Tab: "Tab",
  BracketLeft: "BracketLeft",
  BracketRight: "BracketRight",
  Enter: "Enter",
  ControlLeft: "ControlLeft",
  Semicolon: "Semicolon",
  Quote: "Quote",
  Backquote: "Backquote",
  ShiftLeft: "ShiftLeft",
  Backslash: "Backslash",
  Comma: "Comma",
  Period: "Period",
  Slash: "Slash",
  JpnRo: "JpnRo",
  ShiftRight: "ShiftRight",
  AltLeft: "AltLeft",
  MetaLeft: "MetaLeft",
  Lang2: "Lang2",
  Space: "Space",
  Lang1: "Lang1",
  MetaRight: "MetaRight",
  AltRight: "AltRight",
  ControlRight: "ControlRight",
  CapsLock: "CapsLock",
  Pause: "Pause",
  ScrollLock: "ScrollLock",
  Numpad0: "Numpad0",
  Numpad1: "Numpad1",
  Numpad2: "Numpad2",
  Numpad3: "Numpad3",
  Numpad4: "Numpad4",
  Numpad5: "Numpad5",
  Numpad6: "Numpad6",
  Numpad7: "Numpad7",
  Numpad8: "Numpad8",
  Numpad9: "Numpad9",
  NumpadDecimal: "NumpadDecimal",
  NumpadSubtract: "NumpadSubtract",
  NumpadAdd: "NumpadAdd",
  NumpadMultiply: "NumpadMultiply",
} as const;

type virtualKey = (typeof virtualKeys)[keyof typeof virtualKeys];

export class VirtualKey implements Comparable<VirtualKey> {
  constructor(readonly key: virtualKey) {}
  equals(other: VirtualKey): boolean {
    return this.key === other.key;
  }
  toString(): string {
    return this.key;
  }
}

export const VirtualKeys = Object.fromEntries(
  Object.entries(virtualKeys).map(([_, v]: [string, virtualKey]) => [
    v,
    new VirtualKey(v),
  ])
) as {
  readonly [k in virtualKey]: VirtualKey;
};

// export type VirtualKey = (typeof VirtualKeys)[keyof typeof VirtualKeys];

export function getKeyFromString(v: string): VirtualKey {
  if (v in VirtualKeys) {
    return VirtualKeys[v as virtualKey];
  }
  throw new Error(`invalid key: ${v}`);
}
