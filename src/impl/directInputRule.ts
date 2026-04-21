import type { KeyboardLayout } from "../core/keyboardLayout";
import { RuleEntry, RulePrimitive } from "../core/rule";

/**
 * 指定した KeyboardLayout の文字対応をそのまま使う「直接入力ルール」を生成する。
 * ローマ字変換を伴わず、1 文字を対応する 1 打鍵で入力する用途（英数字ワード等）で使用する。
 * かな入力ルールと `merge` することで、かな混じり英数字ワードも入力できるようになる。
 */
export function createDirectInputRule(layout: KeyboardLayout): RulePrimitive {
  const entries = Array.from(layout.mapping).map(
    ([key, stroke]) => new RuleEntry([stroke], key, [], false),
  );
  return new RulePrimitive(entries, { name: "directInput", url: "" });
}
