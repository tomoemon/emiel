import { describe, expect, test } from "vitest";
import { AndModifier } from "./modifier";
import { RuleEntry, RulePrimitive } from "./rule";
import { ModifierStroke, type RuleStroke } from "./ruleStroke";
import { VirtualKeys } from "./virtualKey";

function makeEntry(key: keyof typeof VirtualKeys, output: string): RuleEntry {
  return new RuleEntry([new ModifierStroke(VirtualKeys[key], AndModifier.empty)], output, [], true);
}

function makePrimitive(options: {
  entries: RuleEntry[];
  name?: string;
  backspaceStrokes?: readonly RuleStroke[];
}): RulePrimitive {
  return new RulePrimitive(
    options.entries,
    options.name ?? "",
    options.backspaceStrokes,
    undefined,
  );
}

describe("RulePrimitive", () => {
  test("primitives getter returns itself", () => {
    const r = makePrimitive({ entries: [makeEntry("A", "あ")], name: "r1" });
    expect(r.primitives).toEqual([r]);
  });

  test("entriesByKey returns own entries", () => {
    const r = makePrimitive({ entries: [makeEntry("A", "あ")], name: "r1" });
    const entries = r.entriesByKey(VirtualKeys.A);
    expect(entries.map((e) => e.output)).toEqual(["あ"]);
  });
});

describe("Rule composition via compose()", () => {
  test("compose returns a Rule whose entriesByKey merges all primitives", () => {
    const a = makePrimitive({ entries: [makeEntry("A", "あ")], name: "a" });
    const b = makePrimitive({ entries: [makeEntry("A", "a")], name: "b" });
    const composed = a.compose(b);
    expect(composed.entriesByKey(VirtualKeys.A).map((e) => e.output)).toEqual(["あ", "a"]);
  });

  test("compose preserves head order in primitives", () => {
    const a = makePrimitive({ entries: [makeEntry("A", "HEAD")], name: "a" });
    const b = makePrimitive({ entries: [makeEntry("A", "TAIL")], name: "b" });
    const composed = a.compose(b);
    expect(composed.primitives.map((p) => p.name)).toEqual(["a", "b"]);
    // head (a) の entries が先、tail (b) が後
    expect(composed.entriesByKey(VirtualKeys.A).map((e) => e.output)).toEqual(["HEAD", "TAIL"]);
  });

  test("head の name/guide/backspaceStrokes が合成全体の代表になる", () => {
    const headBs = new ModifierStroke(VirtualKeys.Digit0, AndModifier.empty);
    const tailBs = new ModifierStroke(VirtualKeys.Digit9, AndModifier.empty);
    const head = makePrimitive({
      entries: [makeEntry("A", "a")],
      name: "head",
      backspaceStrokes: [headBs],
    });
    const tail = makePrimitive({
      entries: [makeEntry("B", "b")],
      name: "tail",
      backspaceStrokes: [tailBs],
    });
    const composed = head.compose(tail);
    expect(composed.name).toBe("head");
    expect(composed.backspaceStrokes).toEqual([headBs]);
  });

  test("nested compose は linear な primitives になる", () => {
    const r1 = makePrimitive({ entries: [makeEntry("A", "1")], name: "r1" });
    const r2 = makePrimitive({ entries: [makeEntry("A", "2")], name: "r2" });
    const r3 = makePrimitive({ entries: [makeEntry("A", "3")], name: "r3" });
    const chained = r1.compose(r2).compose(r3);
    expect(chained.primitives.map((p) => p.name)).toEqual(["r1", "r2", "r3"]);
  });

  test("右結合と左結合で同じ primitive 列になる", () => {
    const r1 = makePrimitive({ entries: [makeEntry("A", "1")], name: "r1" });
    const r2 = makePrimitive({ entries: [makeEntry("A", "2")], name: "r2" });
    const r3 = makePrimitive({ entries: [makeEntry("A", "3")], name: "r3" });
    const leftAssoc = r1.compose(r2).compose(r3);
    const rightAssoc = r1.compose(r2.compose(r3));
    expect(leftAssoc.primitives.map((p) => p.name)).toEqual(
      rightAssoc.primitives.map((p) => p.name),
    );
  });

  test("同じ primitive を 2 回 compose すると重複した primitive が並ぶ (仕様)", () => {
    const r = makePrimitive({ entries: [makeEntry("A", "a")], name: "r" });
    const composed = r.compose(r);
    expect(composed.primitives.map((p) => p.name)).toEqual(["r", "r"]);
    // entries が 2 回並ぶ
    expect(composed.entriesByKey(VirtualKeys.A).map((e) => e.output)).toEqual(["a", "a"]);
  });
});
