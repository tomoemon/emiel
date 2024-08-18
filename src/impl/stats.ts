
export const stats = {
	/**
	 * 
	 * @param failedCount ミス入力数
	 * @param succeededCount 正しく入力できた打鍵数
	 * @returns 
	 */
	accuracy(failedCount: number, succeededCount: number): number {
		return succeededCount / (succeededCount + failedCount);
	},
	/**
	 * 
	 * @param succeededCount 正しく入力できた打鍵数
	 * @param startedAt  開始時刻（一般的にワードが表示されて入力可能になった時刻）
	 * @param finishedAt 終了時刻（一般的にワードの入力が完了した時刻）
	 * @returns 
	 */
	kpm(succeededCount: number, startedAt: Date, finishedAt: Date): number {
		return Math.trunc((succeededCount / (finishedAt.getTime() - startedAt.getTime())) *
			1000 *
			60);
	},

	/**
	 * latency の時間を除いた、1分あたりの打鍵数
	 * 「latency の時間を除く」＝「1打鍵めに要する時間を除く」ということなので、打鍵数を1減らして計算する
	 * 
	 * @param succeededCount 
	 * @param firstInputtedAt 
	 * @param finishedAt 
	 * @returns 
	 */
	rkpm(succeededCount: number, firstInputtedAt: Date, finishedAt: Date): number {
		return Math.trunc(((succeededCount - 1) / (finishedAt.getTime() - firstInputtedAt.getTime())) * 1000 * 60);
	}
} as const;
