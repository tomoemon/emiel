/**
 * 打鍵数ベースの正確性を計算する
 *
 * @param failedCount ミス入力数
 * @param succeededCount 正しく入力できた打鍵数
 * @returns
 */
export function getAccuracy(failedCount: number, succeededCount: number): number {
  return succeededCount / (succeededCount + failedCount);
}
/**
 * KPM (1分あたりの打鍵数) を計算する
 *
 * 時刻は高精度タイマー `performance.now()` で取得した DOMHighResTimeStamp (ミリ秒) を渡す。
 * automaton から取得する入力時刻（`eventsView().lastSucceeded?.timestamp` 等）も同じ時間軸なので
 * `finishedAt` にそのまま渡せる。
 *
 * @param succeededCount 正しく入力できた打鍵数
 * @param startedAt  開始時刻（一般的にワードが表示されて入力可能になった時刻）。`performance.now()` で取得
 * @param finishedAt 終了時刻（一般的にワードの入力が完了した時刻）。`automaton.eventsView().lastSucceeded?.timestamp` 等で取得
 * @returns
 */
export function getKpm(
  succeededCount: number,
  startedAt: DOMHighResTimeStamp,
  finishedAt: DOMHighResTimeStamp,
): number {
  return (succeededCount / (finishedAt - startedAt)) * 1000 * 60;
}

/**
 * RKPM (1打鍵目のレイテンシを除いた1分あたりの正確な打鍵数) を計算する
 *
 * 「latency の時間を除く」＝「1打鍵めに要する時間を除く」ということなので、打鍵数を1減らして計算する
 *
 * 時刻は高精度タイマー  `performance.now()` で取得した DOMHighResTimeStamp (ミリ秒) を渡す。
 * automaton から取得する入力時刻（`eventsView().firstSucceeded?.timestamp`, `eventsView().lastSucceeded?.timestamp` 等）
 * も同じ時間軸なのでそのまま渡せる。
 *
 * @param succeededCount 正しく入力できた打鍵数
 * @param firstInputtedAt 1打鍵目の入力時刻。`automaton.eventsView().firstSucceeded?.timestamp` 等で取得
 * @param finishedAt 終了時刻（一般的にワードの入力が完了した時刻）。`automaton.eventsView().lastSucceeded?.timestamp` 等で取得
 * @returns
 */
export function getRkpm(
  succeededCount: number,
  firstInputtedAt: DOMHighResTimeStamp,
  finishedAt: DOMHighResTimeStamp,
): number {
  return ((succeededCount - 1) / (finishedAt - firstInputtedAt)) * 1000 * 60;
}
