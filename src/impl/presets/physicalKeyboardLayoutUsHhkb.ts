import usHhkb from "../../assets/physical_keyboard_layouts/us_hhkb.json";
import {
  loadJsonPhysicalKeyboardLayout,
  type PhysicalKeyboardLayout,
} from "../physicalKeyboardLayout";

/** HHKB (US 配列) 相当の物理レイアウトを返す。 */
export function loadPresetPhysicalKeyboardLayoutUsHhkb(): PhysicalKeyboardLayout {
  return loadJsonPhysicalKeyboardLayout(usHhkb);
}
