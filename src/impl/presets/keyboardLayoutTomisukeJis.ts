import tomisukeJis from "../../assets/keyboard_layouts/tomisuke_jis.json";
import { loadJsonKeyboardLayout } from "../keyboardLayoutLoader";

export function loadPresetKeyboardLayoutTomisukeJis() {
  return loadJsonKeyboardLayout(tomisukeJis);
}
