import jisKanaGuide from "../../assets/keyboard_guides/jis_kana.json";
import type { KeyboardGuide } from "../keyboardGuide";
import { loadJsonKeyboardGuide } from "../keyboardGuideLoader";

/** JIS かな入力用のプリセット `KeyboardGuide` を返す。 */
export function loadPresetKeyboardGuideJisKana(): KeyboardGuide {
  return loadJsonKeyboardGuide(jisKanaGuide);
}
