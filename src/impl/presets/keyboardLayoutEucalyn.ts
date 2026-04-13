import eucalyn from "../../assets/keyboard_layouts/eucalyn.json";
import { loadJsonKeyboardLayout } from "../keyboardLayoutLoader";

export function loadPresetKeyboardLayoutEucalyn() {
  return loadJsonKeyboardLayout(eucalyn);
}
