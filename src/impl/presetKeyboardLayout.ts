import dvorak from "../assets/keyboard_layouts/dvorak.json";
import qwerty_jis from "../assets/keyboard_layouts/qwerty_jis.json";
import qwerty_us from "../assets/keyboard_layouts/qwerty_us.json";
import { KeyboardLayout } from "../core/keyboardLayout";
import { VirtualKey } from "../core/virtualKey";
import { loadJsonKeyboardLayout } from "./keyboardLayoutLoader";

export function loadPresetKeyboardLayoutQwertyJis() {
  return loadJsonKeyboardLayout(qwerty_jis);
}

export function loadPresetKeyboardLayoutQwertyUs() {
  return loadJsonKeyboardLayout(qwerty_us);
}

export function loadPresetKeyboardLayoutDvorak() {
  return loadJsonKeyboardLayout(dvorak);
}

/**
 * 実際に入力されたキーと文字のマッピングから、キーボードレイアウトを推定する。
 */
export function findMatchedKeyboardLayout(
  keyToCharMap: Map<VirtualKey, string>
): KeyboardLayout {
  if (keyToCharMap.size === 0) {
    // default
    return loadPresetKeyboardLayoutQwertyJis();
  }
  for (const layoutLoader of [
    loadPresetKeyboardLayoutQwertyJis,
    loadPresetKeyboardLayoutQwertyUs,
    loadPresetKeyboardLayoutDvorak
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
