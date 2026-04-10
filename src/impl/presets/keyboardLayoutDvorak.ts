import dvorak from "../../assets/keyboard_layouts/dvorak.json";
import { loadJsonKeyboardLayout } from "../keyboardLayoutLoader";

export function loadPresetKeyboardLayoutDvorak() {
  return loadJsonKeyboardLayout(dvorak);
}
