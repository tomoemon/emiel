// DvorakJ 形式の配列定義 (.txt, Shift_JIS) を emiel の JSON Rule に変換。
//
// 使い方:
//   pnpm run convert:dvorakj -- <in.txt> <out.json> \
//     --name 配列名 --version V --url U --author A \
//     [--left-thumb LangLeft] [--right-thumb LangRight]
//
// サポート構文:
//   - 1 行目: 「単打」「同時に打鍵する配列」「順に打鍵する配列」「順にも同時にも打鍵する配列」
//   - /* コメント */ (複数行可)
//   - [ ... ]           ← 単打
//   - -shift[ ... ]     ← Shift 修飾
//   - /* [K] */ -NN[ ]  ← 相方キー K との同時押し (NN は時間窓 ms、無視)
//   - [x][ ... ] / [x],[y][ ... ] ← 前置シフト (x または y)
//   - {BS} {shift} など中括弧記法は無視 (キーボード図には載せない)
//   - -option-input[...] ブロックは読み飛ばす
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
  composeDakuten: boolean;
  keepCompositionRaw: boolean;
};

// 濁点・半濁点合成テーブル
const DAKUTEN_MAP: Record<string, string> = {
  か: "が", き: "ぎ", く: "ぐ", け: "げ", こ: "ご",
  さ: "ざ", し: "じ", す: "ず", せ: "ぜ", そ: "ぞ",
  た: "だ", ち: "ぢ", つ: "づ", て: "で", と: "ど",
  は: "ば", ひ: "び", ふ: "ぶ", へ: "べ", ほ: "ぼ",
  う: "ゔ",
  カ: "ガ", キ: "ギ", ク: "グ", ケ: "ゲ", コ: "ゴ",
  サ: "ザ", シ: "ジ", ス: "ズ", セ: "ゼ", ソ: "ゾ",
  タ: "ダ", チ: "ヂ", ツ: "ヅ", テ: "デ", ト: "ド",
  ハ: "バ", ヒ: "ビ", フ: "ブ", ヘ: "ベ", ホ: "ボ",
  ウ: "ヴ",
};
const HANDAKUTEN_MAP: Record<string, string> = {
  は: "ぱ", ひ: "ぴ", ふ: "ぷ", へ: "ぺ", ほ: "ぽ",
  ハ: "パ", ヒ: "ピ", フ: "プ", ヘ: "ペ", ホ: "ポ",
};
const DAKUTEN_CHARS = new Set(["゛", "\u3099"]);
const HANDAKUTEN_CHARS = new Set(["゜", "\u309a"]);

function parseArgs(argv: string[]): Args {
  const rest: string[] = [];
  const opts: Record<string, string> = {};
  const boolFlags = new Set(["no-compose-dakuten", "drop-composition-raw"]);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") continue;
    if (a.startsWith("--")) {
      const name = a.slice(2);
      if (boolFlags.has(name)) opts[name] = "true";
      else opts[name] = argv[++i];
    } else rest.push(a);
  }
  if (rest.length < 2) {
    throw new Error(
      "usage: dvorakj-to-json-rule.ts <in.txt> <out.json> [--name X --version V --url U --author A --left-thumb K --right-thumb K]",
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
    composeDakuten: opts["no-compose-dakuten"] === undefined,
    keepCompositionRaw: opts["drop-composition-raw"] === undefined,
  };
}

function readSjisFile(path: string): string {
  const buf = readFileSync(path);
  return new TextDecoder("shift_jis").decode(buf);
}

