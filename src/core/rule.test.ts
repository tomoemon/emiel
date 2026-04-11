import { describe, expect, test } from "vitest";
import { AndModifier } from "./modifier";
import { Rule, RuleEntry } from "./rule";
import { ModifierStroke, type RuleStroke } from "./ruleStroke";
import { VirtualKeys } from "./virtualKey";

function makeEntry(key: keyof typeof VirtualKeys, output: string): RuleEntry {
  return new RuleEntry([new ModifierStroke(VirtualKeys[key], AndModifier.empty)], output, [], true);
}

function makeRule(options: {
  entries: RuleEntry[];
  normalize?: (v: string) => string;
  name?: string;
  backspaceStrokes?: readonly RuleStroke[];
  next?: Rule;
}): Rule {
  return new Rule(
    options.entries,
    options.normalize ?? ((v) => v),
    options.name ?? "",
    options.backspaceStrokes,
    undefined,
    options.next,
  );
}

describe("Rule chain (next)", () => {
  test("next is stored on the head Rule", () => {
    const tail = makeRule({ entries: [makeEntry("A", "a")], name: "tail" });
    const head = makeRule({ entries: [makeEntry("A", "あ")], name: "head", next: tail });
    expect(head.name).toBe("head");
    expect(head.next?.name).toBe("tail");
  });

  test("entriesByKey walks the chain and returns entries from all rules", () => {
    const tail = makeRule({ entries: [makeEntry("A", "a")], name: "tail" });
    const head = makeRule({ entries: [makeEntry("A", "あ")], name: "head", next: tail });
    const entries = head.entriesByKey(VirtualKeys.A);
    expect(entries.map((e) => e.output)).toEqual(["あ", "a"]);
  });

  test("entriesByKey returns head entries first (chain order)", () => {
    const tail = makeRule({ entries: [makeEntry("A", "TAIL")], name: "tail" });
    const head = makeRule({ entries: [makeEntry("A", "HEAD")], name: "head", next: tail });
    const entries = head.entriesByKey(VirtualKeys.A);
    expect(entries.map((e) => e.output)).toEqual(["HEAD", "TAIL"]);
  });

  test("normalize composes head and next normalizers in order", () => {
    const tail = makeRule({
      entries: [makeEntry("A", "x")],
      normalize: (v) => v.replace(/o/g, "O"),
      name: "tail",
    });
    const head = makeRule({
      entries: [makeEntry("A", "x")],
      normalize: (v) => v.toLowerCase(),
      name: "head",
      next: tail,
    });
    // head が "HELLO" → "hello"、tail がさらに "hello" → "hellO"
    expect(head.normalize("HELLO")).toBe("hellO");
  });

  test("backspaceStrokes uses chain head (next side is ignored)", () => {
    const headBackspace = new ModifierStroke(VirtualKeys.Digit0, AndModifier.empty);
    const tailBackspace = new ModifierStroke(VirtualKeys.Digit9, AndModifier.empty);
    const tail = makeRule({
      entries: [makeEntry("B", "b")],
      name: "tail",
      backspaceStrokes: [tailBackspace],
    });
    const head = makeRule({
      entries: [makeEntry("A", "a")],
      name: "head",
      backspaceStrokes: [headBackspace],
      next: tail,
    });
    expect(head.backspaceStrokes).toEqual([headBackspace]);
  });

  test("chain() iterates head-first over all rules in the chain", () => {
    const r3 = makeRule({ entries: [makeEntry("A", "3")], name: "r3" });
    const r2 = makeRule({ entries: [makeEntry("A", "2")], name: "r2", next: r3 });
    const r1 = makeRule({ entries: [makeEntry("A", "1")], name: "r1", next: r2 });
    const names = Array.from(r1.chain()).map((r) => r.name);
    expect(names).toEqual(["r1", "r2", "r3"]);
  });
});
