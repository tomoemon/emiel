import { AutomatonState } from "./automatonState";
import { RuleStroke } from "./ruleStroke";

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
  return state.edgeHistories.map((v) => v.previousEdge.input.romanChar).join("");
}

/**
 * 入力が完了していないローマ字列（ローマ字系の Rule の場合のみ）
 */
export function getPendingRoman(state: AutomatonState): string {
  return getPendingStroke(state).map((v) => v.romanChar).join("");
}

/**
 * 入力が完了したキーストローク列
 */
export function getFinishedStroke(state: AutomatonState): RuleStroke[] {
  return state.edgeHistories.map((v) => v.previousEdge.input);
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
 * 1打目の入力時刻
 */
export function getFirstInputTime(state: AutomatonState): Date {
  return state.edgeHistories[0].event.timestamp;
}

/**
 * 最後の入力時刻
 */
export function getLastInputTime(state: AutomatonState): Date {
  return state.edgeHistories[state.edgeHistories.length - 1].event.timestamp;
}

/**
 * ミス入力数の合計
 */
export function getFailedInputCount(state: AutomatonState): number {
  return (
    state.failedEventsAtCurrentNode.length +
    state.edgeHistories.reduce((acc, v) => acc + v.failedEvents.length, 0)
  );
}

/**
 * ミス入力も含めた打鍵数の合計
 */
export function getTotalInputCount(state: AutomatonState): number {
  return (
    state.failedEventsAtCurrentNode.length +
    state.edgeHistories.reduce((acc, v) => acc + v.failedEvents.length, 0) +
    state.edgeHistories.length
  );
}

/**
 * 入力が完了しているかどうか
 */
export function isFinished(state: AutomatonState): boolean {
  return state.currentNode.nextEdges.length === 0;
}