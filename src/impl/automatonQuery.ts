import type { AutomatonState, InputHistoryEntry } from "../core/automatonState";
import type { StrokeEdge } from "../core/builderStrokeGraph";
import type { RuleStroke } from "../core/ruleStroke";

function inputEntries(state: AutomatonState): InputHistoryEntry[] {
  return state.inputHistory.filter((e): e is InputHistoryEntry => !("back" in e));
}

/**
 * inputHistory からスタック的に有効な edge 列を導出する。
 * - InputHistoryEntry(isSucceeded, edge あり) → push
 * - BackHistoryEntry → pop（直前の成功を取り消す）
 * - それ以外（FAILED, IGNORED, PENDING, BACK(InputResult)）→ スタックに影響しない
 */
export function getEffectiveEdges(state: AutomatonState): StrokeEdge[] {
  const stack: StrokeEdge[] = [];
  for (const entry of state.inputHistory) {
    if ("back" in entry) {
      stack.pop();
    } else if (entry.edge) {
      stack.push(entry.edge);
    }
  }
  return stack;
}

/**
 * 入力が完了したかな文字列
 */
export function getFinishedWord(state: AutomatonState): string {
  return state.word.substring(0, state.currentNode.kanaIndex);
}

/**
 * 入力が完了していないかな文字列
 */
export function getPendingWord(state: AutomatonState): string {
  return state.word.substring(state.currentNode.kanaIndex);
}

/**
 * 入力が完了したローマ字列（ローマ字系の Rule の場合のみ）
 */
export function getFinishedRoman(state: AutomatonState): string {
  return getEffectiveEdges(state)
    .map((e) => e.input.romanChar)
    .join("");
}

/**
 * 入力が完了していないローマ字列（ローマ字系の Rule の場合のみ）
 */
export function getPendingRoman(state: AutomatonState): string {
  return getPendingStroke(state)
    .map((v) => v.romanChar)
    .join("");
}

/**
 * 入力が完了したキーストローク列
 */
export function getFinishedStroke(state: AutomatonState): RuleStroke[] {
  return getEffectiveEdges(state).map((e) => e.input);
}

/**
 * 現在の入力状態から最短ストローク数で打ち切れるストローク列を返す
 */
export function getPendingStroke(state: AutomatonState): RuleStroke[] {
  let node = state.currentNode;
  const result: RuleStroke[] = [];
  while (node.nextEdges.length > 0) {
    result.push(node.nextEdges[0].input);
    node = node.nextEdges[0].next;
  }
  return result;
}

/**
 * 最初の入力時刻（成功・失敗問わず）
 */
export function getFirstInputTime(state: AutomatonState): Date {
  const entries = inputEntries(state);
  return entries[0].event.timestamp;
}

/**
 * 最後の入力時刻（成功・失敗問わず）
 */
export function getLastInputTime(state: AutomatonState): Date {
  const entries = inputEntries(state);
  return entries[entries.length - 1].event.timestamp;
}

/**
 * 最初の成功入力時刻
 */
export function getFirstSucceededInputTime(state: AutomatonState): Date {
  const entries = inputEntries(state);
  const first = entries.find((e) => e.result.isSucceeded);
  if (!first) {
    throw new Error("No succeeded input found");
  }
  return first.event.timestamp;
}

/**
 * 最後の成功入力時刻
 */
export function getLastSucceededInputTime(state: AutomatonState): Date {
  const entries = inputEntries(state);
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].result.isSucceeded) {
      return entries[i].event.timestamp;
    }
  }
  throw new Error("No succeeded input found");
}

/**
 * ミス入力数の合計（back() で取り消された区間も含む）
 */
export function getFailedInputCount(state: AutomatonState): number {
  return inputEntries(state).filter((e) => e.result.isFailed).length;
}

/**
 * 有効な成功打鍵数 + ミス入力数の合計
 * （back() で取り消された成功は含まない。IGNORED, PENDING, BACK は除外）
 */
export function getTotalInputCount(state: AutomatonState): number {
  return getEffectiveEdges(state).length + getFailedInputCount(state);
}

/**
 * 入力が完了しているかどうか
 */
export function isFinished(state: AutomatonState): boolean {
  return state.currentNode.nextEdges.length === 0;
}

/**
 * back() で取り消された区間を除外した統計を1回の走査で計算する。
 *
 * 走査ロジック:
 * - 成功 → push(index)、back → pop して、pop されたインデックスから back のインデックスまでを「取り消し区間」とする
 * - 取り消し区間外の FAILED / SUCCEEDED をそれぞれカウント・記録する
 */
function computeEffectiveStats(state: AutomatonState) {
  const backed = new Set<number>();
  const successStack: number[] = [];
  for (let i = 0; i < state.inputHistory.length; i++) {
    const entry = state.inputHistory[i];
    if ("back" in entry) {
      const popped = successStack.pop();
      if (popped !== undefined) {
        for (let j = popped; j <= i; j++) {
          backed.add(j);
        }
      }
    } else if (entry.edge) {
      successStack.push(i);
    }
  }

  let failedCount = 0;
  let firstSucceededTime: Date | undefined;
  let lastSucceededTime: Date | undefined;
  for (let i = 0; i < state.inputHistory.length; i++) {
    if (backed.has(i)) continue;
    const entry = state.inputHistory[i];
    if ("back" in entry) continue;
    if (entry.result.isFailed) {
      failedCount++;
    } else if (entry.result.isSucceeded) {
      if (!firstSucceededTime) firstSucceededTime = entry.event.timestamp;
      lastSucceededTime = entry.event.timestamp;
    }
  }
  return { failedCount, firstSucceededTime, lastSucceededTime };
}

/**
 * back() で取り消された区間のミスを除外した失敗数
 */
export function getEffectiveFailedInputCount(state: AutomatonState): number {
  return computeEffectiveStats(state).failedCount;
}

/**
 * getEffectiveEdges.length + getEffectiveFailedInputCount
 */
export function getEffectiveTotalInputCount(state: AutomatonState): number {
  return getEffectiveEdges(state).length + computeEffectiveStats(state).failedCount;
}

/**
 * back() で取り消されていない最初の成功入力時刻
 */
export function getEffectiveFirstSucceededInputTime(state: AutomatonState): Date {
  const { firstSucceededTime } = computeEffectiveStats(state);
  if (!firstSucceededTime) throw new Error("No effective succeeded input found");
  return firstSucceededTime;
}

/**
 * back() で取り消されていない最後の成功入力時刻
 */
export function getEffectiveLastSucceededInputTime(state: AutomatonState): Date {
  const { lastSucceededTime } = computeEffectiveStats(state);
  if (!lastSucceededTime) throw new Error("No effective succeeded input found");
  return lastSucceededTime;
}

/**
 * backspace を考慮した統計クエリの拡張セット。
 * 利用者は `build(rule, word).with(backspaceExtension)` で追加できる。
 */
export const backspaceExtension = {
  getEffectiveFailedInputCount,
  getEffectiveTotalInputCount,
  getEffectiveFirstSucceededInputTime,
  getEffectiveLastSucceededInputTime,
};

export type BackspaceExtensionType = {
  [K in keyof typeof backspaceExtension]: () => ReturnType<(typeof backspaceExtension)[K]>;
};
