import { RuleEntry } from "./rule";
import type { RuleStroke } from "./ruleStroke";

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
  const unextendable = entries.filter((e) => !e.extendCommonPrefixCommonEntry);
  const extendable = entries.filter((e) => e.extendCommonPrefixCommonEntry);
  return [...unextendable, ...resolvePrefixConflicts(extendable)];
}

function strokeHash(...strokes: RuleStroke[]): string {
  return strokes
    .map((s) => {
      if (s.kind === "modifier") {
        return `m:${s.key.toString()}/${s.requiredModifier.toString()}`;
      }
      // simultaneous: 順不同なのでキーをソートしてハッシュ化
      return `s:${[...s.keys]
        .map((k) => k.toString())
        .sort()
        .join("+")}`;
    })
    .join("-");
}

// Map 内で最初に見つかったプレフィックス競合を返す。
// takenStrokes: 競合エントリの次の位置で使われているストロークと自身の先頭ストロークの集合。
// これらのストロークで始まるエントリは結合先にできない。
function findPrefixConflict(entryMap: Map<string, RuleEntry>): {
  entry: RuleEntry;
  hash: string;
  takenStrokes: Set<string>;
} | null {
  for (const [hash, entry] of entryMap) {
    const takenStrokes = new Set<string>();
    let hasConflict = false;
    for (const other of entryMap.values()) {
      if (other.input.length <= entry.input.length) continue;
      if (strokeHash(...other.input.slice(0, entry.input.length)) === hash) {
        takenStrokes.add(strokeHash(other.input[entry.input.length]));
        hasConflict = true;
      }
    }
    if (hasConflict) {
      takenStrokes.add(strokeHash(entry.input[0]));
      return { entry, hash, takenStrokes };
    }
  }
  return null;
}

function resolvePrefixConflicts(entries: RuleEntry[]): RuleEntry[] {
  const entryMap = new Map<string, RuleEntry>();
  for (const e of entries) {
    entryMap.set(strokeHash(...e.input), e);
  }

  while (true) {
    const conflict = findPrefixConflict(entryMap);
    if (!conflict) break;

    const { entry, hash, takenStrokes } = conflict;

    // 取られたストロークで始まらないエントリを結合先として集める
    const availableEntries = [...entryMap.values()].filter(
      (e) => !takenStrokes.has(strokeHash(e.input[0])),
    );

    // 競合エントリを削除し、結合先ごとに拡張エントリを生成
    entryMap.delete(hash);

    for (const avail of availableEntries) {
      if (avail.input.length === 1) {
        // 1ストロークの結合先: output を結合する
        const newInput = [...entry.input, ...avail.input];
        entryMap.set(
          strokeHash(...newInput),
          new RuleEntry(newInput, entry.output + avail.output, avail.nextInput, true),
        );
      } else {
        // 複数ストロークの結合先: 先頭1ストロークだけ取り、nextInput として戻す
        const newInput = [...entry.input, avail.input[0]];
        entryMap.set(
          strokeHash(...newInput),
          new RuleEntry(newInput, entry.output, [avail.input[0]], true),
        );
      }
    }
  }

  return [...entryMap.values()];
}
