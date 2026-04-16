// やまぶき R の .yab 配列定義を emiel の JSON Rule 形式へ変換するスクリプト。
//
// yab は「打鍵 → ローマ字 → OS 側 IME でかな化」の 2 段構造なので、ここでは
// google_ime_default_roman.txt を使って事前にローマ字 → かな に展開した上で
// JSON Rule の output に入れる。
//
// 使い方:
//   pnpm run convert:yab -- <in.yab> <out.json> \
//     --name 飛鳥123 --version v17.42 \
//     --url https://... --author ... \
//     [--left-thumb LangLeft] [--right-thumb LangRight] \
//     [--roman-table src/assets/rules/google_ime_default_roman.txt]
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { JIS_POSITIONS, PARTNER_KEY_MAP } from "./_lib/keyGrid";

type Args = {
  input: string;
  output: string;
  name?: string;
  version?: string;
  url?: string;
  author?: string;
  leftThumb: string;
  rightThumb: string;
  romanTable: string;
};

function parseArgs(argv: string[]): Args {
  const rest: string[] = [];
  const opts: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") continue;
    if (a.startsWith("--")) {
      opts[a.slice(2)] = argv[++i];
    } else {
      rest.push(a);
    }
  }
  if (rest.length < 2) {
    throw new Error(
      "usage: yab-to-json-rule.ts <in.yab> <out.json> [--name X --version V --url U --author A --left-thumb K --right-thumb K --roman-table PATH]",
    );
  }
  return {
    input: rest[0],
    output: rest[1],
    name: opts.name,
    version: opts.version,
    url: opts.url,
    author: opts.author,
    leftThumb: opts["left-thumb"] ?? "LangLeft",
    rightThumb: opts["right-thumb"] ?? "LangRight",
    romanTable: opts["roman-table"] ?? "src/assets/rules/google_ime_default_roman.txt",
  };
}

// 全角 ASCII → 半角 ASCII
function toHalfAscii(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (code >= 0xff01 && code <= 0xff5e) {
      out += String.fromCodePoint(code - 0xfee0);
    } else if (code === 0x3000) {
      out += " ";
    } else {
      out += ch;
    }
  }
  return out;
}

type RomanEntry = { output: string; nextInput?: string };

function loadRomanTable(path: string): Map<string, RomanEntry> {
  const text = readFileSync(path, "utf8");
  const map = new Map<string, RomanEntry>();
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    const cols = line.split("\t");
    if (cols.length < 2) continue;
    const input = cols[0];
    const output = cols[1];
    const nextInput = cols[2];
    map.set(input, nextInput ? { output, nextInput } : { output });
  }
  return map;
}

// yab 値 1 セル分を解釈し、出力かな文字列を得る。
// 返り値:
//  - { kind: "empty" }     未割当 (無)
//  - { kind: "output", text } 最終出力が確定 (通常配置)
//  - { kind: "prefix", label } 月系の前置シフトマーカー ("1" や "2")
//  - { kind: "skip", reason } 非対応 (英字のみ等の小指シフト)
type CellResult =
  | { kind: "empty" }
  | { kind: "output"; text: string }
  | { kind: "prefix"; label: string }
  | { kind: "skip"; reason: string };

function parseCell(raw: string, romanTable: Map<string, RomanEntry>): CellResult {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "無") return { kind: "empty" };

  // 'リテラル' 形式
  const literalMatch = trimmed.match(/^'(.*)'$/);
  if (literalMatch) {
    const literal = toHalfAscii(literalMatch[1]);
    return { kind: "output", text: literal };
  }

  // 月系前置シフトマーカーは「半角の 1 / 2」。数字行の "１"(全角) とは区別する
  if (/^[12]$/.test(trimmed)) {
    return { kind: "prefix", label: trimmed };
  }

  const normalized = toHalfAscii(trimmed);

  // 全 ASCII アルファベット列 → ローマ字としてかな化
  if (/^[a-zA-Z]+$/.test(normalized)) {
    const lower = normalized.toLowerCase();
    const entry = romanTable.get(lower);
    if (entry) return { kind: "output", text: entry.output };
    // 小指シフトの Q, W 等はそのまま英字出力されるが、今回のかな入力変換では
    // 対象外とみなしスキップする。
    return { kind: "skip", reason: `unknown romaji: ${lower}` };
  }

  // ASCII 記号 (小指シフト等) はスキップ対象
  if (/^[\x21-\x7e]+$/.test(normalized)) {
    return { kind: "skip", reason: `ascii-only cell: ${normalized}` };
  }

  // 既にかな等、そのまま使える場合
  return { kind: "output", text: normalized };
}

