import { StrokeEdge } from "./builderStrokeGraph";
import { KeyboardStateReader } from "./keyboardState";
import { AndModifier } from "./modifier";
import { VirtualKey } from "./virtualKey";

export type KeyEventType = "keyup" | "keydown";

export class InputStroke {
  constructor(readonly key: VirtualKey, readonly type: KeyEventType) { }
}

export class InputEvent {
  constructor(
    readonly input: InputStroke,
    readonly keyboardState: KeyboardStateReader,
    readonly timestamp: Date
  ) { }
  match(edge: StrokeEdge): ["matched" | "modified" | "failed", number] {
    // 入力されたキーがマッチし、
    if (this.input.key === edge.input.key) {
      // 必要な modifier がすべて押されていたら成功
      if (edge.input.requiredModifier.accept(this.keyboardState)) {
        return ["matched", edge.input.requiredModifier.groups.length + 1];
      }
      return ["failed", 0];
    }
    if (edge.input.requiredModifier.onlyModifierDowned(this.keyboardState)) {
      return ["modified", 0];
    }
    return ["failed", 0];
  }
  matchOther(candidateEdges: StrokeEdge[]): ["matched" | "modified" | "ignored", number] {
    if (candidateEdges.length === 0) {
      return ["ignored", 0];
    }
    const rule = candidateEdges[0].rule;
    // 今回の入力が Rule 内のいずれかの entry の最初の入力に match する
    const otherMatched = rule.entriesByKey(this.input.key).filter((entry) => {
      // いずれかの候補エッジと同じ input を持つ entry は除く
      // 結果的に同じ input で異なる output を持つ entry も除かれる
      // 例えば [t: か] という候補エッジがあるとき、[t: t] という entry は除かれる
      return (!candidateEdges.some((edge) => {
        return edge.input.equals(entry.input[0]);
      }) && entry.input[0].requiredModifier.accept(this.keyboardState));
    });
    // マッチしたもののうちもっとも modifier が多い entry の modifier の数を返す
    if (otherMatched.length > 0) {
      const matchedCount = Math.max(...otherMatched.map((e) => e.input[0].requiredModifier.groups.length)) + 1;
      return ["matched", matchedCount];
    }
    // 今回の入力が Rule 内のいずれかの entry の最初の入力の modifier に match する
    const existsModifiedEntries = rule.entriesByModifier(this.input.key).some((entry) => {
      // 候補エッジは除く
      return !candidateEdges.some((edge) => {
        return edge.input.equals(entry.input[0]);
      });
    });
    if (existsModifiedEntries) {
      return ["modified", 0];
    }
    return ["ignored", 0];
  }
}

export class RuleStroke {
  /**
   * 
   * @param key 入力が必要なキー
   * @param requiredModifier key を押下する前に事前に押下しておく必要がある修飾キー
   * @param romanChar ローマ字入力系（mozcRule）のルールで作られたRuleStrokeの場合、ローマ字を表す文字を持つ
   */
  constructor(
    readonly key: VirtualKey,
    readonly requiredModifier: AndModifier,
    readonly romanChar: string = ""
  ) { }
  equals(other: RuleStroke): boolean {
    return (
      this.key === other.key &&
      this.requiredModifier.equals(other.requiredModifier)
    );
  }
}
