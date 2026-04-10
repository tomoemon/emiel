import jis_106_jis_kana from "../../assets/keyboard_guides/jis_106_jis_kana.json";
import { loadJsonKeyboardGuide } from "../keyboardGuideLoader";

export function loadPresetKeyboardGuideJis106JisKana() {
  return loadJsonKeyboardGuide(jis_106_jis_kana);
}
