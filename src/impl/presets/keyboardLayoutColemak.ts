import colemak from "../../assets/keyboard_layouts/colemak.json";
import { loadJsonKeyboardLayout } from "../keyboardLayoutLoader";

/** Colemak 配列のプリセット `KeyboardLayout` を返す。 */
export function loadPresetKeyboardLayoutColemak() {
  return loadJsonKeyboardLayout(colemak);
}