// やまぶき R は UTF-16LE BOM 付きで .yab を保存するが、手書きで用意した
// UTF-8 ファイル (BOM 有無どちらも) も受け付ける。
function readYab(path: string): string {
  const buf = readFileSync(path);
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(buf.subarray(2));
  }
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return new TextDecoder("utf-8").decode(buf.subarray(3));
  }
  return new TextDecoder("utf-8").decode(buf);
}

// 直接かな入力のセクション (飛鳥 [シフト無し] 等) で使う非出力キー。
// ここにヒットしたら skip 扱いにして、かな以外の機能キー位置を除外する。
const FUNCTION_LABELS: ReadonlySet<string> = new Set([
  "入", "消", "逃", "左", "右", "上", "下", "前", "次", "家", "終",
  "BackSpace", "Enter", "Space", "Tab", "Esc",
  "カタカナ/ひらがな", "半角/全角", "変換", "無変換",
]);

// [シフト無し]/[左親指シフト]/[右親指シフト] のようにセルがそのまま
// かな/記号出力となるセクション向けのパーサ。ローマ字変換は行わない。
function parseDirectKanaCell(raw: string): CellResult {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "無") return { kind: "empty" };
  if (FUNCTION_LABELS.has(trimmed)) {
    return { kind: "skip", reason: `function key: ${trimmed}` };
  }
  // 数字・記号行 (全角を半角化すると ASCII) はタイピング対象外とみなしスキップ
  const normalized = toHalfAscii(trimmed);
  if (/^[\x21-\x7e]+$/.test(normalized)) {
    return { kind: "skip", reason: `ascii-only cell: ${normalized}` };
  }
  return { kind: "output", text: trimmed };
}

type Section = {
  header: string; // "[ローマ字シフト無し]" や "<k>" など
  rows: string[][]; // 4 段 × N カラム
};

function parseSections(text: string): Section[] {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/^\ufeff/, ""));
  const sections: Section[] = [];
  let current: Section | null = null;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (line === "") continue;
    if (line.trimStart().startsWith(";")) continue;
    const trimmed = line.trim();
    if (/^\[.*\]$/.test(trimmed) || /^<.+>$/.test(trimmed)) {
      if (current) sections.push(current);
      current = { header: trimmed, rows: [] };
      continue;
    }
    if (!current) continue;
    // カンマ区切りだが 'リテラル' 内のカンマは保持する必要あり
    const cols = splitCells(line);
    current.rows.push(cols);
  }
  if (current) sections.push(current);
  return sections;
}

