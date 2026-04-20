import { AutomatonImpl } from "../core/automaton";
import { buildKanaNode } from "../core/builderKanaGraph";
import { buildStrokeNode } from "../core/builderStrokeGraph";
import { logging } from "../core/logger";
import type { normalizerFunc, Rule } from "../core/rule";
import * as AutomatonView from "./automatonView";
import { defaultComposedNormalize } from "./charNormalizer";

const logBuild = logging.getLogger("builder.build");

/**
 * 入力ルールとお題かな文字列から `Automaton` を構築する、emiel の中心 API。
 * 戻り値は AutomatonImpl に `currentView()` / `eventsView()` を合成したもので、
 * `automaton.currentView().finishedWord` 等がそのまま呼び出せる。
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
  logBuild.log("start", { kanaText });
  const { endNode } = buildKanaNode(rule, kanaText, normalize);
  const automaton = new AutomatonImpl(kanaText, buildStrokeNode(endNode), rule);
  logBuild.log("done", { kanaText, endIndex: endNode.startIndex });
  return automaton.with(baseExtension);
}

const baseExtension = {
  currentView: AutomatonView.currentView,
  eventsView: AutomatonView.eventsView,
};

/**
 * `build()` が自動で合成する基本クエリメソッドの型。
 * `automaton.currentView()` / `automaton.eventsView()` が引数なしメソッドとして
 * 呼び出せるようにマップしたもの。
 */
export type BaseExtensionType = {
  [K in keyof typeof baseExtension]: () => ReturnType<(typeof baseExtension)[K]>;
};

/**
 * `build()` の戻り値の型。AutomatonImpl に BaseExtensionType を合成したもの。
 * さらに `automaton.with(...)` で追加の拡張を合成することもできる。
 */
export type Automaton = AutomatonImpl & BaseExtensionType;
