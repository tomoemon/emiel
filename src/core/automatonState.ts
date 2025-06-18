import { StrokeNode } from "./builderStrokeGraph";
import { InputEvent } from "./inputEvent";
import { Rule } from "./rule";

export type EdgeHistory = {
  // 遷移のきっかけになった成功した入力イベント
  event: InputEvent;
  // 今回の遷移で利用されたエッジ（この Edge をたどると startNode まで戻れる）
  previousEdge: import("./builderStrokeGraph").StrokeEdge;
  // 今回の遷移に成功するまでに失敗した入力イベント
  // failedEvents[0], failedEvents[1], ..., event(入力成功) という時系列
  failedEvents: InputEvent[];
};

/**
 * Automaton の内部状態を表すインターフェース
 */
export type AutomatonState = {
  readonly word: string;
  readonly startNode: StrokeNode;
  readonly rule: Rule;
  readonly currentNode: StrokeNode;
  readonly edgeHistories: ReadonlyArray<EdgeHistory>;
  readonly failedEventsAtCurrentNode: ReadonlyArray<InputEvent>;
};