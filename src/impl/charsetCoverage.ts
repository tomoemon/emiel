import type { normalizerFunc, Rule } from "../core/rule";
import { build } from "./buildAutomaton";
import { defaultComposedNormalize } from "./charNormalizer";

/**
 * emiel が入力を保証する文字集合（対象文字集合）。
 * 同梱のかな配列ルールを直接入力ルールと合成すれば、どの文字も 1 文字の単語として打てる。
 * 配列を切り替えて使う単語リストは、この集合の文字だけで作ることを推奨する。
 *
 * - かな：清音、濁音、半濁音、小書き（ぁぃぅぇぉゃゅょっ）
 * - 数字：0〜9
 * - 英字：a〜z、A〜Z
 * - 記号：ー 、 。 ! ? 「 」
 *
 * 判定は正規化後の文字で行うので、カタカナや全角英数記号も同じ文字として扱われる。
 */
export const coreCharset: readonly string[] = [
  ..."あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん",
  ..."がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ",
  ..."ぁぃぅぇぉゃゅょっ",
  ..."0123456789",
  ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ..."ー、。!?「」",
];

function canBuild(rule: Rule, text: string, normalize: normalizerFunc): boolean {
  try {
    build(rule, text, normalize);
    return true;
  } catch {
    return false;
  }
}

/**
 * `chars` のうち、`rule` で 1 文字の単語として打てない文字を返す（重複は除く）。
 * 利用者が選んだ配列で対象文字集合を打てるかの確認に使う。
 * 1 文字ずつ build するので、起動時などに 1 回呼ぶ用途を想定している。
 *
 * @param rule 検査する入力ルール（英数字も検査するなら直接入力ルールと合成したもの）
 * @param chars 検査する文字。文字列を渡すと 1 文字ずつ検査する（既定は `coreCharset`）
 * @param normalize build に渡す正規化関数
 */
export function findUntypableChars(
  rule: Rule,
  chars: Iterable<string> = coreCharset,
  normalize: normalizerFunc = defaultComposedNormalize,
): string[] {
  return [...new Set(chars)].filter((c) => !canBuild(rule, c, normalize));
}

/**
 * `words` のうち、`rule` で打てない単語を返す（重複は除く）。
 * 各文字が打てても、文字の並びによっては単語として打てない場合があるので、
 * 単語リストを検査するときはこちらを使う。
 *
 * @param rule 検査する入力ルール
 * @param words 検査する単語の一覧
 * @param normalize build に渡す正規化関数
 */
export function findUntypableWords(
  rule: Rule,
  words: Iterable<string>,
  normalize: normalizerFunc = defaultComposedNormalize,
): string[] {
  return [...new Set(words)].filter((w) => !canBuild(rule, w, normalize));
}
