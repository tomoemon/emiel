import dvorak from "../assets/keyboard_layouts/dvorak.json";
import qwerty_jis from "../assets/keyboard_layouts/qwerty_jis.json";
import qwerty_us from "../assets/keyboard_layouts/qwerty_us.json";
import { KeyboardLayout } from "../core/keyboard_layout";
import { loadLayoutFromJsonConfig } from "./keyboard_layout_loader";
import { VirtualKey } from "./virtual_key";

const names = ["qwerty-jis", "qwerty-us", "dvorak"] as const;
type defaultLayoutName = (typeof names)[number];

const layoutCache = new Map<defaultLayoutName, KeyboardLayout<VirtualKey>>();

export function getKeyboardLayout(
  name: defaultLayoutName
): KeyboardLayout<VirtualKey> {
  const layout = layoutCache.get(name);
  if (!layout) {
    switch (name) {
      case "qwerty-jis":
        layoutCache.set(name, loadLayoutFromJsonConfig(qwerty_jis));
        break;
      case "qwerty-us":
        layoutCache.set(name, loadLayoutFromJsonConfig(qwerty_us));
        break;
      case "dvorak":
        layoutCache.set(name, loadLayoutFromJsonConfig(dvorak));
        break;
    }
  }
  return layoutCache.get(name)!;
}

/**
 * 実際に入力されたキーと文字のマッピングから、キーボードレイアウトを推定する。
 */
export function detectKeyboardLayout(
  keyToCharResult: Map<VirtualKey, string>
): KeyboardLayout<VirtualKey> {
  if (keyToCharResult.size === 0) {
    // default
    return getKeyboardLayout("qwerty-jis");
  }
  for (const layoutName of names) {
    const layout = getKeyboardLayout(layoutName as defaultLayoutName);
    if (
      Array.from(keyToCharResult.entries()).every(([key, char]) => {
        const strokes = layout.getStrokesByChar(char);
        if (!strokes || strokes.length === 0) {
          return false;
        }
        return strokes.some(
          (stroke) => stroke.key.equals(key) && stroke.requiredModifier.isEmpty
        );
      })
    ) {
      return layout;
    }
  }
  // default
  return getKeyboardLayout("qwerty-jis");
}
