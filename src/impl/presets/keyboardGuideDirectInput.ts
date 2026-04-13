import directInput from "../../assets/keyboard_guides/direct_input.json";
import type { KeyboardGuide } from "../../core/keyboardGuide";
import { loadJsonKeyboardGuide } from "../keyboardGuideLoader";

// KeyboardGuide はイミュータブルで layout 非依存のため、モジュールレベルでキャッシュする。
// createDirectInputRule など、Rule 生成のたびに呼ばれるパスで valibot parse を
// 繰り返さないようにするのが目的。
let cached: KeyboardGuide | undefined;

export function loadPresetKeyboardGuideDirectInput(): KeyboardGuide {
  return (cached ??= loadJsonKeyboardGuide(directInput));
}
