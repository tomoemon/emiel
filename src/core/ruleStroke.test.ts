import { expect, test } from "vitest";
import { Comparable, Rule } from "./rule";
import { AndModifier, ModifierGroup } from "./modifier";
import { InputEvent, InputStroke, RuleStroke } from "./ruleStroke";
import { KeyboardState } from "./keyboardState";
import { StrokeEdge, StrokeNode } from "./builderStrokeGraph";

class Key implements Comparable<Key> {
  constructor(public readonly code: string) {}
  equals(other: Key): boolean {
    return this.code === other.code;
  }
  toString(): string {
    return this.code;
  }
}

const keys = {
  A: new Key("A"),
  B: new Key("B"),
  C: new Key("C"),
  D: new Key("D"),
  E: new Key("E"),
  K: new Key("K"),
  N: new Key("N"),
  Shift: new Key("SHIFT"),
} as const;

const nullModifier = new AndModifier<Key>();

test("シンプルな入力で matched", () => {
  const is = new InputStroke<Key>(keys.A, "keydown", new Date());
  const st = new KeyboardState<Key>([keys.A]);
  const ev = new InputEvent<Key>(is, st);

  const dummyNode1 = new StrokeNode<Key>(0, [], []);
  const dummyNode2 = new StrokeNode<Key>(0, [], []);
  const edge = new StrokeEdge<Key>(
    new Rule<Key>("dummy-rule", [], [], (v) => v),
    new RuleStroke<Key>(keys.A, nullModifier, []),
    dummyNode1,
    dummyNode2
  );

  expect(ev.match(edge)).toBe("matched");
});

test("シンプルな入力で failed", () => {
  const is = new InputStroke<Key>(keys.B, "keydown", new Date());
  const st = new KeyboardState<Key>([keys.B]);
  const ev = new InputEvent<Key>(is, st);

  const dummyNode1 = new StrokeNode<Key>(0, [], []);
  const dummyNode2 = new StrokeNode<Key>(0, [], []);
  const edge = new StrokeEdge<Key>(
    new Rule<Key>("dummy-rule", [], [], (v) => v),
    new RuleStroke<Key>(keys.A, nullModifier, []),
    dummyNode1,
    dummyNode2
  );

  expect(ev.match(edge)).toBe("failed");
});

test("シフトキー単打で ignored", () => {
  const is = new InputStroke<Key>(keys.Shift, "keydown", new Date());
  const st = new KeyboardState<Key>([keys.Shift]);
  const ev = new InputEvent<Key>(is, st);

  const dummyNode1 = new StrokeNode<Key>(0, [], []);
  const dummyNode2 = new StrokeNode<Key>(0, [], []);
  const edge = new StrokeEdge<Key>(
    new Rule<Key>(
      "dummy-rule",
      [],
      [new ModifierGroup<Key>([keys.Shift])],
      (v) => v
    ),
    new RuleStroke<Key>(keys.A, nullModifier, []),
    dummyNode1,
    dummyNode2
  );

  expect(ev.match(edge)).toBe("ignored");
});
