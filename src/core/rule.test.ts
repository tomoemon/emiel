import { describe, expect, test } from "vitest";
import { AndModifier } from "./modifier";
import { RuleEntry, RulePrimitive } from "./rule";
import { SingleStroke, type RuleStroke } from "./ruleStroke";
import { VirtualKeys } from "./virtualKey";

function makeEntry(key: keyof typeof VirtualKeys, output: string): RuleEntry {
  return new RuleEntry([new SingleStroke(VirtualKeys[key], AndModifier.empty)], output, [], true);
}

function makePrimitive(options: {
  entries: RuleEntry[];
  name?: string;
  backspaceStrokes?: readonly RuleStroke[];
}): RulePrimitive {
  return new RulePrimitive(
    options.entries,
    { name: options.name ?? "", url: "" },
    options.backspaceStrokes,
  );
}

function sourcesOf(entries: readonly RuleEntry[]): Set<RulePrimitive> {
  const set = new Set<RulePrimitive>();
  for (const e of entries) for (const s of e.sources) set.add(s);
  return set;
}

describe("RulePrimitive", () => {
  test("rawEntries の sources に自身がタグ付けされる", () => {
    const r = makePrimitive({ entries: [makeEntry("A", "あ")], name: "r1" });
    expect(r.rawEntries.length).toBe(1);
    expect(r.rawEntries[0].sources).toEqual([r]);
  });

  test("entriesByKey returns own entries", () => {
    const r = makePrimitive({ entries: [makeEntry("A", "あ")], name: "r1" });
    const entries = r.entriesByKey(VirtualKeys.A);
    expect(entries.map((e) => e.output)).toEqual(["あ"]);
  });
});

describe("Rule integration via merge()", () => {
  test("merge returns a RulePrimitive whose entries combine both rules", () => {
    const a = makePrimitive({ entries: [makeEntry("A", "あ")], name: "a" });
    const b = makePrimitive({ entries: [makeEntry("A", "a")], name: "b" });
    const composed = a.merge(b);
    expect(composed.entriesByKey(VirtualKeys.A).map((e) => e.output)).toEqual(["あ", "a"]);
  });

  test("merge preserves head order in entries", () => {
    const a = makePrimitive({ entries: [makeEntry("A", "HEAD")], name: "a" });
    const b = makePrimitive({ entries: [makeEntry("A", "TAIL")], name: "b" });
    const composed = a.merge(b);
    // head (a) の entries が先、tail (b) が後
    expect(composed.entriesByKey(VirtualKeys.A).map((e) => e.output)).toEqual(["HEAD", "TAIL"]);
  });

  test("merge 後の各 entry の sources に元の RulePrimitive が保持される", () => {
    const a = makePrimitive({ entries: [makeEntry("A", "HEAD")], name: "a" });
    const b = makePrimitive({ entries: [makeEntry("B", "TAIL")], name: "b" });
    const composed = a.merge(b);
    const aEntry = composed.entries.find((e) => e.output === "HEAD");
    const bEntry = composed.entries.find((e) => e.output === "TAIL");
    expect(aEntry?.sources).toEqual([a]);
    expect(bEntry?.sources).toEqual([b]);
  });

  test("head の name/backspaceStrokes が合成全体の代表になる", () => {
    const headBs = new SingleStroke(VirtualKeys.Digit0, AndModifier.empty);
    const tailBs = new SingleStroke(VirtualKeys.Digit9, AndModifier.empty);
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
    const composed = head.merge(tail);
    expect(composed.metadata.name).toBe("head");
    expect(composed.backspaceStrokes).toEqual([headBs]);
  });

  test("nested merge で sources に全ての寄与 primitive が出現する", () => {
    const r1 = makePrimitive({ entries: [makeEntry("A", "1")], name: "r1" });
    const r2 = makePrimitive({ entries: [makeEntry("B", "2")], name: "r2" });
    const r3 = makePrimitive({ entries: [makeEntry("C", "3")], name: "r3" });
    const chained = r1.merge(r2).merge(r3);
    const sources = sourcesOf(chained.entries);
    expect(sources.has(r1)).toBe(true);
    expect(sources.has(r2)).toBe(true);
    expect(sources.has(r3)).toBe(true);
  });

  test("右結合と左結合で同じ entries 出力集合になる", () => {
    const r1 = makePrimitive({ entries: [makeEntry("A", "1")], name: "r1" });
    const r2 = makePrimitive({ entries: [makeEntry("B", "2")], name: "r2" });
    const r3 = makePrimitive({ entries: [makeEntry("C", "3")], name: "r3" });
    const leftAssoc = r1.merge(r2).merge(r3);
    const rightAssoc = r1.merge(r2.merge(r3));
    const leftOutputs = leftAssoc.entries.map((e) => e.output).toSorted();
    const rightOutputs = rightAssoc.entries.map((e) => e.output).toSorted();
    expect(leftOutputs).toEqual(rightOutputs);
  });

  test("同じ primitive を 2 回 merge しても sources は 1 要素（参照 unique）", () => {
    const r = makePrimitive({ entries: [makeEntry("A", "a")], name: "r" });
    const composed = r.merge(r);
    // 同じ primitive の rawEntries は 2 回 union されるが、エントリ自体は参照共有なので
    // sources もそのまま。ここでは両方の entries が同じ参照を持ち、sources=[r] になる。
    for (const entry of composed.entries) {
      expect(entry.sources).toEqual([r]);
    }
  });
});
