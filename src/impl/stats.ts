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
 * @param succeededCount 正しく入力できた打鍵数
 * @param startedAt  開始時刻（一般的にワードが表示されて入力可能になった時刻）
 * @param finishedAt 終了時刻（一般的にワードの入力が完了した時刻）
 * @returns
 */
export function getKpm(succeededCount: number, startedAt: Date, finishedAt: Date): number {
  return Math.trunc((succeededCount / (finishedAt.getTime() - startedAt.getTime())) * 1000 * 60);
}

/**
 * RKPM (1打鍵目のレイテンシを除いた1分あたりの正確な打鍵数) を計算する
 *
 * 「latency の時間を除く」＝「1打鍵めに要する時間を除く」ということなので、打鍵数を1減らして計算する
 *
 * @param succeededCount 正しく入力できた打鍵数
 * @param firstInputtedAt 1打鍵目の入力時刻
 * @param finishedAt 終了時刻（一般的にワードの入力が完了した時刻）
 * @returns
 */
export function getRkpm(succeededCount: number, firstInputtedAt: Date, finishedAt: Date): number {
  return Math.trunc(
    ((succeededCount - 1) / (finishedAt.getTime() - firstInputtedAt.getTime())) * 1000 * 60,
  );
}
