import onishi from "../../assets/keyboard_layouts/onishi.json";
import { loadJsonKeyboardLayout } from "../keyboardLayoutLoader";

export function loadPresetKeyboardLayoutOnishi() {
  return loadJsonKeyboardLayout(onishi);
}
