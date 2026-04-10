import qwerty_us from "../../assets/keyboard_layouts/qwerty_us.json";
import { loadJsonKeyboardLayout } from "../keyboardLayoutLoader";

export function loadPresetKeyboardLayoutQwertyUs() {
  return loadJsonKeyboardLayout(qwerty_us);
}
