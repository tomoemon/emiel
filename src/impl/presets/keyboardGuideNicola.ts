import nicolaGuide from "../../assets/keyboard_guides/nicola.json";
import type { KeyboardGuide } from "../keyboardGuide";
import { loadJsonKeyboardGuide } from "../keyboardGuideLoader";

let cached: KeyboardGuide | undefined;

export function loadPresetKeyboardGuideNicola(): KeyboardGuide {
  return (cached ??= loadJsonKeyboardGuide(nicolaGuide));
}
