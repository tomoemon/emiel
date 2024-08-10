// ブラウザから渡される Keyboard Event とは直接関係のない仮想的なキー一覧
// Rule を json ファイル等で定義するときに使うキーはここで定義されている値を文字列として使う
export const VirtualKeys = {
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
  Backslash: "Backslash",
  ShiftLeft: "ShiftLeft",
  Comma: "Comma",
  Period: "Period",
  Slash: "Slash",
  JpnRo: "JpnRo",
  Backquote: "Backquote",
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

export type VirtualKey = keyof typeof VirtualKeys;

export const VirtualKey = {
  getFromString: (key: string) => {
    if (key in VirtualKeys) {
      return key as VirtualKey;
    }
    throw new Error(`invalid key: ${key}`);
  }
} as const;