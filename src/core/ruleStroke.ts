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
  match(edge: StrokeEdge): "ignored" | "matched" | "failed" {
    const necessaryModifiers = edge.input.requiredModifier.groups;
    const unnecessaryModifiers = edge.input.unnecessaryModifiers;

    // 入力されたキーがマッチし、
    if (this.input.key === edge.input.key) {
      // 必要な modifier がすべて押されていて、
      if (necessaryModifiers.every((v) => v.accept(this.keyboardState))) {
        // 不要な modifier が1つも押されていないときに成功
        if (!unnecessaryModifiers.some((v) => v.accept(this.keyboardState))) {
          return "matched";
        }
      }
      return "failed";
    }
    const ruleModifierGroups = edge.rule.modifierGroups;
    // 入力されたキーがマッチせず、
    // 入力ルールで modifier として扱われているキーの入力が来た場合は無視する。
    // 英数字入力における Shift キーの単独押下などの場合が該当する。
    if (
      ruleModifierGroups.some((v) => {
        return v.has(this.input.key);
      })
    ) {
      return "ignored";
    }
    // このStrokeEdgeのみで必要とされる modifier が単独で押されている場合も無視する
    // 例えば同時押し系配列の場合、
    // [t]:た
    // [t | 無変換]:ち
    // というルールがある場合、
    // [t]:た
    // [t + modifier(無変換)]:ち
    // [無変換 + modifier(t)]: ち
    // として扱われる。このとき、「ち」を打つべきタイミングで、t を単独で押した場合、
    // [無変換 + modifiere(t)] で必要とする modifier が単独で押されていることになるため、無視する。
    // このとき、[t] 単独で「た」が入力された扱いにしてミスとしないための仕様。
    // 厳密には keyup を待ってから判定したりするべきだが、タイピングゲームならではの仕様として許容可能と考える。
    if (
      this.keyboardState.downedKeys.length > 0 &&
      this.keyboardState.downedKeys.every((key) =>
        necessaryModifiers.some((v) => {
          return v.has(key);
        })
      )
    ) {
      return "ignored";
    }
    return "failed";
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
    readonly unnecessaryModifiers: ModifierGroup[],
    readonly romanChar: string = ""
  ) { }
  equals(other: RuleStroke): boolean {
    return (
      this.key === other.key &&
      this.requiredModifier.equals(other.requiredModifier) &&
      this.unnecessaryModifiers.length === other.unnecessaryModifiers.length &&
      this.unnecessaryModifiers.every((v, i) =>
        v.equals(other.unnecessaryModifiers[i])
      )
    );
  }
}
