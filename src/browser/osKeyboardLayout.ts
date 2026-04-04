import { VirtualKeys } from "..";
import type { KeyboardLayout } from "../core/keyboardLayout";
import {
  findMatchedKeyboardLayout,
  loadPresetKeyboardLayoutQwertyJis,
} from "../impl/presetKeyboardLayout";

export async function detectKeyboardLayout(
  window: Window & { navigator: { keyboard?: { getLayoutMap(): Promise<Map<string, string>> } } },
): Promise<KeyboardLayout> {
  const layoutMap = await window.navigator.keyboard?.getLayoutMap();
  if (!layoutMap) {
    // Chrome, Edge にしか対応していないので、未対応の場合は Qwery JIS として返す
    // https://developer.mozilla.org/en-US/docs/Web/API/Keyboard/getLayoutMap
    return loadPresetKeyboardLayoutQwertyJis();
  }
  const keyToCharMap = new Map<(typeof VirtualKeys)[keyof typeof VirtualKeys], string>();
  const bracketLeft = layoutMap.get("BracketLeft");
  if (bracketLeft) keyToCharMap.set(VirtualKeys.BracketLeft, bracketLeft);
  const z = layoutMap.get("KeyZ");
  if (z) keyToCharMap.set(VirtualKeys.Z, z);
  const layout = findMatchedKeyboardLayout(keyToCharMap);
  return layout;
}
