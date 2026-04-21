/**
 * タイプウェル風「複数ワードを連続して打つ」タイピングゲームの構築ヘルパー。
 *
 * emiel は 1 本の Automaton が 1 本のかな文字列を扱う設計なので、「複数ワードを
 * 個別に組む」という素朴な作り方だと以下の問題が起きる。
 *
 * 1. ワード末尾の「ん」をローマ字で打つとき `nn` / `xn` の 2 打が必要になる
 *    （`n` 単独では「ん」が確定できない）。タイプウェルでは末尾 ん を `n` 1 打 +
 *    区切り文字で確定させるのが一般的。
 * 2. ワード切替のタイミングで `onWordFinished` 的なコールバックが必要になり、
 *    状態管理が煩雑になる。
 * 3. ワード末尾の区切り打鍵を統計から除外するために、inputHistory の末尾
 *    成功打鍵を手動で剥がす処理が必要になる。
 *
 * 本モジュールは「ワードを区切り文字で連結したフレーズ全体を 1 本の Automaton
 * として組む」という方針で、上記 3 点をまとめて解決する。
 *
 * - ルールを `romanRule.merge(createDirectInputRule(layout))` で合成しておくと、
 *   emiel の ruleExtender が `n + <区切り文字>` の合成エッジを自動生成する。
 *   結果「キャンペーン<space>」は N → Space の 2 打で確定する（タイプウェル流）。
 *   通常の `nn + space` 3 打経路も並存するので、利用者のクセに応じて選べる。
 * - ワード境界は `StrokeEdge.previous.kanaIndex` が属する `WordRange` で判定するため、
 *   単独の区切り打鍵（`nn + space` 経路の space）は「どのワードにも属さない」として
 *   自然に統計から外れる。合成エッジ経由の `n + space` は 2 打とも直前ワードに計上される。
 *
 * このファイルは example ローカルのヘルパーで、emiel 本体には公開していない。
 * 他のタイプウェル風ゲームを作る場合はこのファイルをコピー or 参考にして実装してほしい。
 */

import type {
  Automaton,
  AutomatonState,
  EventsView,
  InputHistoryEntry,
  normalizerFunc,
  Rule,
} from "emiel";
import { build } from "emiel";

/**
 * フレーズ内における 1 ワードのかな位置範囲。 `start` は含む、`end` は含まない。
 *
 * 例: `words = ["ab", "cd"]`, `separator = " "` の場合、フレーズは `"ab cd"` で
 * range は `[{start: 0, end: 2}, {start: 3, end: 5}]`。 index 2 の space は
 * どのワード範囲にも含まれない（separator 範囲）。
 */
export type WordRange = { readonly start: number; readonly end: number };

/**
 * `buildWords` が返す Automaton に追加されるワード認識メソッド群。
 * `Automaton.with()` 経由で合成されるので、すべてのメソッドは 0 引数で呼ぶ。
 */
export type WordsExtension = {
  /** 構築時に渡したワード配列をそのまま返す。 */
  words: () => readonly string[];
  /** 構築時に渡した区切り文字をそのまま返す。 */
  separator: () => string;
  /** 各ワードのかな位置範囲。添字は `words()` と対応する。 */
  wordRanges: () => readonly WordRange[];
  /**
   * 現在入力対象のワード index。
   *
   * 区切り範囲にいる間（= ワード末尾まで打ったが区切りを未入力の状態）は
   * 「直前のワード」を返す。直感的な表示に合わせるための意図的な挙動で、
   * タイプウェル風 UI では「ワードを打ち終えた直後に次ワードへ早送り」される
   * のは避けたい。全ワード完了後は `words().length` を返す。
   */
  currentWordIndex: () => number;
  /**
   * ワード別の `EventsView` 配列。添字は `words()` と対応する。
   *
   * 統計表示で「ワード毎の time / KPM / miss」を出すときに使う。
   * 打鍵のワード帰属ルールは `computeEventsPerWord` 参照。
   */
  eventsPerWord: () => EventsView[];
};

/**
 * ワード認識機能を持つ Automaton。通常の `build()` 戻り値と互換なので、
 * `currentView()` / `eventsView()` / `input()` 等はそのまま使える。
 */
export type WordAutomaton = Automaton & WordsExtension;

/**
 * ワード配列と区切り文字から各ワードのかな位置範囲を計算する。
 *
 * `words[i]` の長さと区切り長を累積して配置する。 `separator = ""` でも動く。
 */
export function computeWordRanges(words: readonly string[], separator: string): WordRange[] {
  const ranges: WordRange[] = [];
  let pos = 0;
  words.forEach((w, i) => {
    ranges.push({ start: pos, end: pos + w.length });
    pos += w.length + (i < words.length - 1 ? separator.length : 0);
  });
  return ranges;
}

/**
 * 与えられた `kanaIndex` が属するワードの index を返す。
 * どのワード範囲にも含まれない（= 区切り範囲、もしくは完了済みで末尾越え）
 * 場合は -1 を返す。
 *
 * 「区切り範囲の打鍵をどのワードにも計上しない」という `eventsPerWord` の
 * 挙動はこの -1 によって実現される。`currentWordIndex` とは異なる semantics
 * なので注意（表示用と統計用でワード帰属ルールが微妙に違う）。
 */
function wordIndexOf(kanaIndex: number, ranges: readonly WordRange[]): number {
  for (let i = 0; i < ranges.length; i++) {
    if (kanaIndex >= ranges[i].start && kanaIndex < ranges[i].end) return i;
  }
  return -1;
}

