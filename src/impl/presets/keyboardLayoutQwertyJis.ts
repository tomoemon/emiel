import qwerty_jis from "../../assets/keyboard_layouts/qwerty_jis.json";
import { loadJsonKeyboardLayout } from "../keyboardLayoutLoader";

export function loadPresetKeyboardLayoutQwertyJis() {
  return loadJsonKeyboardLayout(qwerty_jis);
}
