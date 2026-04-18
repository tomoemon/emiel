import { AutomatonImpl } from "../core/automaton";
import { buildKanaNode } from "../core/builderKanaGraph";
import { buildStrokeNode } from "../core/builderStrokeGraph";
import type { normalizerFunc, Rule } from "../core/rule";
import * as AutomatonQuery from "./automatonQuery";
import { defaultComposedNormalize } from "./charNormalizer";

/**
 * 入力ルールとお題かな文字列から `Automaton` を構築する、emiel の中心 API。
 * 戻り値は AutomatonImpl に `automatonQuery` の基本クエリ関数群を合成したもので、
 * `automaton.getFinishedWord()` 等がそのまま呼び出せる。
 *
 * @param rule 使用する入力ルール (`loadPresetRuleRoman()` 等で取得)
 * @param kanaText 入力対象の文字列
 * @param normalize 比較用の文字列正規化関数。未指定時はひらがな→カタカナ等の
 *   デフォルト正規化 (`defaultComposedNormalize`) が適用される
 */
export function build(
  rule: Rule,
  kanaText: string,
  normalize: normalizerFunc = defaultComposedNormalize,
): Automaton {
  const { endNode, rulesByKanaIndex } = buildKanaNode(rule, kanaText, normalize);
  const automaton = new AutomatonImpl(kanaText, buildStrokeNode(endNode), rule, rulesByKanaIndex);
  return automaton.with(baseExtension);
}

const baseExtension = {
  getFinishedWord: AutomatonQuery.getFinishedWord,
  getPendingWord: AutomatonQuery.getPendingWord,
  getFinishedStroke: AutomatonQuery.getFinishedStroke,
  getPendingStroke: AutomatonQuery.getPendingStroke,
  getEffectiveEdges: AutomatonQuery.getEffectiveEdges,
  isFinished: AutomatonQuery.isFinished,
  getFirstInputTime: AutomatonQuery.getFirstInputTime,
  getLastInputTime: AutomatonQuery.getLastInputTime,
  getFirstSucceededInputTime: AutomatonQuery.getFirstSucceededInputTime,
  getLastSucceededInputTime: AutomatonQuery.getLastSucceededInputTime,
  getFailedInputCount: AutomatonQuery.getFailedInputCount,
  getTotalInputCount: AutomatonQuery.getTotalInputCount,
  getFinishedRoman: AutomatonQuery.getFinishedRoman,
  getPendingRoman: AutomatonQuery.getPendingRoman,
};

/**
 * `build()` が自動で合成する基本クエリ関数群の型。
 * `getFinishedWord()`, `getLastSucceededInputTime()` 等、`automatonQuery` の主要関数を
 * 引数なしメソッドとして呼び出せるようにマップしたもの。
 */
export type BaseExtensionType = {
  [K in keyof typeof baseExtension]: () => ReturnType<(typeof baseExtension)[K]>;
};

/**
 * `build()` の戻り値の型。AutomatonImpl に BaseExtensionType を合成したもの。
 * さらに `automaton.with(...)` で追加の拡張を合成することもできる。
 */
export type Automaton = AutomatonImpl & BaseExtensionType;
