import type { KeyboardLayout } from "../core/keyboardLayout";
import type { VirtualKey } from "../core/virtualKey";
import { findMatchedKeyboardLayout, loadPresetKeyboardLayoutQwertyJis } from "../impl/presets";
import { toVirtualKeyFromEventCode } from "./eventHandler";

const DETECTION_LETTER_CODES = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ", (c) => `Key${c}`);

/**
 * ブラウザの Keyboard API (`navigator.keyboard.getLayoutMap()`) を使って、
 * OS に設定されたキーボード配列を推定し、対応する `KeyboardLayout` を返す。
 *
 * Keyboard API は Chrome/Edge のみ対応。未対応ブラウザでは QWERTY JIS を
 * フォールバックとして返す。
 */
export async function detectKeyboardLayout(
  window: Window & { navigator: { keyboard?: { getLayoutMap(): Promise<Map<string, string>> } } },
): Promise<KeyboardLayout> {
  // Permissions Policy で許可されていない iframe 内などでは getLayoutMap() が reject される
  const layoutMap = await window.navigator.keyboard?.getLayoutMap().catch(() => undefined);
  if (!layoutMap) {
    // Chrome, Edge にしか対応していないので、未対応の場合は Qwery JIS として返す
    // https://developer.mozilla.org/en-US/docs/Web/API/Keyboard/getLayoutMap
    return loadPresetKeyboardLayoutQwertyJis();
  }
  const keyToCharMap = new Map<VirtualKey, string>();
  // BracketLeft で JIS / US を、英字キーで Dvorak / Colemak 等の英字配列を判別する
  for (const code of ["BracketLeft", ...DETECTION_LETTER_CODES]) {
    const char = layoutMap.get(code);
    if (char) keyToCharMap.set(toVirtualKeyFromEventCode(code), char);
  }
  return findMatchedKeyboardLayout(keyToCharMap);
}
