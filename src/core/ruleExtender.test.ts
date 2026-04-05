import { expect, test } from "vitest";
import { AndModifier } from "./modifier";
import { RuleEntry } from "./rule";
import { expandPrefixRules } from "./ruleExtender";
import { ModifierStroke } from "./ruleStroke";
import type { VirtualKey } from "./virtualKey";
import { VirtualKeys } from "./virtualKey";

const s = (key: VirtualKey) => new ModifierStroke(key, AndModifier.empty);
const entry = (input: VirtualKey[], output: string, nextInput: VirtualKey[] = [], extend = true) =>
  new RuleEntry(input.map(s), output, nextInput.map(s), extend);

function findByOutput(entries: RuleEntry[], output: string): RuleEntry[] {
  return entries.filter((e) => e.output === output);
}

function inputKeys(entry: RuleEntry): string[] {
  return entry.input.map((i) => (i as ModifierStroke).key);
}

function nextInputKeys(entry: RuleEntry): string[] {
  return entry.nextInput.map((i) => (i as ModifierStroke).key);
}

test("英数字は展開しない", () => {
  const entries = [entry([VirtualKeys.A], "a"), entry([VirtualKeys.B], "b")];
  const result = expandPrefixRules(entries);
  expect(result.length).toBe(2);
});

test("んの展開", () => {
  const entries = [
    entry([VirtualKeys.N], "ん"),
    entry([VirtualKeys.N, VirtualKeys.A], "な"),
    entry([VirtualKeys.K, VirtualKeys.A], "か"),
  ];
  const result = expandPrefixRules(entries);
  // n→ん は nk→ん/[k] に展開される
  const extendedN = findByOutput(result, "ん");
  expect(extendedN.length).toBe(1);
  expect(inputKeys(extendedN[0])).toEqual([VirtualKeys.N, VirtualKeys.K]);
  expect(nextInputKeys(extendedN[0])).toEqual([VirtualKeys.K]);
  // na→な, ka→か はそのまま残る
  const na = findByOutput(result, "な");
  expect(na.length).toBe(1);
  expect(inputKeys(na[0])).toEqual([VirtualKeys.N, VirtualKeys.A]);
  const ka = findByOutput(result, "か");
  expect(ka.length).toBe(1);
  expect(inputKeys(ka[0])).toEqual([VirtualKeys.K, VirtualKeys.A]);
});

test("複数の独立したプレフィックス競合", () => {
  const entries = [
    entry([VirtualKeys.N], "ん"),
    entry([VirtualKeys.N, VirtualKeys.A], "な"),
    entry([VirtualKeys.S], "さ"),
    entry([VirtualKeys.S, VirtualKeys.I], "し"),
    entry([VirtualKeys.K, VirtualKeys.A], "か"),
  ];
  const result = expandPrefixRules(entries);

  // n→ん, s→さ は展開されて消える（元の形では残らない）
  const originalN = result.filter((e) => e.output === "ん" && e.input.length === 1);
  expect(originalN.length).toBe(0);
  const originalS = result.filter((e) => e.output === "さ" && e.input.length === 1);
  expect(originalS.length).toBe(0);

  // na→な, si→し, ka→か はそのまま残る
  expect(findByOutput(result, "な").length).toBe(1);
  expect(findByOutput(result, "し").length).toBe(1);
  expect(findByOutput(result, "か").length).toBe(1);

  // n の展開: nk→ん/[k] が存在する
  const nExpanded = findByOutput(result, "ん");
  const nk = nExpanded.find(
    (e) => inputKeys(e).join(",") === [VirtualKeys.N, VirtualKeys.K].join(","),
  );
  if (nk === undefined) throw new Error("nk not found");
  expect(nextInputKeys(nk)).toEqual([VirtualKeys.K]);

  // s の展開: sk→さ/[k] が存在する
  const sExpanded = findByOutput(result, "さ");
  const sk = sExpanded.find(
    (e) => inputKeys(e).join(",") === [VirtualKeys.S, VirtualKeys.K].join(","),
  );
  if (sk === undefined) throw new Error("sk not found");
  expect(nextInputKeys(sk)).toEqual([VirtualKeys.K]);
});

