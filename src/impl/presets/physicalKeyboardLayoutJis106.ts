import jis106 from "../../assets/physical_keyboard_layouts/jis_106.json";
import {
  loadJsonPhysicalKeyboardLayout,
  type PhysicalKeyboardLayout,
} from "../physicalKeyboardLayout";

let cached: PhysicalKeyboardLayout | undefined;

export function loadPresetPhysicalKeyboardLayoutJis106(): PhysicalKeyboardLayout {
  return (cached ??= loadJsonPhysicalKeyboardLayout(jis106));
}