// コメント /* ... */ を除去し、行ごとに正規化した文字列を返す。
// ただし /* [X] */ 形式の単文字大括弧コメントは相方キー宣言として特別扱いし、
// 本文に残す。
function stripComments(text: string): string {
  // 「/* [X] */」形式は相方キー宣言なのでマーカーに置換
  let out = text.replace(/\/\*\s*\[([A-Za-z])\]\s*\*\//g, (_m, k) => `__PARTNER(${k})__`);
  // 残りのコメントを全消去 (/* ... */ 任意長、改行またぎも可)
  out = out.replace(/\/\*[\s\S]*?\*\//g, "");
  return out;
}

type GridBlock = {
  // モディファイア種別
  kind: "base" | "shift" | "simul" | "prefix";
  // simul の相方キー (VirtualKey)
  partner?: string;
  // prefix 用の前置キー列 (VirtualKey 配列 / OR 結合)
  prefixKeys?: string[];
  // 4 段の各行のセル配列
  rows: string[][];
};

function parseBlocks(text: string): { kind: string; blocks: GridBlock[] } {
  const cleaned = stripComments(text);
  const lines = cleaned.split(/\r?\n/);

  // 種別宣言 (最初の非空・非マーカー行)
  let kindLine = "";
  for (const l of lines) {
    const t = l.trim();
    if (t && !t.startsWith("__PARTNER(")) {
      kindLine = t;
      break;
    }
  }

  // ヘッダー候補:
  //   "["                      (base)
  //   "-shift["                (shift)
  //   "-NN["                   (simul; 直前の /* [X] */ が相方宣言)
  //   "-option-input["         (option-input; 読み飛ばし)
  //   "[x][" / "[x],[y][" …   (prefix; 末尾 "[" までを一括で取り込む)
  const headerRe = /(^|\n)([ \t]*(?:-shift|-\d+|-option-input)?\[(?:[a-zA-Z]\](?:,\[[a-zA-Z]\])*\[)?)/;
  const blocks: GridBlock[] = [];
  let buf = cleaned;
  while (true) {
    const m = buf.match(headerRe);
    if (!m) break;
    const startIdx = (m.index ?? 0) + m[1].length;
    const headerText = m[2];
    const openPos = startIdx + headerText.lastIndexOf("[");
    const closePos = buf.indexOf("]", openPos + 1);
    if (closePos < 0) break;
    const inner = buf.slice(openPos + 1, closePos);

    const htrim = headerText.trim();
    let block: GridBlock | null = null;
    if (htrim === "[") {
      block = { kind: "base", rows: parseRows(inner) };
    } else if (htrim.startsWith("-option-input")) {
      // 読み飛ばす
    } else if (htrim.startsWith("-shift[")) {
      block = { kind: "shift", rows: parseRows(inner) };
    } else if (/^-\d+\[$/.test(htrim)) {
      const lookbehind = buf.slice(0, startIdx);
      const lastP = [...lookbehind.matchAll(/__PARTNER\(([A-Za-z])\)__/g)].pop();
      const partnerLower = lastP?.[1]?.toLowerCase();
      const partner = partnerLower ? PARTNER_KEY_MAP[partnerLower] : undefined;
      if (partner) {
        block = { kind: "simul", partner, rows: parseRows(inner) };
      } else {
        console.warn(`[warn] simul block without /* [X] */ partner declaration; skipped`);
      }
    } else if (/^\[[a-zA-Z\],\[]+\[$/.test(htrim)) {
      const keys: string[] = [];
      for (const k of htrim.matchAll(/\[([a-zA-Z])\]/g)) {
        const v = PARTNER_KEY_MAP[k[1].toLowerCase()];
        if (v) keys.push(v);
      }
      if (keys.length > 0) {
        block = { kind: "prefix", prefixKeys: keys, rows: parseRows(inner) };
      }
    }
    if (block) blocks.push(block);
    buf = buf.slice(closePos + 1);
  }

  return { kind: kindLine, blocks };
}

function parseRows(inner: string): string[][] {
  const rows: string[][] = [];
  for (const line of inner.split(/\r?\n/)) {
    if (!line.includes("|")) continue;
    // 末尾の空要素を除去 (行末 | があるため)
    const cols = line.split("|");
    if (cols.length > 0 && cols[cols.length - 1].trim() === "") cols.pop();
    if (cols.length === 0) continue;
    rows.push(cols.map((c) => c.trim()));
  }
  return rows;
}

// セル文字列から出力かな文字列を得る
function cellToOutput(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  // {BS} {shift} などの特殊キーは無視 (キーボード図に置けないため)
  if (/^\{[^}]+\}/.test(t)) return null;
  // パイプは DvorakJ 内では区切りだけで出力では出現しない
  return t;
}

type JsonStroke = { keys: string[]; modifiers?: string[][] };
type JsonEntry = { input: JsonStroke[]; output: string };

function buildEntries(
  blocks: GridBlock[],
  opts: { composeDakuten: boolean; keepCompositionRaw: boolean },
): {
  entries: JsonEntry[];
  stats: { total: number; skipped: number; composed: number };
} {
  const entries: JsonEntry[] = [];
  const stats = { total: 0, skipped: 0, composed: 0 };
  const skipRawComposition = !opts.keepCompositionRaw;

  const walkGrid = (
    block: GridBlock,
    make: (key: string, out: string) => JsonEntry | null,
  ) => {
    for (let r = 0; r < block.rows.length && r < JIS_POSITIONS.length; r++) {
      const row = block.rows[r];
      for (let c = 0; c < row.length && c < JIS_POSITIONS[r].length; c++) {
        stats.total++;
        const output = cellToOutput(row[c]);
        if (!output) {
          if (row[c].trim() !== "") stats.skipped++;
          continue;
        }
        const key = JIS_POSITIONS[r][c];
        const entry = make(key, output);
        if (entry) entries.push(entry);
      }
    }
  };

  for (const block of blocks) {
    if (block.kind === "base") {
      const dakutenKeys: string[] = [];
      const handakutenKeys: string[] = [];
      const baseCells: { key: string; output: string }[] = [];
      walkGrid(block, (key, output) => {
        baseCells.push({ key, output });
        if (DAKUTEN_CHARS.has(output)) dakutenKeys.push(key);
        else if (HANDAKUTEN_CHARS.has(output)) handakutenKeys.push(key);
        if ((DAKUTEN_CHARS.has(output) || HANDAKUTEN_CHARS.has(output)) && skipRawComposition) {
          return null;
        }
        return { input: [{ keys: [key] }], output };
      });
      if (opts.composeDakuten) {
        for (const { key, output } of baseCells) {
          const dakuten = DAKUTEN_MAP[output];
          if (dakuten) {
            for (const dk of dakutenKeys) {
              if (dk === key) continue;
              entries.push({ input: [{ keys: [key] }, { keys: [dk] }], output: dakuten });
              stats.composed++;
            }
          }
          const handakuten = HANDAKUTEN_MAP[output];
          if (handakuten) {
            for (const hk of handakutenKeys) {
              if (hk === key) continue;
              entries.push({ input: [{ keys: [key] }, { keys: [hk] }], output: handakuten });
              stats.composed++;
            }
          }
        }
      }
    } else if (block.kind === "shift") {
      walkGrid(block, (key, output) => ({
        input: [{ keys: [key], modifiers: [["ShiftLeft", "ShiftRight"]] }],
        output,
      }));
    } else if (block.kind === "simul" && block.partner) {
      walkGrid(block, (key, output) =>
        key === block.partner ? null : { input: [{ keys: [key, block.partner!] }], output },
      );
    } else if (block.kind === "prefix" && block.prefixKeys) {
      for (const prefixKey of block.prefixKeys) {
        walkGrid(block, (key, output) => ({
          input: [{ keys: [prefixKey] }, { keys: [key] }],
          output,
        }));
      }
    }
  }
  return { entries, stats };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const text = readSjisFile(resolve(args.input));
  const { kind, blocks } = parseBlocks(text);
  const { entries, stats } = buildEntries(blocks, {
    composeDakuten: args.composeDakuten,
    keepCompositionRaw: args.keepCompositionRaw,
  });

  const metadata: { name?: string; url?: string } = {};
  const nameParts = [args.name, args.version].filter(Boolean);
  if (nameParts.length > 0) metadata.name = nameParts.join(" ");
  if (args.url) metadata.url = args.url;

  const json: Record<string, unknown> = {};
  if (Object.keys(metadata).length > 0) json.metadata = metadata;
  if (args.author) {
    json.entries = [{ comment: `author: ${args.author}` }, ...entries];
  } else {
    json.entries = entries;
  }

  writeFileSync(resolve(args.output), JSON.stringify(json, null, 2) + "\n", "utf8");

  console.log(`[ok] wrote ${args.output}`);
  console.log(
    `[stats] kind="${kind}" blocks=${blocks.length} entries=${entries.length} scanned=${stats.total} skipped=${stats.skipped} composed=${stats.composed}`,
  );
}

main();
