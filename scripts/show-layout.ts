import { readFileSync } from "node:fs";

const DEFAULT_PHYSICAL_LAYOUT = "src/assets/physical_keyboard_layouts/us_101.json";

// 表示対象外のキー（修飾キー・機能キー）
const skipKeys = new Set([
  "Backspace",
  "Enter",
  "ShiftLeft",
  "ShiftRight",
  "Space",
  "CapsLock",
  "Tab",
  "LangLeft",
  "LangRight",
]);

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

function parseArgs(argv: string[]): { physicalPath: string; layoutPaths: string[] } {
  let physicalPath = DEFAULT_PHYSICAL_LAYOUT;
  const layoutPaths: string[] = [];
  for (const arg of argv) {
    if (arg.startsWith("--physical=")) {
      physicalPath = arg.slice("--physical=".length);
    } else if (arg === "--physical") {
      // 次の引数を取る形式は未対応。= 区切りのみサポート
      throw new Error("Use --physical=<path> form");
    } else {
      layoutPaths.push(arg);
    }
  }
  return { physicalPath, layoutPaths };
}

function showLayout(layoutPath: string, physical: PhysicalLayoutJson): void {
  const json: LayoutJson = JSON.parse(readFileSync(layoutPath, "utf-8"));
  const name = json.metadata?.name ?? "";

  // key+shift → output のマップを構築
  const charMap = new Map<string, string>();
  for (const entry of json.entries) {
    charMap.set(`${entry.input.key}:${entry.input.shift}`, entry.output);
  }

  const header = name ? `${name} (${layoutPath})` : layoutPath;
  console.log(header);
  console.log("=".repeat(header.length));
  console.log();

  // 表示対象の行（最終行の Space 行などはスキップ）
  const rows = physical.keys.slice(0, 4);

  // unshifted と shifted をそれぞれ表示
  for (const shifted of [false, true]) {
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const indent = " ".repeat(rowIdx);
      const chars: string[] = [];
      for (const key of rows[rowIdx]) {
        if (skipKeys.has(key)) continue;
        const output = charMap.get(`${key}:${shifted}`);
        chars.push(output ?? " ");
      }
      console.log(indent + chars.join(" "));
    }
    console.log();
  }
}

function main() {
  const { physicalPath, layoutPaths } = parseArgs(process.argv.slice(2));
  if (layoutPaths.length === 0) {
    console.error(
      "Usage: pnpm run show-layout [--physical=<path>] <keyboard-layout.json>...",
    );
    process.exit(1);
  }

  const physical: PhysicalLayoutJson = JSON.parse(readFileSync(physicalPath, "utf-8"));

  for (let i = 0; i < layoutPaths.length; i++) {
    if (i > 0) console.log();
    showLayout(layoutPaths[i], physical);
  }
}

main();
