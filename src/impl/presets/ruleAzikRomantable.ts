import presetRuleAzikRomantable from "../../assets/rules/azik.txt?raw";
import type { KeyboardLayout } from "../../core/keyboardLayout";
import type { Rule } from "../../core/rule";
import { loadMozcRule } from "../mozcRuleLoader";

/**
 * AZIK 拡張ローマ字入力のプリセット `Rule` を返す。
 * 入力対象の物理キー展開のため `KeyboardLayout` を渡す。
 */
export function loadPresetRuleAzikRomantable(layout: KeyboardLayout): Rule {
  return loadMozcRule(presetRuleAzikRomantable, layout);
}
