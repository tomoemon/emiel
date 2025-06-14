import { StrokeEdge } from "./builderStrokeGraph";
import { KeyboardStateReader } from "./keyboardState";
import { Rule } from "./rule";
import { VirtualKey } from "./virtualKey";

export type KeyEventType = "keyup" | "keydown";
export class InputStroke {
  constructor(
    readonly key: VirtualKey,
    readonly type: KeyEventType,
  ) {}
}

export class InputEvent {
  constructor(
    readonly input: InputStroke,
    readonly keyboardState: KeyboardStateReader,
    readonly timestamp: Date,
  ) {}
}

type MatchResult = {
  type: "matched" | "modified" | "none" | "failed";
  keyCount: number;
};

export function matchCandidateEdge(event: InputEvent, edge: StrokeEdge): MatchResult {
  // 入力されたキーがマッチし、
  if (event.input.key === edge.input.key) {
    // 必要な modifier がすべて押されていたら成功
    if (edge.input.requiredModifier.accept(event.keyboardState)) {
      return {
        type: "matched",
        keyCount: edge.input.requiredModifier.groups.length + 1,
      };
    }
    return { type: "failed", keyCount: 0 };
  }
  if (edge.input.requiredModifier.onlyModifierDowned(event.keyboardState)) {
    return { type: "modified", keyCount: 0 };
  }
  return { type: "none", keyCount: 0 };
}
export function matchOtherEdge(
  event: InputEvent,
  rule: Rule,
  candidateEdges: StrokeEdge[],
): MatchResult {
  if (candidateEdges.length === 0) {
    return { type: "none", keyCount: 0 };
  }
  // 今回の入力が Rule 内のいずれかの entry の最初の入力に match する
  const otherMatched = rule.entriesByKey(event.input.key).filter((entry) => {
    // いずれかの候補エッジと同じ input を持つ entry は除く
    // 結果的に同じ input で異なる output を持つ entry も除かれる
    // 例えば [t: か] という候補エッジがあるとき、[t: t] という entry は除かれる
    return (
      !candidateEdges.some((edge) => {
        return edge.input.equals(entry.input[0]);
      }) && entry.input[0].requiredModifier.accept(event.keyboardState)
    );
  });
  // マッチしたもののうちもっとも modifier が多い entry の modifier の数を返す
  if (otherMatched.length > 0) {
    const keyCount =
      Math.max(...otherMatched.map((e) => e.input[0].requiredModifier.groups.length)) + 1;
    return { type: "matched", keyCount: keyCount };
  }
  // 今回の入力が Rule 内のいずれかの entry の最初の入力の modifier に match する
  const existsModifiedEntries = rule.entriesByModifier(event.input.key).some((entry) => {
    // 候補エッジは除く
    return !candidateEdges.some((edge) => {
      return edge.input.equals(entry.input[0]);
    });
  });
  if (existsModifiedEntries) {
    return { type: "modified", keyCount: 0 };
  }
  return { type: "none", keyCount: 0 };
}