test("プレフィックスの連鎖", () => {
  const entries = [
    entry([VirtualKeys.N], "ん"),
    entry([VirtualKeys.N, VirtualKeys.N], "なぬ"),
    entry([VirtualKeys.N, VirtualKeys.N, VirtualKeys.N], "ななな"),
    entry([VirtualKeys.K, VirtualKeys.A], "か"),
  ];
  const result = expandPrefixRules(entries);

  // n→ん は nk→ん/[k] に展開
  const nExpanded = findByOutput(result, "ん");
  expect(nExpanded.length).toBe(1);
  expect(inputKeys(nExpanded[0])).toEqual([VirtualKeys.N, VirtualKeys.K]);
  expect(nextInputKeys(nExpanded[0])).toEqual([VirtualKeys.K]);

  // nn→なぬ は nnk→なぬ/[k] に展開
  const nnExpanded = findByOutput(result, "なぬ");
  expect(nnExpanded.length).toBe(1);
  expect(inputKeys(nnExpanded[0])).toEqual([VirtualKeys.N, VirtualKeys.N, VirtualKeys.K]);
  expect(nextInputKeys(nnExpanded[0])).toEqual([VirtualKeys.K]);

  // nnn→ななな はそのまま残る
  const nnn = findByOutput(result, "ななな");
  expect(nnn.length).toBe(1);
  expect(inputKeys(nnn[0])).toEqual([VirtualKeys.N, VirtualKeys.N, VirtualKeys.N]);

  // ka→か はそのまま残る
  expect(findByOutput(result, "か").length).toBe(1);
});

test("nextInputを持つエントリがある場合（プレフィックス競合なし）", () => {
  // tt→っ/[t] と ta→た は同じ長さ（2ストローク）でプレフィックス関係にない
  const entries = [
    entry([VirtualKeys.T, VirtualKeys.T], "っ", [VirtualKeys.T]),
    entry([VirtualKeys.T, VirtualKeys.A], "た"),
    entry([VirtualKeys.A], "あ"),
  ];
  const result = expandPrefixRules(entries);
  // 全エントリがそのまま残る
  expect(result.length).toBe(3);

  const tsu = findByOutput(result, "っ");
  expect(tsu.length).toBe(1);
  expect(inputKeys(tsu[0])).toEqual([VirtualKeys.T, VirtualKeys.T]);
  expect(nextInputKeys(tsu[0])).toEqual([VirtualKeys.T]);
});

test("extendCommonPrefixCommonEntry=false のエントリは展開対象外", () => {
  const entries = [
    entry([VirtualKeys.N], "ん", [], false), // extend=false
    entry([VirtualKeys.N, VirtualKeys.A], "な"),
    entry([VirtualKeys.K, VirtualKeys.A], "か"),
  ];
  const result = expandPrefixRules(entries);

  // n→ん(extend=false) は展開されずにそのまま残る
  const n = result.filter((e) => e.output === "ん" && e.input.length === 1);
  expect(n.length).toBe(1);
  expect(n[0].extendCommonPrefixCommonEntry).toBe(false);
});

test("1ストロークの結合先はoutputがマージされる", () => {
  // k, b は1ストロークでプレフィックス競合なし
  const entries = [
    entry([VirtualKeys.N], "ん"),
    entry([VirtualKeys.N, VirtualKeys.A], "な"),
    entry([VirtualKeys.K], "き"),
    entry([VirtualKeys.B], "ぶ"),
  ];
  const result = expandPrefixRules(entries);

  // n→ん は展開される
  const originalN = result.filter((e) => e.output === "ん" && e.input.length === 1);
  expect(originalN.length).toBe(0);

  // nk→んき (1ストロークk→きとの結合でoutputがマージ)
  const nk = result.find(
    (e) => inputKeys(e).join(",") === [VirtualKeys.N, VirtualKeys.K].join(","),
  );
  if (nk === undefined) throw new Error("nk not found");
  expect(nk.output).toBe("んき");
  expect(nk.nextInput.length).toBe(0);

  // nb→んぶ (1ストロークb→ぶとの結合でoutputがマージ)
  const nb = result.find(
    (e) => inputKeys(e).join(",") === [VirtualKeys.N, VirtualKeys.B].join(","),
  );
  if (nb === undefined) throw new Error("nb not found");
  expect(nb.output).toBe("んぶ");
  expect(nb.nextInput.length).toBe(0);

  // k→き, b→ぶ はそのまま残る
  expect(findByOutput(result, "き").length).toBe(1);
  expect(findByOutput(result, "ぶ").length).toBe(1);

  // na→な はそのまま残る
  expect(findByOutput(result, "な").length).toBe(1);
});

test("展開先候補がない場合は元エントリが削除される", () => {
  // n以外で始まるエントリがないので展開先がない
  // この場合 n→ん は使われる機会がないため削除される
  const entries = [
    entry([VirtualKeys.N], "ん"),
    entry([VirtualKeys.N, VirtualKeys.A], "な"),
    entry([VirtualKeys.N, VirtualKeys.I], "に"),
    entry([VirtualKeys.N, VirtualKeys.U], "ぬ"),
  ];
  const result = expandPrefixRules(entries);

  // n→ん は削除される（展開先がなく、常に na/ni/nu が優先されるため）
  const n = result.filter((e) => e.output === "ん" && e.input.length === 1);
  expect(n.length).toBe(0);

  // na, ni, nu はそのまま残る
  expect(result.length).toBe(3);
});
