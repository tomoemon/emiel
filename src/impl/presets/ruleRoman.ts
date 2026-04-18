import presetRuleGoogleImeRoman from "../../assets/rules/google_ime_default_roman.txt?raw";
import type { KeyboardLayout } from "../../core/keyboardLayout";
import type { Rule } from "../../core/rule";
import { loadMozcRule } from "../mozcRuleLoader";

/**
 * Google 日本語入力デフォルトのローマ字入力プリセット `Rule` を返す。
 * 入力対象の物理キー展開のため `KeyboardLayout` を渡す。
 */
export function loadPresetRuleRoman(layout: KeyboardLayout): Rule {
  return loadMozcRule(presetRuleGoogleImeRoman, layout);
}
