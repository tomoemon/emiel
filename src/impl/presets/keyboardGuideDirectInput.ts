import directInput from "../../assets/keyboard_guides/direct_input.json";
import type { KeyboardGuide } from "../keyboardGuide";
import { loadJsonKeyboardGuide } from "../keyboardGuideLoader";

/** 直接入力用 (英字・記号そのまま) のプリセット `KeyboardGuide` を返す。 */
export function loadPresetKeyboardGuideDirectInput(): KeyboardGuide {
  return loadJsonKeyboardGuide(directInput);
}
