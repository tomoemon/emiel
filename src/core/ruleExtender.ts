import { RuleEntry, type RulePrimitive } from "./rule";
import type { RuleStroke } from "./ruleStroke";

function unionSources(
  a: readonly RulePrimitive[],
  b: readonly RulePrimitive[],
): readonly RulePrimitive[] {
  const seen = new Set<RulePrimitive>();
  const result: RulePrimitive[] = [];
  for (const s of a) {
    if (!seen.has(s)) {
      seen.add(s);
      result.push(s);
    }
  }
  for (const s of b) {
    if (!seen.has(s)) {
      seen.add(s);
      result.push(s);
    }
  }
  return result;
}

// プレフィックス競合の展開
//
// 日本語入力ルールでは、あるエントリの input が別のエントリの input の
// 真のプレフィックスになっている場合がある。例：
//   n → ん, na → な, ka → か
// このとき n を打っただけでは「ん」を確定できない（次が a なら na → な になる）。
// この関数は、そうしたプレフィックス競合を事前に解消し、
// オートマトンが単純な最長一致で動作できるようにする。
//
// アルゴリズム:
//   1. 全エントリを Map<inputHash, RuleEntry> に格納する
//   2. Map 内で「自身の input が他エントリの input の真のプレフィックスになっている」
//      エントリ（競合エントリ）を1つ探す
//   3. 見つからなければ終了
//   4. 競合エントリを Map から削除し、競合しないエントリと結合した拡張エントリを生成して追加する
//   5. 2 に戻る
//
// 拡張エントリの生成ルール（競合エントリ E と結合先エントリ F について）:
//   - F が1ストロークの場合: input=E.input+F.input, output=E.output+F.output
//     例: n/ん + k/き → nk/んき
//   - F が複数ストロークの場合: input=E.input+F.input[0], output=E.output, nextInput=[F.input[0]]
//     例: n/ん + ka/か → nk/ん/[k]（nk まで打つと「ん」が確定し、k が次の入力として戻される）
//
// 結合先の選定:
//   競合エントリ n/ん に対し、na/な の2打目 a は「取られたストローク」となる。
//   a で始まるエントリは結合先にできない（na と区別できないため）。
//   また n 自身の先頭ストローク n も除外する。
//   残った先頭ストロークを持つエントリのみが結合先となる。
//
// 具体例:
//   入力: n/ん, na/な, ka/か
//   → n は na のプレフィックス。取られたストローク = {a, n}
//   → 結合先: ka（先頭 k は取られていない、複数ストローク）
//   → 拡張: nk/ん/[k]
//   結果: nk/ん/[k], na/な, ka/か
//
// 停止性:
//   各イテレーションで1エントリが削除され、追加されるエントリは元より長い input を持つ。
//   ストロークの組み合わせは有限なので必ず停止する。

export function expandPrefixRules(entries: RuleEntry[]): RuleEntry[] {
  // extendable=true のエントリのみを「競合検出・削除」の対象として渡す。
  // 結合先候補は resolvePrefixConflicts 内で全 entries から選ばれるので、
  // unextendable なエントリも結合先として使われうる（元エントリは最終結果に残る）。
  const unextendable = entries.filter((e) => !e.extendCommonPrefixCommonEntry);
  const extendable = entries.filter((e) => e.extendCommonPrefixCommonEntry);
  return [...unextendable, ...resolvePrefixConflicts(extendable, entries)];
}

function strokeHash(...strokes: RuleStroke[]): string {
  return strokes
    .map((s) => {
      if (s.kind === "single") {
        return `sg:${s.key.toString()}/${s.requiredModifier.toString()}`;
      }
      // simultaneous: 順不同なのでキーをソートしてハッシュ化
      return `sm:${[...s.keys]
        .map((k) => k.toString())
        .sort()
        .join("+")}`;
    })
    .join("-");
}

