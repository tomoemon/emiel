import type { KeyboardLayout } from "../core/keyboardLayout";
import type { Metadata } from "../core/metadata";
import { emptyMetadata } from "../core/metadata";
import { RuleEntry, RulePrimitive } from "../core/rule";
import type { RuleStroke } from "../core/ruleStroke";
import { product } from "../utils/itertools";

/**
 * mozc (Google 日本語入力 OSS) 互換のローマ字テーブル形式テキストから `RulePrimitive` を生成する。
 *
 * 各行は `<入力>\t<出力>\t<次の入力>` のタブ区切り。3 列目 (次の入力) は省略可。
 * 入力文字はキーボードレイアウトを介して打鍵列に展開されるので、配列が異なると打鍵列も変わる。
 */
export function loadMozcRule(
  text: string,
  layout: KeyboardLayout,
  metadata: Metadata = emptyMetadata(),
): RulePrimitive {
  /*
    a	あ
    ta	た
    tt	っ	t
    */
  text = text.replace(/\r\n/g, "\n");
  text = text.replace(/\r/g, "\n");
  const lines = text.split("\n");
  const entries: RuleEntry[] = [];
  for (let line of lines) {
    line = line.trim();
    if (line.length === 0) {
      continue;
    }
    const cols = line.split("\t");
    if (cols.length < 2) {
      continue;
    }
    if (cols.length < 3) {
      cols.push("");
    }
    // キーボードレイアウトによっては1つの文字を打つために複数のキー候補がありえる
    const inputs: RuleStroke[][] = [...cols[0]].map((c) => toStrokesFromChar(layout, c));
    const output = cols[1];
    const nextInput: RuleStroke[] = [...cols[2]].map((c) => toStrokesFromChar(layout, c)[0]);
    Array.from(product(inputs)).forEach((input) => {
      entries.push(
        new RuleEntry(input, output, nextInput, !Array.from(output).some((v) => layout.hasChar(v))),
      );
    });
  }
  return new RulePrimitive(entries, metadata, undefined);
}

function toStrokesFromChar(layout: KeyboardLayout, key: string): RuleStroke[] {
  const strokes = layout.getStrokesByChar(key);
  if (!strokes) {
    throw new Error("invalid key: " + key);
  }
  return strokes;
}
