import jis106 from "../../assets/physical_keyboard_layouts/jis_106.json";
import {
  loadJsonPhysicalKeyboardLayout,
  type PhysicalKeyboardLayout,
} from "../physicalKeyboardLayout";

/** 日本語 106 キーボードの物理レイアウト (JIS 106) を返す。 */
export function loadPresetPhysicalKeyboardLayoutJis106(): PhysicalKeyboardLayout {
  return loadJsonPhysicalKeyboardLayout(jis106);
}
