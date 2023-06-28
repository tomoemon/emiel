import { StrokeEdge } from "./builder_stroke_graph";
import { KeyboardStateReader } from "./keyboard_state";
import { Comparable, Modifier } from "./rule";

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
    const ruleModifierGroups = edge.rule.modifierGroups;
    const necessaryModifiers = edge.input.modifier.groups;
    const unnecessaryModifiers = ruleModifierGroups.filter(
      (v) => !necessaryModifiers.some((w) => w.equals(v))
    );
    // 入力ルールで modifier として扱われているキーの入力が来た場合は無視する
    if (
      ruleModifierGroups.some((v) => {
        return v.has(this.input.key);
      })
    ) {
      return "ignored";
    }
    // 入力されたキーが一致していなければ failed
    if (!this.input.key.equals(edge.input.keys[0])) {
      return "failed";
    }
    // 必要な modifier が押されていることをチェックする
    if (!necessaryModifiers.every((v) => v.accept(this.keyboardState))) {
      return "failed";
    }
    // 不要な modifier が押されていないことをチェックする
    if (unnecessaryModifiers.some((v) => v.accept(this.keyboardState))) {
      return "failed";
    }
    return "matched";
  }
}

export class RuleStroke<T extends Comparable<T>> {
  constructor(readonly keys: T[], readonly modifier: Modifier<T>) {}
  equals(other: RuleStroke<T>): boolean {
    return (
      this.keys.length === other.keys.length &&
      this.keys.every((v, i) => v.equals(other.keys[i])) &&
      this.modifier.equals(other.modifier)
    );
  }
}
