import {
  InputEvent,
  InputStroke,
  KeyboardState,
  build,
  loadPresetKeyboardLayoutQwertyJis,
  loadPresetKeyboardLayoutQwertyUs,
  loadPresetRuleRoman,
} from "emiel";
import readline from "node:readline";

const LAYOUTS = {
  jis: loadPresetKeyboardLayoutQwertyJis,
  us: loadPresetKeyboardLayoutQwertyUs,
};

const WORDS = ["かった", "たのしい", "ぷろぐらみんぐ", "にほんご", "たいぴんぐ"];

type LayoutName = keyof typeof LAYOUTS;

function parseArgs(argv: string[]) {
  let layoutName: string = "jis";
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--layout" && i + 1 < argv.length) {
      layoutName = argv[i + 1];
      i++;
    } else if (argv[i].startsWith("--layout=")) {
      layoutName = argv[i].slice("--layout=".length);
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      console.log(
        `Usage: node index.js [--layout <name>]\n  layouts: ${Object.keys(LAYOUTS).join(", ")}`,
      );
      process.exit(0);
    }
  }
  return { layoutName };
}

const { layoutName } = parseArgs(process.argv);
const loader = LAYOUTS[layoutName as LayoutName];
if (!loader) {
  console.error(`unknown layout: ${layoutName}`);
  console.error(`available: ${Object.keys(LAYOUTS).join(", ")}`);
  process.exit(1);
}
const layout = loader();
const rule = loadPresetRuleRoman(layout);

function pickWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

let automaton = build(rule, pickWord());
let typedKeys = "";
let lastStatus = "";

function render() {
  const idx = automaton.currentNode.kanaIndex;
  const done = automaton.word.slice(0, idx);
  const rest = automaton.word.slice(idx);
  readline.cursorTo(process.stdout, 0);
  readline.clearScreenDown(process.stdout);
  process.stdout.write(`layout: ${layoutName} (Ctrl+C or Esc to quit)\n`);
  process.stdout.write(`お題: \x1b[32m${done}\x1b[0m\x1b[2m${rest}\x1b[0m\n`);
  process.stdout.write(`入力: ${typedKeys}\n`);
  process.stdout.write(`状態: ${lastStatus}\n`);
  readline.moveCursor(process.stdout, 0, -4);
}

function nextWord() {
  automaton = build(rule, pickWord());
  typedKeys = "";
  lastStatus = "next word!";
}

function handleChar(str: string) {
  if (!layout.hasChar(str)) {
    lastStatus = `ignored: ${JSON.stringify(str)}`;
    return;
  }
  const stroke = layout.getStrokesByChar(str)[0];
  const state = new KeyboardState();
  for (const group of stroke.requiredModifier.groups) {
    if (group.modifiers.length > 0) state.keydown(group.modifiers[0]);
  }
  const ev = new InputEvent(new InputStroke(stroke.key, "keydown"), state, new Date());
  const result = automaton.input(ev);
  typedKeys += str;
  lastStatus = result.toString();
  if (result.isFinished) {
    render();
    process.stdout.write("\n\n\n\n\n");
    nextWord();
    render();
  }
}

function cleanupAndExit() {
  readline.cursorTo(process.stdout, 0);
  readline.moveCursor(process.stdout, 0, 4);
  readline.clearScreenDown(process.stdout);
  process.stdout.write("\x1b[?25h");
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  process.stdin.pause();
  process.exit(0);
}

if (!process.stdin.isTTY) {
  console.error("stdin is not a TTY. Run this from an interactive terminal.");
  process.exit(1);
}

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");
process.stdout.write("\x1b[?25l");

process.stdin.on("keypress", (str: string | undefined, key: { name?: string; ctrl?: boolean }) => {
  if (key && (key.name === "escape" || (key.ctrl && key.name === "c"))) {
    cleanupAndExit();
    return;
  }
  if (typeof str !== "string" || str.length === 0) return;
  if (str.charCodeAt(0) < 0x20) return;
  handleChar(str);
  render();
});

render();
