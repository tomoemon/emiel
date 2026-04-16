import { shortLabel, skipKeys } from "./keyGrid";

// 1 グリッド分の Markdown テーブルを生成する。
// 先頭に空ヘッダ + セパレータを置き、各行は「太字のキー名 → 出力」の
// 2 行組で並べる。pipe は自動でエスケープする。
export function renderMdKeyGrid(
  rows: readonly (readonly string[])[],
  outputOf: (key: string) => string,
): string[] {
  const filtered = rows.map((r) => r.filter((k) => !skipKeys.has(k)));
  const maxCols = Math.max(0, ...filtered.map((r) => r.length));
  if (maxCols === 0) return [];

  const lines: string[] = [];
  const pad = (cells: string[]): string[] => {
    const copy = [...cells];
    while (copy.length < maxCols) copy.push(" ");
    return copy;
  };
  const escape = (s: string) => s.replace(/\|/g, "\\|");

  lines.push("| " + Array(maxCols).fill(" ").join(" | ") + " |");
  lines.push("|" + Array(maxCols).fill("---").join("|") + "|");
  for (const row of filtered) {
    const labels = row.map((k) => `**${escape(shortLabel[k] ?? k)}**`);
    const outputs = row.map((k) => {
      const out = outputOf(k);
      return out === "" ? " " : escape(out);
    });
    lines.push("| " + pad(labels).join(" | ") + " |");
    lines.push("| " + pad(outputs).join(" | ") + " |");
  }
  return lines;
}
