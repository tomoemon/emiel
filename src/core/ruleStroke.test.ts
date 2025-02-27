import { expect, test } from "vitest";
import { StrokeEdge, StrokeNode } from "./builderStrokeGraph";
import { KeyboardState } from "./keyboardState";
import { AndModifier } from "./modifier";
import { Rule } from "./rule";
import { InputEvent, InputStroke, RuleStroke } from "./ruleStroke";
import { VirtualKeys } from "./virtualKey";

test("シンプルな入力で matched", () => {
  const is = new InputStroke(VirtualKeys.A, "keydown");
  const st = new KeyboardState([VirtualKeys.A]);
  const ev = new InputEvent(is, st, new Date());

  const dummyNode1 = new StrokeNode(0, [], []);
  const dummyNode2 = new StrokeNode(0, [], []);
  const edge = new StrokeEdge(
    new Rule("dummy-rule", [], (v) => v),
    new RuleStroke(VirtualKeys.A, AndModifier.empty),
    dummyNode1,
    dummyNode2
  );

  expect(ev.match(edge)).toEqual(["matched", 1]);
});

test("シンプルな入力で failed", () => {
  const is = new InputStroke(VirtualKeys.B, "keydown");
  const st = new KeyboardState([VirtualKeys.B]);
  const ev = new InputEvent(is, st, new Date());

  const dummyNode1 = new StrokeNode(0, [], []);
  const dummyNode2 = new StrokeNode(0, [], []);
  const edge = new StrokeEdge(
    new Rule("dummy-rule", [], (v) => v),
    new RuleStroke(VirtualKeys.A, AndModifier.empty),
    dummyNode1,
    dummyNode2
  );

  expect(ev.match(edge)).toEqual(["failed", 0]);
});

test("シフトキー単打で failed", () => {
  const is = new InputStroke(VirtualKeys.ShiftLeft, "keydown");
  const st = new KeyboardState([VirtualKeys.ShiftLeft]);
  const ev = new InputEvent(is, st, new Date());

  const dummyNode1 = new StrokeNode(0, [], []);
  const dummyNode2 = new StrokeNode(0, [], []);
  const edge = new StrokeEdge(
    new Rule(
      "dummy-rule",
      [],
      (v) => v
    ),
    new RuleStroke(VirtualKeys.A, AndModifier.empty),
    dummyNode1,
    dummyNode2
  );

  // 配列のすべての要素が一致するかどうかを比較する
  expect(ev.match(edge)).toEqual(["failed", 0]);
});
