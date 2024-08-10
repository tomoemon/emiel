import dvorak from "../assets/keyboard_layouts/dvorak.json";
import qwerty_jis from "../assets/keyboard_layouts/qwerty_jis.json";
import qwerty_us from "../assets/keyboard_layouts/qwerty_us.json";
import { KeyboardLayout } from "../core/keyboardLayout";
import { loadJsonKeyboardLayout } from "./keyboardLayoutLoader";
import { VirtualKey } from "../core/virtualKey";

const names = ["qwerty-jis", "qwerty-us", "dvorak"];

const layoutCache = new Map<string, KeyboardLayout>();

export function getKeyboardLayout(
  name: string
): KeyboardLayout {
  const layout = layoutCache.get(name);
  if (!layout) {
    switch (name) {
      case "qwerty-jis":
        layoutCache.set(name, loadJsonKeyboardLayout(qwerty_jis));
        break;
      case "qwerty-us":
        layoutCache.set(name, loadJsonKeyboardLayout(qwerty_us));
        break;
      case "dvorak":
        layoutCache.set(name, loadJsonKeyboardLayout(dvorak));
        break;
    }
  }
  return layoutCache.get(name)!;
}

/**
 * 実際に入力されたキーと文字のマッピングから、キーボードレイアウトを推定する。
 */
export function findMatchedKeyboardLayout(
  keyToCharMap: Map<VirtualKey, string>
): KeyboardLayout {
  if (keyToCharMap.size === 0) {
    // default
    return getKeyboardLayout("qwerty-jis");
  }
  for (const layoutName of names) {
    const layout = getKeyboardLayout(layoutName);
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
  return getKeyboardLayout("qwerty-jis");
}
