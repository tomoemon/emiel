import eucalyn from "../../assets/keyboard_layouts/eucalyn.json";
import { loadJsonKeyboardLayout } from "../keyboardLayoutLoader";

/** Eucalyn 配列のプリセット `KeyboardLayout` を返す。 */
export function loadPresetKeyboardLayoutEucalyn() {
  return loadJsonKeyboardLayout(eucalyn);
}
