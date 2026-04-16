import jisKanaGuide from "../../assets/keyboard_guides/jis_kana.json";
import type { KeyboardGuide } from "../keyboardGuide";
import { loadJsonKeyboardGuide } from "../keyboardGuideLoader";

let cached: KeyboardGuide | undefined;

export function loadPresetKeyboardGuideJisKana(): KeyboardGuide {
  return (cached ??= loadJsonKeyboardGuide(jisKanaGuide));
}
