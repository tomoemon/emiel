import qwerty_us from "../../assets/keyboard_layouts/qwerty_us.json";
import { loadJsonKeyboardLayout } from "../keyboardLayoutLoader";

/** QWERTY US 配列のプリセット `KeyboardLayout` を返す。 */
export function loadPresetKeyboardLayoutQwertyUs() {
  return loadJsonKeyboardLayout(qwerty_us);
}
