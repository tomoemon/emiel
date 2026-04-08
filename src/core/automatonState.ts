import type { StrokeEdge, StrokeNode } from "./builderStrokeGraph";
import type { InputEvent } from "./inputEvent";
import type { InputResult } from "./inputResult";
import type { Rule } from "./rule";

/**
 * input() メソッドによる入力イベントの履歴エントリ。
 * すべての入力結果（IGNORED, PENDING, FAILED, BACK, 成功系）が記録される。
 *
 * word="あ" (ローマ字入力) に対して B(ミス) → A(成功) と入力した場合:
 * ```
 * [
 *   { event: B-keydown, result: FAILED },
 *   { event: B-keyup,   result: IGNORED },
 *   { event: A-keydown, result: FINISHED, edge: StrokeEdge(A→次) },
 *   { event: A-keyup,   result: IGNORED },
 * ]
 * ```
 */
export type InputHistoryEntry = {
  /** 入力イベント */
  event: InputEvent;
  /** 入力結果 */
  result: InputResult;
  /** 遷移に使用された edge。result.isSucceeded のときのみ存在。 */
  edge?: StrokeEdge;
};

/**
 * back() メソッド呼び出しの履歴エントリ。
 * getEffectiveEdges のスタック処理で直前の成功遷移を1つ打ち消す。
 *
 * InputHistoryEntry(result.isBack) は backspace キーマッチの記録であり、
 * 実際に back() を呼ぶかはライブラリ利用者の判断に委ねられる。
 *
 * word="あい" で A(成功) → back() → A(再入力) の場合の inputHistory:
 * ```
 * [
 *   { event: A-keydown, result: KANA_SUCCEEDED, edge: ... },
 *   { event: A-keyup,   result: IGNORED },
 *   { event: BS-keydown, result: BACK },          // backspace キーマッチ
 *   { event: BS-keyup,   result: IGNORED },
 *   { back: true, undoneEdge: ... },               // back() 呼び出し
 *   { event: A-keydown, result: KANA_SUCCEEDED, edge: ... },  // 再入力
 *   { event: A-keyup,   result: IGNORED },
 * ]
 * ```
 */
export type BackHistoryEntry = {
  back: true;
  /** back() で取り消された edge */
  undoneEdge: StrokeEdge;
};

/**
 * inputHistory に記録されるエントリの union 型。
 * "back" in entry で BackHistoryEntry かどうかを判別できる。
 *
 * ```
 * for (const entry of automaton.inputHistory) {
 *   if ("back" in entry) {
 *     // BackHistoryEntry: back() で取り消された遷移
 *     console.log(entry.undoneEdge);
 *   } else {
 *     // InputHistoryEntry: input() による入力イベント
 *     console.log(entry.event, entry.result, entry.edge);
 *   }
 * }
 * ```
 */
export type HistoryEntry = InputHistoryEntry | BackHistoryEntry;

/**
 * Automaton の内部状態を表すインターフェース
 */
export type AutomatonState = {
  /** 入力対象のかな文字列 */
  readonly word: string;
  /** 打鍵を受け付ける開始ノード */
  readonly startNode: StrokeNode;
  /** この Automaton を生成した入力ルール */
  readonly rule: Rule;
  /** 現在の入力位置を表すノード */
  readonly currentNode: StrokeNode;
  /**
   * すべての入力イベントと back() 操作の時系列ログ。
   * append-only で、back() 時も splice せず BackHistoryEntry を追記する。
   */
  readonly inputHistory: ReadonlyArray<HistoryEntry>;
};
