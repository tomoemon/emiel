import dvorak from "../../assets/keyboard_layouts/dvorak.json";
import { loadJsonKeyboardLayout } from "../keyboardLayoutLoader";

/** Dvorak 配列のプリセット `KeyboardLayout` を返す。 */
export function loadPresetKeyboardLayoutDvorak() {
  return loadJsonKeyboardLayout(dvorak);
}
