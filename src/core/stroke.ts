import { StrokeEdge } from "./builder_stroke_graph";
import { KeyboardStateReader } from "./keyboard_state";
import { AndModifier, ModifierGroup } from "./modifier";
import { Comparable } from "./rule";

export type KeyEventType = "keyup" | "keydown";

export class InputStroke<T extends Comparable<T>> {
  constructor(
    readonly key: T,
    readonly type: KeyEventType,
    readonly timestamp: Date
  ) {}
}

export class InputEvent<T extends Comparable<T>> {
  constructor(
    readonly input: InputStroke<T>,
    readonly keyboardState: KeyboardStateReader<T>
  ) {}
  match(edge: StrokeEdge<T>): "ignored" | "matched" | "failed" {
    const necessaryModifiers = edge.input.requiredModifier.groups;
    const unnecessaryModifiers = edge.input.unnecessaryModifiers;

    // 入力されたキーがマッチし、
    if (this.input.key.equals(edge.input.key)) {
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
    // [無変換 + modifier(t) ]: ち
    // として扱われる。このとき、「ち」を打つべきタイミングで、t を単独で押した場合、
    // [無変換 + modifiere(t)] で必要とする modifier が単独で押されていることになるため、無視する。
    // このとき、[t] 単独で「た」が入力された扱いにしてミスとしないための仕様。
    // 厳密には keyup を待ってから判定したりするべきだが、タイピングゲームならではの仕様として許容可能と考える。
    if (necessaryModifiers.some((v) => v.accept(this.keyboardState))) {
      return "ignored";
    }
    return "failed";
  }
}

export class RuleStroke<T extends Comparable<T>> {
  constructor(
    readonly key: T,
    readonly requiredModifier: AndModifier<T>,
    readonly unnecessaryModifiers: ModifierGroup<T>[],
    // キーボードレイアウトによって作られた RuleStroke かどうか。
    // 英字配列・ローマ字入力系に関してはキーボードレイアウトの影響を受けるため true
    // かな配列系に関してはキーボードレイアウトに関係ないため false になる
    readonly isFromKeyboardLayout: boolean = false
  ) {}
  equals(other: RuleStroke<T>): boolean {
    return (
      this.key.equals(other.key) &&
      this.requiredModifier.equals(other.requiredModifier) &&
      this.unnecessaryModifiers.length === other.unnecessaryModifiers.length &&
      this.unnecessaryModifiers.every((v, i) =>
        v.equals(other.unnecessaryModifiers[i])
      )
    );
  }
}
