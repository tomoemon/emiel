import { KeyboardState } from "../core/keyboardState";
import { InputEvent, InputStroke, KeyEventType } from "../core/ruleStroke";
import { VirtualKey, VirtualKeys } from "../impl/virtualKey";

/**
 * @param target Window object のようなものを受け取る
 * @param handler キー入力を受け取るハンドラ
 * @returns イベントハンドラを解除する関数を返す
 */
export function activate(
  target: EventTarget,
  handler: (evt: InputEvent<VirtualKey>) => void,
  options: { ignoreKeyDown?: boolean; ignoreKeyUp?: boolean } = {
    ignoreKeyDown: false,
    ignoreKeyUp: true,
  }
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
    if (!options.ignoreKeyDown) {
      handler(
        new InputEvent(
          keyStroke,
          // キー入力ごとのその時点での KeyboardState を渡す
          new KeyboardState([...keyboardState.downedKeys])
        )
      );
    }
  };
  const keyUpEventHandler = (evt: Event) => {
    const now = new Date();
    const keyStroke = toInputKeyStrokeFromKeyboardEvent(
      "keyup",
      evt as KeyboardEvent,
      now
    );
    keyboardState.keyup(keyStroke.key);
    if (!options.ignoreKeyUp) {
      handler(
        new InputEvent(
          keyStroke,
          // キー入力ごとのその時点での KeyboardState を渡す
          new KeyboardState([...keyboardState.downedKeys])
        )
      );
    }
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
  Escape: VirtualKeys.Escape,
  F1: VirtualKeys.F1,
  F2: VirtualKeys.F2,
  F3: VirtualKeys.F3,
  F4: VirtualKeys.F4,
  F5: VirtualKeys.F5,
  F6: VirtualKeys.F6,
  F7: VirtualKeys.F7,
  F8: VirtualKeys.F8,
  F9: VirtualKeys.F9,
  F10: VirtualKeys.F10,
  F11: VirtualKeys.F11,
  F12: VirtualKeys.F12,
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
  Backspace: VirtualKeys.Backspace,
  BracketLeft: VirtualKeys.BracketLeft,
  BracketRight: VirtualKeys.BracketRight,
  Enter: VirtualKeys.Enter,
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
  Lang2: VirtualKeys.Lang2,
  Lang1: VirtualKeys.Lang1,
  NonConvert: VirtualKeys.Lang2, // Windows
  Convert: VirtualKeys.Lang1, // Windows
  KanaMode: VirtualKeys.Lang1, // Windows
  OSLeft: VirtualKeys.MetaLeft, // Gecko
  OSRight: VirtualKeys.MetaRight, // Gecko
};
