import colemakDh from "../../assets/keyboard_layouts/colemak_dh.json";
import { loadJsonKeyboardLayout } from "../keyboardLayoutLoader";

/** Colemak-DH 配列のプリセット `KeyboardLayout` を返す。 */
export function loadPresetKeyboardLayoutColemakDh() {
  return loadJsonKeyboardLayout(colemakDh);
}
