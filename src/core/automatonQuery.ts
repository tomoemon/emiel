import type { StrokeEdge } from "./builderStrokeGraph";
import type { AutomatonState, InputHistoryEntry } from "./automatonState";
import type { RuleStroke } from "./ruleStroke";

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
 * back() で取り消された区間に含まれる inputHistory インデックスの集合を返す。
 * 成功 → push(index)、back → pop して、pop されたインデックスから back のインデックスまでを「取り消し区間」とする。
 */
function getBackedIndices(state: AutomatonState): Set<number> {
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
  return backed;
}

/**
 * back() で取り消された区間のミスを除外した失敗数
 */
export function getEffectiveFailedInputCount(state: AutomatonState): number {
  const backed = getBackedIndices(state);
  let count = 0;
  for (let i = 0; i < state.inputHistory.length; i++) {
    const entry = state.inputHistory[i];
    if (!("back" in entry) && entry.result.isFailed && !backed.has(i)) {
      count++;
    }
  }
  return count;
}

/**
 * getEffectiveEdges.length + getEffectiveFailedInputCount
 */
export function getEffectiveTotalInputCount(state: AutomatonState): number {
  return getEffectiveEdges(state).length + getEffectiveFailedInputCount(state);
}

/**
 * back() で取り消されていない最初の成功入力時刻
 */
export function getEffectiveFirstSucceededInputTime(state: AutomatonState): Date {
  const backed = getBackedIndices(state);
  for (let i = 0; i < state.inputHistory.length; i++) {
    const entry = state.inputHistory[i];
    if (!("back" in entry) && entry.result.isSucceeded && !backed.has(i)) {
      return entry.event.timestamp;
    }
  }
  throw new Error("No effective succeeded input found");
}

/**
 * back() で取り消されていない最後の成功入力時刻
 */
export function getEffectiveLastSucceededInputTime(state: AutomatonState): Date {
  const backed = getBackedIndices(state);
  for (let i = state.inputHistory.length - 1; i >= 0; i--) {
    const entry = state.inputHistory[i];
    if (!("back" in entry) && entry.result.isSucceeded && !backed.has(i)) {
      return entry.event.timestamp;
    }
  }
  throw new Error("No effective succeeded input found");
}