/**
 * 表示用のワード index。 `wordIndexOf` と違って区切り範囲では -1 を返さず、
 * 「直前のワード」をそのまま返す（= 区切り範囲を直前ワードの末尾に延長した扱い）。
 *
 * 例: `["ab", "cd"]`, separator=" " のフレーズで
 *   - kanaIndex = 2 (separator 位置): `wordIndexOf` は -1 だが、こちらは 0 を返す
 *   - kanaIndex = 3 (cd の 'c' 位置): こちらは 1 を返す
 *
 * これにより「ab を打ち終えた瞬間に表示が cd にジャンプする」ことがなくなる。
 */
function computeCurrentWordIndex(state: AutomatonState, ranges: readonly WordRange[]): number {
  if (ranges.length === 0) return 0;
  const kanaIndex = state.currentNode.kanaIndex;
  if (kanaIndex >= ranges[ranges.length - 1].end) return ranges.length;
  for (let i = 0; i < ranges.length; i++) {
    const nextStart = i < ranges.length - 1 ? ranges[i + 1].start : Number.POSITIVE_INFINITY;
    if (kanaIndex < nextStart) return i;
  }
  return ranges.length;
}

/**
 * `inputHistory` をワード別に振り分けて `EventsView[]` を返す。
 *
 * 打鍵のワード帰属ルールは「遷移元ノードの kanaIndex が属するワード」で、
 * 成功打鍵は `StrokeEdge.previous.kanaIndex` から取得する。失敗打鍵（`edge`
 * 無し）は直前の成功打鍵の `next.kanaIndex` をカーソルで保持しそれを用いる。
 *
 * このルールにより:
 * - `n + space / ン ` 合成エッジは 2 打とも遷移元が直前ワード範囲内 → 直前ワードに計上
 * - `nn + space` 経路の単独 space は遷移元が separator 範囲 → どのワードにも入らない
 *
 * したがって「末尾 ん 1 打確定」でも「nn 2 打確定」でも同じワード分の統計として
 * 正しく集計される。
 *
 * 注: このヘルパーは back() を使わないゲーム（= タイプウェル風）を前提にしている。
 * back() を使うゲームでは、取消された成功打鍵を除外する処理を追加する必要がある。
 */
function computeEventsPerWord(state: AutomatonState, ranges: readonly WordRange[]): EventsView[] {
  const groups: InputHistoryEntry[][] = ranges.map(() => []);
  let currentKana = 0;
  for (const entry of state.inputHistory) {
    if ("back" in entry) continue;
    const prevKana = entry.edge?.previous.kanaIndex ?? currentKana;
    const wordIdx = wordIndexOf(prevKana, ranges);
    if (wordIdx >= 0) groups[wordIdx].push(entry);
    if (entry.edge) currentKana = entry.edge.next.kanaIndex;
  }

  return groups.map((entries) => {
    // first は keydown のみ対象にする。keyup が先頭に来ても汚染されないようにするため。
    const first = entries.find((e) => e.event.input.type === "keydown")?.event;
    const last = entries[entries.length - 1]?.event;
    const succeeded = entries.filter((e) => e.result.isSucceeded);
    const failedCount = entries.filter((e) => e.result.isFailed).length;
    return {
      first,
      last,
      firstSucceeded: succeeded[0]?.event,
      lastSucceeded: succeeded[succeeded.length - 1]?.event,
      succeededCount: succeeded.length,
      failedCount,
      totalCount: succeeded.length + failedCount,
    };
  });
}

/**
 * 複数ワードを区切り文字で連結したフレーズを 1 本の `Automaton` として構築する。
 *
 * 戻り値の `WordAutomaton` は通常の `Automaton` に `words()` / `separator()` /
 * `wordRanges()` / `currentWordIndex()` / `eventsPerWord()` を生やしたもの。
 *
 * @example タイプウェル風 4 ワード
 * ```ts
 * const rule = loadPresetRuleRoman(layout).merge(createDirectInputRule(layout));
 * const automaton = buildWords(rule, ["キャンペーン", "かった", "pocket", "the Sun"]);
 *
 * // 入力時
 * automaton.input(event);
 * const view = automaton.currentView();
 * const i = automaton.currentWordIndex();
 *
 * // 完了時
 * const per = automaton.eventsPerWord();
 * const kpm = (per[0].succeededCount / (per[0].lastSucceeded!.timestamp - per[0].firstSucceeded!.timestamp)) * 60000;
 * ```
 *
 * @param rule 入力ルール。タイプウェル風の「末尾 ん 1 打確定」を有効にするには
 *   `roman.merge(directInput)` のように区切り文字を扱う direct input rule を
 *   merge しておく。merge なしでも動くが、末尾 ん は `nn` / `xn` の 2 打必要。
 * @param words ワード配列
 * @param separator ワード間の区切り文字（既定: 半角スペース）
 * @param normalize 比較用の文字列正規化関数。`build()` と同じ
 */
export function buildWords(
  rule: Rule,
  words: readonly string[],
  separator: string = " ",
  normalize?: normalizerFunc,
): WordAutomaton {
  const phrase = words.join(separator);
  const automaton = build(rule, phrase, normalize);
  const ranges = computeWordRanges(words, separator);
  return automaton.with({
    words: () => words,
    separator: () => separator,
    wordRanges: () => ranges,
    currentWordIndex: (state: AutomatonState) => computeCurrentWordIndex(state, ranges),
    eventsPerWord: (state: AutomatonState) => computeEventsPerWord(state, ranges),
  }) as WordAutomaton;
}
