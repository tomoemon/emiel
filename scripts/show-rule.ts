// JSON Rule の内容を JIS106 物理配列上に描画する目視確認ツール。
import { readFileSync } from "node:fs";
import { shortLabel, skipKeys } from "./_lib/keyGrid";
import { renderMdKeyGrid } from "./_lib/markdownGrid";

const DEFAULT_PHYSICAL_LAYOUT = "src/assets/physical_keyboard_layouts/jis_106.json";

type Stroke = { keys: string[]; modifiers?: string[][] };
type EntryWithInput = {
  input: Stroke[];
  output: string;
  nextInput?: Stroke[];
};
type Entry = EntryWithInput | { comment: string };
type RuleJson = {
  metadata?: { name?: string; url?: string };
  entries: Entry[];
};

type PhysicalLayoutJson = {
  keys: string[][];
};

type Classification = {
  state: string;
  primary: string | null; // キーボード図に置くキー（null なら unmapped）
  output: string;
  input: Stroke[];
};

function formatStroke(stroke: Stroke): string {
  const keyLabel = (k: string) => shortLabel[k] ?? k;
  const keys = stroke.keys.map(keyLabel);
  if (stroke.modifiers && stroke.modifiers.length > 0) {
    const mods = stroke.modifiers
      .map((g) => g.map(keyLabel).join("|"))
      .join(",");
    return `{${keys.join(",")}/${mods}}`;
  }
  if (keys.length >= 2) return `{${keys.join(",")}}`;
  return keys[0];
}

function formatInput(input: Stroke[]): string {
  return input.map(formatStroke).join(" → ");
}

type Args = {
  rulePath: string;
  physicalPath: string;
  format: "text" | "md";
  stateFilter?: string;
  limit?: number;
};

function parseArgs(argv: string[]): Args {
  let physicalPath = DEFAULT_PHYSICAL_LAYOUT;
  let format: "text" | "md" = "text";
  let stateFilter: string | undefined;
  let limit: number | undefined;
  const positional: string[] = [];
  for (const arg of argv) {
    if (arg.startsWith("--physical=")) physicalPath = arg.slice("--physical=".length);
    else if (arg.startsWith("--format=")) {
      const v = arg.slice("--format=".length);
      if (v !== "text" && v !== "md") throw new Error(`invalid --format: ${v}`);
      format = v;
    } else if (arg.startsWith("--state=")) stateFilter = arg.slice("--state=".length);
    else if (arg.startsWith("--limit=")) limit = Number(arg.slice("--limit=".length));
    else positional.push(arg);
  }
  if (positional.length === 0) {
    throw new Error(
      "usage: show-rule.ts <rule.json> [--physical=<path>] [--format=text|md] [--state=<state>] [--limit=N]",
    );
  }
  return { rulePath: positional[0], physicalPath, format, stateFilter, limit };
}

function strokeToLabel(stroke: Stroke): string {
  const keys = [...stroke.keys].sort().join("+");
  const mods =
    stroke.modifiers && stroke.modifiers.length > 0
      ? "[" + stroke.modifiers.map((g) => g.join("|")).join(",") + "]"
      : "";
  return keys + mods;
}

function classify(entry: EntryWithInput, gridKeys: Set<string>): Classification {
  const lastStroke = entry.input[entry.input.length - 1];
  const prefixStrokes = entry.input.slice(0, -1);

  // primary キー決定
  let primary: string | null = null;
  let partnerKeys: string[] = [];
  if (lastStroke.keys.length === 1) {
    primary = lastStroke.keys[0];
  } else {
    // keys.length >= 2 → grid に含まれる方を primary、他を partner に
    const inGrid = lastStroke.keys.filter((k) => gridKeys.has(k));
    const outGrid = lastStroke.keys.filter((k) => !gridKeys.has(k));
    if (outGrid.length > 0 && inGrid.length > 0) {
      // grid 外（LangLeft など）が partner
      primary = inGrid[0];
      partnerKeys = outGrid;
    } else if (inGrid.length >= 2) {
      // 両方 grid → 辞書順で後ろを partner
      const sorted = [...lastStroke.keys].sort();
      primary = sorted[0];
      partnerKeys = sorted.slice(1);
    } else {
      primary = null;
      partnerKeys = lastStroke.keys;
    }
  }

  // state 名
  let state = "base";
  const parts: string[] = [];
  if (prefixStrokes.length > 0) {
    parts.push("seq:" + prefixStrokes.map(strokeToLabel).join("→"));
  }
  if (partnerKeys.length > 0) {
    parts.push("simul:" + [...partnerKeys].sort().join("+"));
  }
  if (lastStroke.modifiers && lastStroke.modifiers.length > 0) {
    parts.push(
      "mod:" + lastStroke.modifiers.map((g) => g.join("|")).join(","),
    );
  }
  if (parts.length > 0) state = parts.join(" / ");

  if (!primary || !gridKeys.has(primary)) primary = null;
  return { state, primary, output: entry.output, input: entry.input };
}

type StateBucket = {
  name: string;
  entries: Classification[];
  keyMap: Map<string, string>; // primary key → output
};

