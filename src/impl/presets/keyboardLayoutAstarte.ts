import astarte from "../../assets/keyboard_layouts/astarte.json";
import { loadJsonKeyboardLayout } from "../keyboardLayoutLoader";

export function loadPresetKeyboardLayoutAstarte() {
  return loadJsonKeyboardLayout(astarte);
}
