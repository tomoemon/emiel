import { readFileSync } from "node:fs";
import { skipKeys } from "./_lib/keyGrid";
import { renderMdKeyGrid } from "./_lib/markdownGrid";

const DEFAULT_PHYSICAL_LAYOUT = "src/assets/physical_keyboard_layouts/us_101.json";

type Entry = {
  output: string;
  input: { key: string; shift: boolean };
};

type LayoutJson = {
  metadata?: { name?: string; url?: string };
  entries: Entry[];
};

type PhysicalLayoutJson = {
  keys: string[][];
  leftMargins: number[];
  keyWidth?: Record<string, number>;
};

type Args = {
  physicalPath: string;
  layoutPaths: string[];
  format: "text" | "md";
};

function parseArgs(argv: string[]): Args {
  let physicalPath = DEFAULT_PHYSICAL_LAYOUT;
  let format: "text" | "md" = "text";
  const layoutPaths: string[] = [];
  for (const arg of argv) {
    if (arg === "--") continue;
    if (arg.startsWith("--physical=")) {
      physicalPath = arg.slice("--physical=".length);
    } else if (arg === "--physical") {
      throw new Error("Use --physical=<path> form");
    } else if (arg.startsWith("--format=")) {
      const v = arg.slice("--format=".length);
      if (v !== "text" && v !== "md") throw new Error(`invalid --format: ${v}`);
      format = v;
    } else {
      layoutPaths.push(arg);
    }
  }
  return { physicalPath, layoutPaths, format };
}

function renderText(charMap: Map<string, string>, rows: string[][]): string[] {
  const lines: string[] = [];
  for (const shifted of [false, true]) {
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const indent = " ".repeat(rowIdx);
      const chars: string[] = [];
      for (const key of rows[rowIdx]) {
        if (skipKeys.has(key)) continue;
        const output = charMap.get(`${key}:${shifted}`);
        chars.push(output ?? " ");
      }
      lines.push(indent + chars.join(" "));
    }
    lines.push("");
  }
  return lines;
}

function renderMd(charMap: Map<string, string>, rows: string[][]): string[] {
  const lines: string[] = [];
  for (const shifted of [false, true]) {
    lines.push(`### [${shifted ? "shifted" : "unshifted"}]`);
    lines.push("");
    lines.push(...renderMdKeyGrid(rows, (k) => charMap.get(`${k}:${shifted}`) ?? ""));
    lines.push("");
  }
  return lines;
}

function showLayout(
  layoutPath: string,
  physical: PhysicalLayoutJson,
  format: "text" | "md",
): void {
  const json: LayoutJson = JSON.parse(readFileSync(layoutPath, "utf-8"));
  const name = json.metadata?.name ?? "";

  const charMap = new Map<string, string>();
  for (const entry of json.entries) {
    charMap.set(`${entry.input.key}:${entry.input.shift}`, entry.output);
  }

  const header = name ? `${name} (${layoutPath})` : layoutPath;
  console.log(header);
  console.log("=".repeat(Math.max(1, header.length)));
  console.log();

  const rows = physical.keys.slice(0, 4);
  const lines = format === "md" ? renderMd(charMap, rows) : renderText(charMap, rows);
  for (const line of lines) console.log(line);
}

function main() {
  const { physicalPath, layoutPaths, format } = parseArgs(process.argv.slice(2));
  if (layoutPaths.length === 0) {
    console.error(
      "Usage: pnpm run show-layout [--physical=<path>] [--format=text|md] <keyboard-layout.json>...",
    );
    process.exit(1);
  }

  const physical: PhysicalLayoutJson = JSON.parse(readFileSync(physicalPath, "utf-8"));

  for (let i = 0; i < layoutPaths.length; i++) {
    if (i > 0) console.log();
    showLayout(layoutPaths[i], physical, format);
  }
}

main();
