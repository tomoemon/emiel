import * as v from "valibot";

/**
 * ブラウザから渡される Keyboard Event とは直接関係のない、emiel 独自の仮想キー一覧。
 * Rule や KeyboardLayout を JSON 等で定義する際は、ここで定義された文字列をそのまま使う。
 * KeyboardEvent.code との対応付けは `src/browser/eventHandler.ts` が担う。
 */
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
  ControlLeft: "ControlLeft", // Control or ⌃
  Semicolon: "Semicolon",
  Quote: "Quote",
  Backslash: "Backslash",
  ShiftLeft: "ShiftLeft", // Shift or ⇧
  Comma: "Comma",
  Period: "Period",
  Slash: "Slash",
  JpnRo: "JpnRo",
  Backquote: "Backquote",
  ShiftRight: "ShiftRight", // Shift or ⇧
  AltLeft: "AltLeft", // Alt, Option or ⌥.
  MetaLeft: "MetaLeft", // The Windows, ⌘, Command or other OS symbol key.
  LangLeft: "LangLeft", // Korean: Hanja 한자 (hanja) Japanese (Mac keyboard): 英数 (eisu)
  Space: "Space",
  LangRight: "LangRight", // Korean: HangulMode 한/영 (han/yeong) Japanese (Mac keyboard): かな (kana)
  MetaRight: "MetaRight", // The Windows, ⌘, Command or other OS symbol key.
  AltRight: "AltRight", // Alt, Option or ⌥. This is labelled AltGr key on many keyboard layouts.
  ControlRight: "ControlRight", // Control or ⌃
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

/** 仮想キー識別子を表す文字列型（VirtualKeys の各キー名のユニオン）。 */
export type VirtualKey = keyof typeof VirtualKeys;

/**
 * VirtualKey 名前空間。現状は文字列から VirtualKey への変換ヘルパのみを公開する。
 */
export const VirtualKey = {
  /**
   * 文字列から VirtualKey を取得する。未知のキー名を渡した場合は例外を投げる。
   */
  getFromString: (key: string) => {
    if (key in VirtualKeys) {
      return key as VirtualKey;
    }
    throw new Error(`invalid key: ${key}`);
  },
} as const;

/** JSON ローダ等で VirtualKey を検証するための valibot スキーマ。 */
export const virtualKeySchema = v.pipe(
  v.string(),
  v.check((key) => key in VirtualKeys, "unknown virtual key"),
) as v.GenericSchema<string, VirtualKey>;
