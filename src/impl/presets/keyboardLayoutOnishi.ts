import onishi from "../../assets/keyboard_layouts/onishi.json";
import { loadJsonKeyboardLayout } from "../keyboardLayoutLoader";

/** 大西配列のプリセット `KeyboardLayout` を返す。 */
export function loadPresetKeyboardLayoutOnishi() {
  return loadJsonKeyboardLayout(onishi);
}
