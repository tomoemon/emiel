import jis_106_default from "../assets/keyboard_guides/jis_106_default.json";
import jis_106_jis_kana from "../assets/keyboard_guides/jis_106_jis_kana.json";
import jis_106_nicola from "../assets/keyboard_guides/jis_106_nicola.json";
import us_101_default from "../assets/keyboard_guides/us_101_default.json";
import us_hhkb_default from "../assets/keyboard_guides/us_hhkb_default.json";
import { loadJsonKeyboardGuide } from "./keyboardGuideLoader";


export function loadPresetKeyboardGuideJis106Default() {
  return loadJsonKeyboardGuide(jis_106_default);
}
export function loadPresetKeyboardGuideJis106JisKana() {
  return loadJsonKeyboardGuide(jis_106_jis_kana);
}
export function loadPresetKeyboardGuideJis106Nicola() {
  return loadJsonKeyboardGuide(jis_106_nicola);
}
export function loadPresetKeyboardGuideUs101Default() {
  return loadJsonKeyboardGuide(us_101_default);
}
export function loadPresetKeyboardGuideUsHhkbDefault() {
  return loadJsonKeyboardGuide(us_hhkb_default);
}
