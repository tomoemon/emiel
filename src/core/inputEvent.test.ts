import { expect, test } from "vitest";
import { StrokeEdge, StrokeNode } from "./builderStrokeGraph";
import { InputEvent, InputStroke, matchCandidateEdge } from "./inputEvent";
import { KeyboardState } from "./keyboardState";
import { AndModifier } from "./modifier";
import { RuleStroke } from "./ruleStroke";
import { VirtualKeys } from "./virtualKey";

test("シンプルな入力で matched", () => {
  const is = new InputStroke(VirtualKeys.A, "keydown");
  const st = new KeyboardState([VirtualKeys.A]);
  const ev = new InputEvent(is, st, new Date());

  const dummyNode1 = new StrokeNode(0, [], []);
  const dummyNode2 = new StrokeNode(0, [], []);
  const edge = new StrokeEdge(
    new RuleStroke(VirtualKeys.A, AndModifier.empty),
    dummyNode1,
    dummyNode2,
  );

  expect(matchCandidateEdge(ev, edge)).toEqual({
    type: "matched",
    keyCount: 1,
  });
});

test("シンプルな入力で none", () => {
  const is = new InputStroke(VirtualKeys.B, "keydown");
  const st = new KeyboardState([VirtualKeys.B]);
  const ev = new InputEvent(is, st, new Date());

  const dummyNode1 = new StrokeNode(0, [], []);
  const dummyNode2 = new StrokeNode(0, [], []);
  const edge = new StrokeEdge(
    new RuleStroke(VirtualKeys.A, AndModifier.empty),
    dummyNode1,
    dummyNode2,
  );
  expect(matchCandidateEdge(ev, edge)).toEqual({ type: "none", keyCount: 0 });
});

test("シフトキー単打で none", () => {
  const is = new InputStroke(VirtualKeys.ShiftLeft, "keydown");
  const st = new KeyboardState([VirtualKeys.ShiftLeft]);
  const ev = new InputEvent(is, st, new Date());

  const dummyNode1 = new StrokeNode(0, [], []);
  const dummyNode2 = new StrokeNode(0, [], []);
  const edge = new StrokeEdge(
    new RuleStroke(VirtualKeys.A, AndModifier.empty),
    dummyNode1,
    dummyNode2,
  );

  // 配列のすべての要素が一致するかどうかを比較する
  expect(matchCandidateEdge(ev, edge)).toEqual({ type: "none", keyCount: 0 });
});