// Map 内で最初に見つかったプレフィックス競合を返す。
// 同一 strokeHash に複数エントリが属しうるため、Map<string, RuleEntry[]> を使う。
// takenStrokes: 競合エントリの次の位置で使われているストロークと自身の先頭ストロークの集合。
// これらのストロークで始まるエントリは結合先にできない。
function findPrefixConflict(groups: Map<string, RuleEntry[]>): {
  hash: string;
  takenStrokes: Set<string>;
} | null {
  for (const [hash, entries] of groups) {
    if (entries.length === 0) continue;
    const inputLength = entries[0].input.length;
    const takenStrokes = new Set<string>();
    let hasConflict = false;
    for (const otherGroup of groups.values()) {
      for (const other of otherGroup) {
        if (other.input.length <= inputLength) continue;
        if (strokeHash(...other.input.slice(0, inputLength)) === hash) {
          takenStrokes.add(strokeHash(other.input[inputLength]));
          hasConflict = true;
        }
      }
    }
    if (hasConflict) {
      takenStrokes.add(strokeHash(entries[0].input[0]));
      return { hash, takenStrokes };
    }
  }
  return null;
}

/**
 * groups に newEntry を追加する。既に equals で一致するエントリがある場合は
 * sources を union した新エントリで置き換える（重複エントリの sources 併合）。
 */
function addOrMergeEntry(groups: Map<string, RuleEntry[]>, newEntry: RuleEntry): void {
  const key = strokeHash(...newEntry.input);
  const arr = groups.get(key);
  if (!arr) {
    groups.set(key, [newEntry]);
    return;
  }
  const existingIdx = arr.findIndex((e) => e.equals(newEntry));
  if (existingIdx >= 0) {
    const existing = arr[existingIdx];
    const merged = new RuleEntry(
      existing.input,
      existing.output,
      existing.nextInput,
      existing.extendCommonPrefixCommonEntry,
      unionSources(existing.sources, newEntry.sources),
    );
    arr[existingIdx] = merged;
    return;
  }
  arr.push(newEntry);
}

function resolvePrefixConflicts(entries: RuleEntry[], allEntries: RuleEntry[]): RuleEntry[] {
  // 同一 strokeHash に複数エントリが属すケース（出力違いなど）に対応するため
  // Map<string, RuleEntry[]> で保持する。equals で一致するエントリは sources を union して重複を回避。
  const groups = new Map<string, RuleEntry[]>();
  for (const e of entries) {
    addOrMergeEntry(groups, e);
  }

  while (true) {
    const conflict = findPrefixConflict(groups);
    if (!conflict) break;

    const { hash, takenStrokes } = conflict;
    const conflictEntries = groups.get(hash) ?? [];
    // このハッシュに属する全エントリを削除
    groups.delete(hash);

    // 結合先候補 (全 allEntries から、取られたストロークで始まらないもの)
    const availableEntries = allEntries.filter((e) => !takenStrokes.has(strokeHash(e.input[0])));

    // 各競合エントリ × 各結合先で新エントリを生成
    for (const entry of conflictEntries) {
      for (const avail of availableEntries) {
        let newEntry: RuleEntry;
        if (avail.input.length === 1) {
          // 1ストロークの結合先: output を結合する
          const newInput = [...entry.input, ...avail.input];
          newEntry = new RuleEntry(
            newInput,
            entry.output + avail.output,
            avail.nextInput,
            true,
            unionSources(entry.sources, avail.sources),
          );
        } else {
          // 複数ストロークの結合先: 先頭1ストロークだけ取り、nextInput として戻す
          const newInput = [...entry.input, avail.input[0]];
          newEntry = new RuleEntry(
            newInput,
            entry.output,
            [avail.input[0]],
            true,
            unionSources(entry.sources, avail.sources),
          );
        }
        addOrMergeEntry(groups, newEntry);
      }
    }
  }

  const result: RuleEntry[] = [];
  for (const group of groups.values()) result.push(...group);
  return result;
}
