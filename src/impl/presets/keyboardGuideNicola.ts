import nicolaGuide from "../../assets/keyboard_guides/nicola.json";
import type { KeyboardGuide } from "../keyboardGuide";
import { loadJsonKeyboardGuide } from "../keyboardGuideLoader";

/** NICOLA (親指シフト) 用のプリセット `KeyboardGuide` を返す。 */
export function loadPresetKeyboardGuideNicola(): KeyboardGuide {
  return loadJsonKeyboardGuide(nicolaGuide);
}
