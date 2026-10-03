import type { KeyEventType } from "../core/inputEvent";
import { InputEvent, InputStroke } from "../core/inputEvent";
import { KeyboardState } from "../core/keyboardState";
import { type Logger, logging } from "../core/logger";
import type { VirtualKey } from "../core/virtualKey";
import { VirtualKeys } from "../core/virtualKey";

const logActivate = logging.getLogger("keyboard.activate");
const logDeactivate = logging.getLogger("keyboard.deactivate");
const logKeyDown = logging.getLogger("keyboard.keydown");
const logKeyUp = logging.getLogger("keyboard.keyup");

/**
 * @param target addEventListener,removeEventListener を持つ Window object のような型
 * @param keyEventHandler キー操作に関するイベントハンドラ
 * @param options.handleKeyDown キーが押されたときにkeyEventHandlerを呼び出す(default: true)
 * @param options.handleKeyUp キーが離されたときにkeyEventHandlerを呼び出す(default: false)
 * @param options.keyMap 入力されたキーを別のキーへ置換するマッピング (default: {})
 * @returns イベントハンドラを解除する関数を返す
 */
export function activate(
  target: EventTarget,
  keyEventHandler: (evt: InputEvent) => void,
  keyMap: Map<VirtualKey, VirtualKey> = new Map<VirtualKey, VirtualKey>(),
) {
  const keyboardState = new KeyboardState();
  const makeHandler = (evtType: KeyEventType, logger: Logger) => (evt: Event) => {
    const keyboardEvent = evt as KeyboardEvent;
    const keyStroke = toInputKeyStrokeFromKeyboardEvent(evtType, keyboardEvent, keyMap);
    // 矢印キー等、VirtualKey に対応しないキーは無視する（リスナー内で例外を投げない）
    if (!keyStroke) return;
    keyboardState[evtType](keyStroke.key);
    if (logger.enabled) {
      logger.log({
        code: keyboardEvent.code,
        key: keyStroke.key,
        downedKeys: [...keyboardState.downedKeys],
      });
    }
    keyEventHandler(
      new InputEvent(
        keyStroke,
        // キー入力ごとのその時点での KeyboardState を渡す
        new KeyboardState([...keyboardState.downedKeys]),
        // KeyboardEvent.timeStamp はブラウザがイベントを受け取った時刻 (DOMHighResTimeStamp)。
        // ハンドラ実行時刻ではなく、イベントループ遅延を含まない。
        keyboardEvent.timeStamp,
      ),
    );
  };
  const keyDownEventHandler = makeHandler("keydown", logKeyDown);
  const keyUpEventHandler = makeHandler("keyup", logKeyUp);
  // フォーカスを失うと押下中キーの keyup が届かないため、押下状態をクリアする
  // (Shift 等が押しっぱなし扱いのまま残ると、以降の打鍵が修飾付きと判定されてしまう)
  const blurHandler = () => {
    for (const key of keyboardState.downedKeys) keyboardState.keyup(key);
  };
  target.addEventListener("keydown", keyDownEventHandler);
  target.addEventListener("keyup", keyUpEventHandler);
  target.addEventListener("blur", blurHandler);
  logActivate.log({ keyMapSize: keyMap.size });
  return () => {
    target.removeEventListener("keydown", keyDownEventHandler);
    target.removeEventListener("keyup", keyUpEventHandler);
    target.removeEventListener("blur", blurHandler);
    logDeactivate.log();
  };
}

function toInputKeyStrokeFromKeyboardEvent(
  evtType: KeyEventType,
  evt: KeyboardEvent,
  keyMap: Map<VirtualKey, VirtualKey>,
): InputStroke | undefined {
  const vkey = lookupVirtualKey(evt.code);
  if (vkey === undefined) return undefined;
  const replaced = keyMap.get(vkey) ?? vkey;
  return new InputStroke(replaced, evtType);
}

function lookupVirtualKey(code: string): VirtualKey | undefined {
  return Object.hasOwn(codeToVirtualKey, code) ? codeToVirtualKey[code] : undefined;
}

/** KeyboardEvent.code を VirtualKey に変換する。未知の code の場合は例外を投げる。 */
export function toVirtualKeyFromEventCode(code: string): VirtualKey {
  const key = lookupVirtualKey(code);
  if (key === undefined) {
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
  Backquote: VirtualKeys.Backquote,
  Numpad0: VirtualKeys.Numpad0,
  Numpad1: VirtualKeys.Numpad1,
  Numpad2: VirtualKeys.Numpad2,
  Numpad3: VirtualKeys.Numpad3,
  Numpad4: VirtualKeys.Numpad4,
  Numpad5: VirtualKeys.Numpad5,
  Numpad6: VirtualKeys.Numpad6,
  Numpad7: VirtualKeys.Numpad7,
  Numpad8: VirtualKeys.Numpad8,
  Numpad9: VirtualKeys.Numpad9,
  NumpadDecimal: VirtualKeys.NumpadDecimal,
  NumpadSubtract: VirtualKeys.NumpadSubtract,
  NumpadAdd: VirtualKeys.NumpadAdd,
  NumpadMultiply: VirtualKeys.NumpadMultiply,
  ShiftLeft: VirtualKeys.ShiftLeft,
  ShiftRight: VirtualKeys.ShiftRight,
  ControlLeft: VirtualKeys.ControlLeft,
  ControlRight: VirtualKeys.ControlRight,
  AltLeft: VirtualKeys.AltLeft,
  AltRight: VirtualKeys.AltRight,
  MetaLeft: VirtualKeys.MetaLeft,
  MetaRight: VirtualKeys.MetaRight,
  Space: VirtualKeys.Space,
  Lang2: VirtualKeys.LangLeft,
  Lang1: VirtualKeys.LangRight,
  NonConvert: VirtualKeys.LangLeft, // Windows
  Convert: VirtualKeys.LangRight, // Windows
  KanaMode: VirtualKeys.LangRight, // Windows
  OSLeft: VirtualKeys.MetaLeft, // Gecko
  OSRight: VirtualKeys.MetaRight, // Gecko
};
