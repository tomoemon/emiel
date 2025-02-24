import { StrokeEdge } from "./builderStrokeGraph";
import { KeyboardStateReader } from "./keyboardState";
import { AndModifier, ModifierGroup } from "./modifier";
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
  match(edge: StrokeEdge): "ignored" | "matched" | "modified" | "failed" {
    // 入力されたキーがマッチし、
    if (this.input.key === edge.input.key) {
      // 必要な modifier がすべて押されていて、
      if (edge.input.requiredModifier.accept(this.keyboardState)) {
        // 不要な modifier が1つも押されていないときに成功
        if (!edge.input.unnecessaryModifiers.accept(this.keyboardState)) {
          return "matched";
        }
      }
      return "failed";
    }

    // 今回の入力がいずれかの entry の最初の入力に match したもの
    const otherEntries = edge.rule.entriesByKey(this.input.key).filter((entry) => {
      return entry.input[0].requiredModifier.accept(this.keyboardState);
    });

    // このStrokeEdgeで必要とされる modifier のみが押されている場合
    // 例えば同時押し系配列の場合、
    // [t]:た
    // [t | 無変換]:ち
    // というルールがある場合、
    // [t]:た
    // [t + modifier(無変換)]:ち
    // [無変換 + modifier(t)]: ち
    // として扱われる。このとき、「ち」を打つべきタイミングで、t を単独で押した場合、
    // [無変換 + modifiere(t)] で必要とする modifier が単独で押されていることになる。
    if (otherEntries.length > 0) {
      if (edge.input.requiredModifier.onlyModifierDowned(this.keyboardState) && otherEntries.length > 0) {
        return "modified";
      }
      // いずれかの entry の最初の入力に match した場合はミス入力として扱う
      return "failed";
    } else {
      return "ignored";
    }
  }
}

export class RuleStroke {
  /**
   * 
   * @param key 入力が必要なキー
   * @param requiredModifier key を押下する前に事前に押下しておく必要がある修飾キー
   * @param unnecessaryModifiers 事前に押下してはいけない修飾キー
   * @param romanChar ローマ字入力系（mozcRule）のルールで作られたRuleStrokeの場合、ローマ字を表す文字を持つ
   */
  constructor(
    readonly key: VirtualKey,
    readonly requiredModifier: AndModifier,
    readonly unnecessaryModifiers: ModifierGroup,
    readonly romanChar: string = ""
  ) { }
  equals(other: RuleStroke): boolean {
    return (
      this.key === other.key &&
      this.requiredModifier.equals(other.requiredModifier) &&
      this.unnecessaryModifiers.equals(other.unnecessaryModifiers)
    );
  }
}
