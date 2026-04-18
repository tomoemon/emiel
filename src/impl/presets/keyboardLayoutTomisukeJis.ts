import tomisukeJis from "../../assets/keyboard_layouts/tomisuke_jis.json";
import { loadJsonKeyboardLayout } from "../keyboardLayoutLoader";

/** Tomisuke JIS 配列のプリセット `KeyboardLayout` を返す。 */
export function loadPresetKeyboardLayoutTomisukeJis() {
  return loadJsonKeyboardLayout(tomisukeJis);
}
