import { KeyboardState } from "../core/keyboard_state";
import { InputEvent, InputStroke, KeyEventType } from "../core/stroke";
import { VirtualKey, VirtualKeys } from "../impl/virtual_key";

/**
 * @param target Window object のようなものを受け取る
 * @param handler キー入力を受け取るハンドラ
 * @returns イベントハンドラを解除する関数を返す
 */
export function activate(
  target: EventTarget,
  handler: (evt: InputEvent<VirtualKey>) => void
) {
  const keyboardState = new KeyboardState<VirtualKey>();
  const keyDownEventHandler = (evt: Event) => {
    const now = new Date();
    const keyStroke = toInputKeyStrokeFromKeyboardEvent(
      "keydown",
      evt as KeyboardEvent,
      now
    );
    keyboardState.keydown(keyStroke.key);
    handler(new InputEvent(keyStroke, keyboardState));
  };
  const keyUpEventHandler = (evt: Event) => {
    const now = new Date();
    const keyStroke = toInputKeyStrokeFromKeyboardEvent(
      "keyup",
      evt as KeyboardEvent,
      now
    );
    keyboardState.keyup(keyStroke.key);
    // keyup は現状の仕様だと基本的に使わないのでイベントを発行しない
    // handler(new InputEvent(keyStroke, keyboardState));
  };
  target.addEventListener("keydown", keyDownEventHandler);
  target.addEventListener("keyup", keyUpEventHandler);
  return () => {
    target.removeEventListener("keydown", keyDownEventHandler);
    target.removeEventListener("keyup", keyUpEventHandler);
  };
}

function toInputKeyStrokeFromKeyboardEvent(
  evtType: KeyEventType,
  evt: KeyboardEvent,
  now: Date
): InputStroke<VirtualKey> {
  const vkey = toVirtualKeyFromEventCode(evt.code);
  return new InputStroke(vkey, evtType, now);
}

function toVirtualKeyFromEventCode(code: string): VirtualKey {
  const key = codeToVirtualKey[code];
  if (key == undefined) {
    throw new Error("invalid code: " + code);
  }
  return key;
}

const codeToVirtualKey: { [key: string]: VirtualKey } = {
  KeyA: VirtualKeys.A,
  KeyB: VirtualKeys.B,
  KeyC: VirtualKeys.C,
  KeyD: VirtualKeys.D,
  KeyE: VirtualKeys.E,
  KeyF: VirtualKeys.F,
  KeyG: VirtualKeys.G,
  KeyH: VirtualKeys.H,
  KeyI: VirtualKeys.I,
  KeyJ: VirtualKeys.J,
  KeyK: VirtualKeys.K,
  KeyL: VirtualKeys.L,
  KeyM: VirtualKeys.M,
  KeyN: VirtualKeys.N,
  KeyO: VirtualKeys.O,
  KeyP: VirtualKeys.P,
  KeyQ: VirtualKeys.Q,
  KeyR: VirtualKeys.R,
  KeyS: VirtualKeys.S,
  KeyT: VirtualKeys.T,
  KeyU: VirtualKeys.U,
  KeyV: VirtualKeys.V,
  KeyW: VirtualKeys.W,
  KeyX: VirtualKeys.X,
  KeyY: VirtualKeys.Y,
  KeyZ: VirtualKeys.Z,
  Digit1: VirtualKeys.Digit1,
  Digit2: VirtualKeys.Digit2,
  Digit3: VirtualKeys.Digit3,
  Digit4: VirtualKeys.Digit4,
  Digit5: VirtualKeys.Digit5,
  Digit6: VirtualKeys.Digit6,
  Digit7: VirtualKeys.Digit7,
  Digit8: VirtualKeys.Digit8,
  Digit9: VirtualKeys.Digit9,
  Digit0: VirtualKeys.Digit0,
  Minus: VirtualKeys.Minus,
  Equal: VirtualKeys.Equal,
  IntlYen: VirtualKeys.JpnYen,
  BracketLeft: VirtualKeys.BracketLeft,
  BracketRight: VirtualKeys.BracketRight,
  Semicolon: VirtualKeys.Semicolon,
  Quote: VirtualKeys.Quote,
  Backslash: VirtualKeys.Backslash,
  Comma: VirtualKeys.Comma,
  Period: VirtualKeys.Period,
  Slash: VirtualKeys.Slash,
  IntlRo: VirtualKeys.JpnRo,
  Tab: VirtualKeys.Tab,
  ShiftLeft: VirtualKeys.ShiftLeft,
  ShiftRight: VirtualKeys.ShiftRight,
  ControlLeft: VirtualKeys.ControlLeft,
  ControlRight: VirtualKeys.ControlRight,
  AltLeft: VirtualKeys.AltLeft,
  AltRight: VirtualKeys.AltRight,
  MetaLeft: VirtualKeys.MetaLeft,
  MetaRight: VirtualKeys.MetaRight,
  Space: VirtualKeys.Space,
  Escape: VirtualKeys.Escape,
  Lang2: VirtualKeys.Lang2,
  Lang1: VirtualKeys.Lang1,
  NonConvert: VirtualKeys.Lang2, // Windows
  Convert: VirtualKeys.Lang1, // Windows
  KanaMode: VirtualKeys.Lang1, // Windows
  OSLeft: VirtualKeys.MetaLeft, // Gecko
  OSRight: VirtualKeys.MetaRight, // Gecko
};
