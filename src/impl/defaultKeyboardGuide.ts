import { KeyboardGuide } from "..";
import jis_106_default from "../assets/keyboard_guides/jis_106_default.json";
import jis_106_jis_kana from "../assets/keyboard_guides/jis_106_jis_kana.json";
import jis_106_nicola from "../assets/keyboard_guides/jis_106_nicola.json";
import us_101_default from "../assets/keyboard_guides/us_101_default.json";
import us_hhkb_default from "../assets/keyboard_guides/us_hhkb_default.json";
import { loadJsonKeyboardGuide } from "./keyboardGuideLoader";

const guideCache = new Map<string, KeyboardGuide>();

export function getKeyboardGuide(
  name: string
): KeyboardGuide {
  const layout = guideCache.get(name);
  if (!layout) {
    switch (name) {
      case "jis_106_default":
        guideCache.set(name, loadJsonKeyboardGuide(jis_106_default));
        break;
      case "jis_106_jis_kana":
        guideCache.set(name, loadJsonKeyboardGuide(jis_106_jis_kana));
        break;
      case "jis_106_nicola":
        guideCache.set(name, loadJsonKeyboardGuide(jis_106_nicola));
        break;
      case "us_101_default":
        guideCache.set(name, loadJsonKeyboardGuide(us_101_default));
        break;
      case "us_hhkb_default":
        guideCache.set(name, loadJsonKeyboardGuide(us_hhkb_default));
        break;
      default:
        throw new Error(`Unknown keyboard guide: ${name}`);
    }
  }
  return guideCache.get(name)!;
}
