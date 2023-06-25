import { InputKeyStroke, KeyEventType } from "../impl/stroke";
import { VirtualKey, VirtualKeys } from "../impl/virtual_key";

/**
 * @param target Window object のようなものを受け取る
 * @param handler キー入力を受け取るハンドラ
 */
export function listen(
  target: EventTarget,
  handler: (evt: InputKeyStroke) => void
) {
  const now = new Date();
  target.addEventListener("keydown", (evt) => {
    handler(
      toInputKeyStrokeFromKeyboardEvent("keydown", evt as KeyboardEvent, now)
    );
  });
  target.addEventListener("keyup", (evt) => {
    handler(
      toInputKeyStrokeFromKeyboardEvent("keyup", evt as KeyboardEvent, now)
    );
  });
}

function toInputKeyStrokeFromKeyboardEvent(
  evtType: KeyEventType,
  evt: KeyboardEvent,
  now: Date
): InputKeyStroke {
  const vkey = toVirtualKeyFromEventCode(evt.code);
  return new InputKeyStroke(vkey, evtType, now);
}

function toVirtualKeyFromEventCode(code: string): VirtualKey {
  const key = codeToVirtualKey[code];
  if (key == undefined) {
    throw new Error("invalid code: " + code);
  }
  return key;
}
// Mac + JIS キーボード で取得した場合の code を前提にしている
// https://www.toptal.com/developers/keycode
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
};
