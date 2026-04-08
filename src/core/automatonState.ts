import type { StrokeEdge, StrokeNode } from "./builderStrokeGraph";
import type { InputEvent } from "./inputEvent";
import type { InputResult } from "./inputResult";
import type { Rule } from "./rule";

export type InputHistoryEntry = {
  event: InputEvent;
  result: InputResult;
  /** result.isSucceeded のときのみ存在。値は CommittedStroke.edge */
  edge?: StrokeEdge;
};

export type BackHistoryEntry = {
  back: true;
  /** back() で取り消された edge */
  undoneEdge: StrokeEdge;
};

export type HistoryEntry = InputHistoryEntry | BackHistoryEntry;

/**
 * Automaton の内部状態を表すインターフェース
 */
export type AutomatonState = {
  readonly word: string;
  readonly startNode: StrokeNode;
  readonly rule: Rule;
  readonly currentNode: StrokeNode;
  readonly inputHistory: ReadonlyArray<HistoryEntry>;
};
