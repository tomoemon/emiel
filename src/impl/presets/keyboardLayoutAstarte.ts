import astarte from "../../assets/keyboard_layouts/astarte.json";
import { loadJsonKeyboardLayout } from "../keyboardLayoutLoader";

/** Astarte 配列のプリセット `KeyboardLayout` を返す。 */
export function loadPresetKeyboardLayoutAstarte() {
  return loadJsonKeyboardLayout(astarte);
}
