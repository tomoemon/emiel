import type { KeyboardLayout } from "../../core/keyboardLayout";
import type { VirtualKey } from "../../core/virtualKey";
import { loadPresetKeyboardLayoutDvorak } from "./keyboardLayoutDvorak";
import { loadPresetKeyboardLayoutQwertyJis } from "./keyboardLayoutQwertyJis";
import { loadPresetKeyboardLayoutQwertyUs } from "./keyboardLayoutQwertyUs";

/**
 * 実際に入力されたキーと文字のマッピングから、キーボードレイアウトを推定する。
 */
export function findMatchedKeyboardLayout(keyToCharMap: Map<VirtualKey, string>): KeyboardLayout {
  if (keyToCharMap.size === 0) {
    // default
    return loadPresetKeyboardLayoutQwertyJis();
  }
  for (const layoutLoader of [
    loadPresetKeyboardLayoutQwertyJis,
    loadPresetKeyboardLayoutQwertyUs,
    loadPresetKeyboardLayoutDvorak,
  ]) {
    const layout = layoutLoader();
    if (
      Array.from(keyToCharMap.entries()).every(([key, char]) => {
        const charByLayout = layout.getCharByKey(key, false);
        return charByLayout === char;
      })
    ) {
      return layout;
    }
  }
  // default
  return loadPresetKeyboardLayoutQwertyJis();
}
