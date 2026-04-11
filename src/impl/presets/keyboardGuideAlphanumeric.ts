import alphanumeric from "../../assets/keyboard_guides/alphanumeric.json";
import type { KeyboardGuide } from "../../core/keyboardGuide";
import { loadJsonKeyboardGuide } from "../keyboardGuideLoader";

// KeyboardGuide はイミュータブルで layout 非依存のため、モジュールレベルでキャッシュする。
// newAlphaNumericRuleByLayout など、Rule 生成のたびに呼ばれるパスで valibot parse を
// 繰り返さないようにするのが目的。
let cached: KeyboardGuide | undefined;

export function loadPresetKeyboardGuideAlphanumeric(): KeyboardGuide {
  return (cached ??= loadJsonKeyboardGuide(alphanumeric));
}