function bucketize(
  entries: Entry[],
  gridKeys: Set<string>,
): { buckets: Map<string, StateBucket>; unmapped: Classification[] } {
  const buckets = new Map<string, StateBucket>();
  const unmapped: Classification[] = [];
  for (const e of entries) {
    if (!("input" in e)) continue;
    const c = classify(e, gridKeys);
    if (!c.primary) {
      unmapped.push(c);
      continue;
    }
    let bucket = buckets.get(c.state);
    if (!bucket) {
      bucket = { name: c.state, entries: [], keyMap: new Map() };
      buckets.set(c.state, bucket);
    }
    bucket.entries.push(c);
    // 衝突時は後勝ちだが、複数ある場合は "/" で連結して気付けるようにする
    const existing = bucket.keyMap.get(c.primary);
    bucket.keyMap.set(
      c.primary,
      existing && existing !== c.output ? `${existing}/${c.output}` : c.output,
    );
  }
  return { buckets, unmapped };
}

function renderText(
  bucket: StateBucket,
  rows: string[][],
): string[] {
  const lines: string[] = [];
  lines.push(`[${bucket.name}] ${bucket.entries.length} entries`);
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const indent = " ".repeat(rowIdx);
    const chars = rows[rowIdx]
      .filter((k) => !skipKeys.has(k))
      .map((k) => bucket.keyMap.get(k) ?? ".");
    lines.push(indent + chars.join(" "));
  }
  return lines;
}

function renderMd(
  bucket: StateBucket,
  rows: string[][],
): string[] {
  const lines: string[] = [];
  lines.push(`### [${bucket.name}] ${bucket.entries.length} entries`);
  lines.push("");
  lines.push(...renderMdKeyGrid(rows, (k) => bucket.keyMap.get(k) ?? ""));
  lines.push("");
  return lines;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const rule: RuleJson = JSON.parse(readFileSync(args.rulePath, "utf-8"));
  const physical: PhysicalLayoutJson = JSON.parse(readFileSync(args.physicalPath, "utf-8"));
  const rows = physical.keys.slice(0, 4);
  const gridKeys = new Set(rows.flat().filter((k) => !skipKeys.has(k)));

  const { buckets, unmapped } = bucketize(rule.entries, gridKeys);

  // 表示順: base → simul → seq → mod → その他
  const order = (name: string) =>
    name === "base"
      ? 0
      : name.startsWith("simul:")
        ? 1
        : name.startsWith("seq:")
          ? 2
          : name.startsWith("mod:")
            ? 3
            : 4;
  let sorted = [...buckets.values()].sort((a, b) => {
    const d = order(a.name) - order(b.name);
    return d !== 0 ? d : a.name.localeCompare(b.name);
  });
  if (args.stateFilter) sorted = sorted.filter((b) => b.name === args.stateFilter);
  if (args.limit !== undefined) sorted = sorted.slice(0, args.limit);

  // エントリが 2 件以下のバケツはキーボード図が疎になるので、末尾に
  // [misc] として一覧表で集約出力する
  const SMALL_THRESHOLD = 2;
  const large = sorted.filter((b) => b.entries.length > SMALL_THRESHOLD);
  const small = sorted.filter((b) => b.entries.length <= SMALL_THRESHOLD);

  const header = `${rule.metadata?.name ?? ""} (${args.rulePath})`.trim();
  console.log(header);
  console.log("=".repeat(Math.max(1, header.length)));
  console.log();

  for (const bucket of large) {
    const lines =
      args.format === "md" ? renderMd(bucket, rows) : renderText(bucket, rows);
    for (const line of lines) console.log(line);
    console.log();
  }

  const miscEntries = small.flatMap((b) => b.entries);
  if (miscEntries.length > 0) {
    const title = `[misc] ${miscEntries.length} entries (${small.length} small buckets)`;
    if (args.format === "md") {
      console.log(`### ${title}`);
      console.log();
      console.log("| state | input | output |");
      console.log("|---|---|---|");
      for (const e of miscEntries) {
        const input = formatInput(e.input).replace(/\|/g, "\\|");
        const output = e.output.replace(/\|/g, "\\|");
        console.log(`| ${e.state} | ${input} | ${output} |`);
      }
      console.log();
    } else {
      console.log(title);
      for (const e of miscEntries) {
        console.log(`  ${e.state}  ${formatInput(e.input)} → ${e.output}`);
      }
      console.log();
    }
  }

  if (unmapped.length > 0 && !args.stateFilter) {
    console.log(`[unmapped] ${unmapped.length} entries`);
    for (const u of unmapped.slice(0, 20)) {
      console.log(`  ${u.state} → ${u.output}`);
    }
    if (unmapped.length > 20) console.log(`  ... and ${unmapped.length - 20} more`);
    console.log();
  }

  const summaryParts = [...buckets.values()]
    .sort((a, b) => order(a.name) - order(b.name))
    .map((b) => `${b.name}:${b.entries.length}`);
  const total = [...buckets.values()].reduce((s, b) => s + b.entries.length, 0) + unmapped.length;
  console.log(
    `total: ${total} / ${summaryParts.join(" / ")}${unmapped.length > 0 ? ` / unmapped:${unmapped.length}` : ""}`,
  );
}

main();
