import colemakDh from "../../assets/keyboard_layouts/colemak_dh.json";
import { loadJsonKeyboardLayout } from "../keyboardLayoutLoader";

export function loadPresetKeyboardLayoutColemakDh() {
  return loadJsonKeyboardLayout(colemakDh);
}