function splitCells(line: string): string[] {
  const cells: string[] = [];
  let buf = "";
  let inQuote = false;
  for (const ch of line) {
    if (ch === "'") {
      inQuote = !inQuote;
      buf += ch;
    } else if (ch === "," && !inQuote) {
      cells.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  cells.push(buf);
  return cells;
}

type JsonStroke = { keys: string[]; modifiers?: string[][] };
type JsonEntry = { input: JsonStroke[]; output: string; comment?: string };

function buildEntries(
  sections: Section[],
  romanTable: Map<string, RomanEntry>,
  leftThumb: string,
  rightThumb: string,
): {
  entries: JsonEntry[];
  stats: { total: number; skipped: number; missing: string[] };
} {
  const entries: JsonEntry[] = [];
  const stats = { total: 0, skipped: 0, missing: [] as string[] };

  // まず無シフト段から prefix shift マーカー位置を抽出する (月系)
  const base = sections.find((s) => s.header === "[ローマ字シフト無し]");
  const prefixKeyFor: Record<string, string> = {}; // "1" -> VirtualKey
  if (base) {
    for (let r = 0; r < base.rows.length && r < JIS_POSITIONS.length; r++) {
      const row = base.rows[r];
      for (let c = 0; c < row.length && c < JIS_POSITIONS[r].length; c++) {
        const result = parseCell(row[c], romanTable);
        if (result.kind === "prefix") {
          if (!prefixKeyFor[result.label]) {
            prefixKeyFor[result.label] = JIS_POSITIONS[r][c];
          }
        }
      }
    }
  }

  const processGrid = (
    section: Section,
    wrap: (key: string, output: string) => JsonEntry | null,
    parser: (cell: string) => CellResult = (c) => parseCell(c, romanTable),
  ) => {
    for (let r = 0; r < section.rows.length && r < JIS_POSITIONS.length; r++) {
      const row = section.rows[r];
      for (let c = 0; c < row.length && c < JIS_POSITIONS[r].length; c++) {
        const cell = row[c];
        const result = parser(cell);
        stats.total++;
        if (result.kind === "empty" || result.kind === "prefix") continue;
        if (result.kind === "skip") {
          stats.skipped++;
          const trimmed = cell.trim();
          if (trimmed && /[a-zA-Z]/.test(toHalfAscii(trimmed))) {
            stats.missing.push(`${section.header} (${JIS_POSITIONS[r][c]}): ${trimmed}`);
          }
          continue;
        }
        const key = JIS_POSITIONS[r][c];
        const entry = wrap(key, result.text);
        if (entry) entries.push(entry);
      }
    }
  };

  for (const section of sections) {
    const h = section.header;
    if (h === "[ローマ字シフト無し]") {
      processGrid(section, (key, output) => ({ input: [{ keys: [key] }], output }));
    } else if (h === "[ローマ字左親指シフト]") {
      processGrid(section, (key, output) =>
        key === leftThumb ? null : { input: [{ keys: [key, leftThumb] }], output },
      );
    } else if (h === "[ローマ字右親指シフト]") {
      processGrid(section, (key, output) =>
        key === rightThumb ? null : { input: [{ keys: [key, rightThumb] }], output },
      );
    } else if (h === "[ローマ字小指シフト]") {
      // 英字・記号がそのまま並ぶセクション。かな入力対象外なのでスキップ。
      continue;
    } else if (h === "[シフト無し]") {
      processGrid(
        section,
        (key, output) => ({ input: [{ keys: [key] }], output }),
        parseDirectKanaCell,
      );
    } else if (h === "[左親指シフト]") {
      processGrid(
        section,
        (key, output) =>
          key === leftThumb ? null : { input: [{ keys: [key, leftThumb] }], output },
        parseDirectKanaCell,
      );
    } else if (h === "[右親指シフト]") {
      processGrid(
        section,
        (key, output) =>
          key === rightThumb ? null : { input: [{ keys: [key, rightThumb] }], output },
        parseDirectKanaCell,
      );
    } else if (h === "[機能キー]") {
      continue;
    } else {
      // 月系前置シフト: [Nローマ字シフト無し] / [Nローマ字小指シフト]
      const prefixMatch = h.match(/^\[(\d+)ローマ字シフト無し\]$/);
      if (prefixMatch) {
        const label = prefixMatch[1];
        const prefixKey = prefixKeyFor[label];
        if (!prefixKey) {
          console.warn(`[warn] prefix shift key for "${label}" not found; skip ${h}`);
          continue;
        }
        processGrid(section, (key, output) => ({
          input: [{ keys: [prefixKey] }, { keys: [key] }],
          output,
        }));
        continue;
      }
      // 新下駄同時押し <x>
      const partnerMatch = h.match(/^<([a-z])>$/);
      if (partnerMatch) {
        const partnerLower = partnerMatch[1];
        const partnerKey = PARTNER_KEY_MAP[partnerLower];
        if (!partnerKey) {
          console.warn(`[warn] unknown partner key "${partnerLower}"; skip ${h}`);
          continue;
        }
        processGrid(section, (key, output) =>
          key === partnerKey ? null : { input: [{ keys: [key, partnerKey] }], output },
        );
        continue;
      }
      console.warn(`[warn] unsupported section: ${h}`);
    }
  }

  return { entries, stats };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const romanTable = loadRomanTable(resolve(args.romanTable));
  const yabText = readYab(resolve(args.input));
  const sections = parseSections(yabText);
  const { entries, stats } = buildEntries(
    sections,
    romanTable,
    args.leftThumb,
    args.rightThumb,
  );

  const metadata: { name?: string; url?: string } = {};
  const nameParts = [args.name, args.version].filter(Boolean);
  if (nameParts.length > 0) metadata.name = nameParts.join(" ");
  if (args.url) metadata.url = args.url;

  const json: Record<string, unknown> = {};
  if (Object.keys(metadata).length > 0) json.metadata = metadata;
  if (args.author) {
    // metadata schema には author がないため、コメントエントリで残す
    json.entries = [{ comment: `author: ${args.author}` }, ...entries];
  } else {
    json.entries = entries;
  }

  writeFileSync(resolve(args.output), JSON.stringify(json, null, 2) + "\n", "utf8");

  console.log(`[ok] wrote ${args.output}`);
  console.log(
    `[stats] entries=${entries.length} scanned=${stats.total} skipped=${stats.skipped}`,
  );
  if (stats.missing.length > 0) {
    console.log(`[stats] first missing: ${stats.missing.slice(0, 5).join(" | ")}`);
  }
}

main();
