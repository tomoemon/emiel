import jis_106_default from "../../assets/keyboard_guides/jis_106_default.json";
import { loadJsonKeyboardGuide } from "../keyboardGuideLoader";

export function loadPresetKeyboardGuideJis106Default() {
  return loadJsonKeyboardGuide(jis_106_default);
}
