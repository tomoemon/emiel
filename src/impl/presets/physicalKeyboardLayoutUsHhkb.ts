import usHhkb from "../../assets/physical_keyboard_layouts/us_hhkb.json";
import {
  loadJsonPhysicalKeyboardLayout,
  type PhysicalKeyboardLayout,
} from "../physicalKeyboardLayout";

let cached: PhysicalKeyboardLayout | undefined;

export function loadPresetPhysicalKeyboardLayoutUsHhkb(): PhysicalKeyboardLayout {
  return (cached ??= loadJsonPhysicalKeyboardLayout(usHhkb));
}
