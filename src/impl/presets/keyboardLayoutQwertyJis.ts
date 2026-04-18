import qwerty_jis from "../../assets/keyboard_layouts/qwerty_jis.json";
import { loadJsonKeyboardLayout } from "../keyboardLayoutLoader";

/** QWERTY JIS 配列のプリセット `KeyboardLayout` を返す。 */
export function loadPresetKeyboardLayoutQwertyJis() {
  return loadJsonKeyboardLayout(qwerty_jis);
}
