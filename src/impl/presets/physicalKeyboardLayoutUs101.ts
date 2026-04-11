import us101 from "../../assets/physical_keyboard_layouts/us_101.json";
import {
  loadJsonPhysicalKeyboardLayout,
  type PhysicalKeyboardLayout,
} from "../physicalKeyboardLayout";

let cached: PhysicalKeyboardLayout | undefined;

export function loadPresetPhysicalKeyboardLayoutUs101(): PhysicalKeyboardLayout {
  return (cached ??= loadJsonPhysicalKeyboardLayout(us101));
}
