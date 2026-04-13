import colemak from "../../assets/keyboard_layouts/colemak.json";
import { loadJsonKeyboardLayout } from "../keyboardLayoutLoader";

export function loadPresetKeyboardLayoutColemak() {
  return loadJsonKeyboardLayout(colemak);
}
