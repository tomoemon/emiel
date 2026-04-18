import type { AutomatonState } from "../core/automatonState";
import type { StrokeEdge } from "../core/builderStrokeGraph";
import type { InputEvent } from "../core/inputEvent";
import type { RuleStroke } from "../core/ruleStroke";

/**
 * 現在の入力位置において、入力が完了した文字列やストローク列、
 * 未完了の文字列やストローク列を取得するビュー。
 * 入力中の表示に使う。
 */
export type CurrentView = {
  /** 入力が完了したかな文字列 */
  finishedWord: string;
  /** 入力が完了していないかな文字列 */
  pendingWord: string;
  /** 入力が完了したローマ字列（ローマ字系の Rule の場合のみ意味を持つ） */
  finishedRoman: string;
  /** 現在位置から最短で打ち切る場合のローマ字列 */
  pendingRoman: string;
  /** 入力が完了したキーストローク列 */
  finishedStroke: RuleStroke[];
  /** 現在位置から最短で打ち切る場合のキーストローク列 */
  pendingStroke: RuleStroke[];
};

/**
 * 入力履歴（`inputHistory`）から算出した集計。
 * 成功系（firstSucceeded / lastSucceeded / succeededCount）は back() で取消された
 * 区間を除外して数える。失敗打鍵（failedCount）はユーザーが一度でもミスした事実
 * を残すため、back() 取消区間も含めて数える。
 */
export type EventsView = {
  /**
   * 最初の keydown イベント（成功・失敗・IGNORED 問わず）。
   * ワード切替直後に前ワードから漏れた keyup が流入しても first が汚染されないよう keydown のみを対象にする。
   */
  first: InputEvent | undefined;
  /** 最後の入力イベント（keydown/keyup・成功/失敗問わず） */
  last: InputEvent | undefined;
  /** 最初の成功入力イベント */
  firstSucceeded: InputEvent | undefined;
  /** 最後の成功入力イベント */
  lastSucceeded: InputEvent | undefined;
  /** 成功打鍵数 */
  succeededCount: number;
  /** 失敗打鍵数（back() で取消された区間のミスも含む） */
  failedCount: number;
  /** succeededCount + failedCount */
  totalCount: number;
};

/**
 * inputHistory からスタック的に有効な edge 列を導出する内部ヘルパー。
 * - InputHistoryEntry(edge あり) → push
 * - BackHistoryEntry → pop（直前の成功を取り消す）
 * - それ以外 → スタックに影響しない
 */
function getEffectiveEdges(state: AutomatonState): StrokeEdge[] {
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

export function currentView(state: AutomatonState): CurrentView {
  const finishedWord = state.word.substring(0, state.currentNode.kanaIndex);
  const pendingWord = state.word.substring(state.currentNode.kanaIndex);

  const finishedStroke: RuleStroke[] = [];
  let finishedRoman = "";
  for (const edge of getEffectiveEdges(state)) {
    finishedStroke.push(edge.input);
    finishedRoman += edge.input.romanChar;
  }

  const pendingStroke: RuleStroke[] = [];
  let pendingRoman = "";
  let node = state.currentNode;
  while (node.nextEdges.length > 0) {
    const input = node.nextEdges[0].input;
    pendingStroke.push(input);
    pendingRoman += input.romanChar;
    node = node.nextEdges[0].next;
  }

  return {
    finishedWord,
    pendingWord,
    finishedRoman,
    pendingRoman,
    finishedStroke,
    pendingStroke,
  };
}

export function eventsView(state: AutomatonState): EventsView {
  // back() で取消された履歴位置を 1 パスで検出する
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

  let first: InputEvent | undefined;
  let last: InputEvent | undefined;
  let firstSucceeded: InputEvent | undefined;
  let lastSucceeded: InputEvent | undefined;
  let succeededCount = 0;
  let failedCount = 0;
  for (let i = 0; i < state.inputHistory.length; i++) {
    const entry = state.inputHistory[i];
    if ("back" in entry) continue;
    if (!first && entry.event.input.type === "keydown") first = entry.event;
    last = entry.event;
    if (entry.result.isFailed) {
      failedCount++;
    } else if (entry.result.isSucceeded && !backed.has(i)) {
      succeededCount++;
      if (!firstSucceeded) firstSucceeded = entry.event;
      lastSucceeded = entry.event;
    }
  }

  return {
    first,
    last,
    firstSucceeded,
    lastSucceeded,
    succeededCount,
    failedCount,
    totalCount: succeededCount + failedCount,
  };
}
