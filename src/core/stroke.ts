import { StrokeEdge } from "./builder_stroke_graph";
import { KeyboardStateReader } from "./keyboard_state";
import { Comparable, Modifier, ModifierGroup } from "./rule";

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
    if (this.input.key.equals(edge.input.keys[0])) {
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
    // 入力ルールで modifier として扱われているキーの入力が来た場合は無視する
    if (
      ruleModifierGroups.some((v) => {
        return v.has(this.input.key);
      })
    ) {
      return "ignored";
    }
    return "failed";
  }
}

export class RuleStroke<T extends Comparable<T>> {
  constructor(
    readonly keys: T[],
    readonly requiredModifier: Modifier<T>,
    readonly unnecessaryModifiers: ModifierGroup<T>[]
  ) {}
  toString(): string {
    return `{${this.keys.map((v) => v.toString()).join("")} ${
      this.requiredModifier
    } (${this.unnecessaryModifiers
      .map((v) => v.modifiers.join(""))
      .join(" ")})}`;
  }
  equals(other: RuleStroke<T>): boolean {
    return (
      this.keys.length === other.keys.length &&
      this.keys.every((v, i) => v.equals(other.keys[i])) &&
      this.requiredModifier.equals(other.requiredModifier) &&
      this.unnecessaryModifiers.length === other.unnecessaryModifiers.length &&
      this.unnecessaryModifiers.every((v, i) =>
        v.equals(other.unnecessaryModifiers[i])
      )
    );
  }
}
