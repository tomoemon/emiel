import us101 from "../../assets/physical_keyboard_layouts/us_101.json";
import {
  loadJsonPhysicalKeyboardLayout,
  type PhysicalKeyboardLayout,
} from "../physicalKeyboardLayout";

/** 英語 101 キーボードの物理レイアウト (US 101) を返す。 */
export function loadPresetPhysicalKeyboardLayoutUs101(): PhysicalKeyboardLayout {
  return loadJsonPhysicalKeyboardLayout(us101);
}
