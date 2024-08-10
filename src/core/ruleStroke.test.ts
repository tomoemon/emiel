import { expect, test } from "vitest";
import { Rule } from "./rule";
import { AndModifier, ModifierGroup } from "./modifier";
import { InputEvent, InputStroke, RuleStroke } from "./ruleStroke";
import { KeyboardState } from "./keyboardState";
import { StrokeEdge, StrokeNode } from "./builderStrokeGraph";
import { VirtualKeys } from "./virtualKey";

const nullModifier = new AndModifier();

test("シンプルな入力で matched", () => {
  const is = new InputStroke(VirtualKeys.A, "keydown");
  const st = new KeyboardState([VirtualKeys.A]);
  const ev = new InputEvent(is, st, new Date());

  const dummyNode1 = new StrokeNode(0, [], []);
  const dummyNode2 = new StrokeNode(0, [], []);
  const edge = new StrokeEdge(
    new Rule("dummy-rule", [], [], (v) => v),
    new RuleStroke(VirtualKeys.A, nullModifier, []),
    dummyNode1,
    dummyNode2
  );

  expect(ev.match(edge)).toBe("matched");
});

test("シンプルな入力で failed", () => {
  const is = new InputStroke(VirtualKeys.B, "keydown");
  const st = new KeyboardState([VirtualKeys.B]);
  const ev = new InputEvent(is, st, new Date());

  const dummyNode1 = new StrokeNode(0, [], []);
  const dummyNode2 = new StrokeNode(0, [], []);
  const edge = new StrokeEdge(
    new Rule("dummy-rule", [], [], (v) => v),
    new RuleStroke(VirtualKeys.A, nullModifier, []),
    dummyNode1,
    dummyNode2
  );

  expect(ev.match(edge)).toBe("failed");
});

test("シフトキー単打で ignored", () => {
  const is = new InputStroke(VirtualKeys.ShiftLeft, "keydown");
  const st = new KeyboardState([VirtualKeys.ShiftLeft]);
  const ev = new InputEvent(is, st, new Date());

  const dummyNode1 = new StrokeNode(0, [], []);
  const dummyNode2 = new StrokeNode(0, [], []);
  const edge = new StrokeEdge(
    new Rule(
      "dummy-rule",
      [],
      [new ModifierGroup([VirtualKeys.ShiftLeft])],
      (v) => v
    ),
    new RuleStroke(VirtualKeys.A, nullModifier, []),
    dummyNode1,
    dummyNode2
  );

  expect(ev.match(edge)).toBe("ignored");
});
