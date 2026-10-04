// 対象文字集合（docs/input-system-model.md「対象文字集合」）の各文字を、
// 同梱のかな配列ルール × 同梱のキーボードレイアウトのすべての組み合わせで build できるか検査する。
// プリセットの読み込みに vite の ?raw import を使うため、ビルド済みの dist を読み込む。
//   pnpm run check:charset
import * as emiel from "../dist/index.js";

const KANA =
  "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん" +
  "がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ" +
  "ぁぃぅぇぉゃゅょっ";
const DIGITS = "0123456789";
const ALPHABETS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SYMBOLS = "ー、。!?「」";
const CORE_CHARS = [...(KANA + DIGITS + ALPHABETS + SYMBOLS)];

type Loader = (layout: emiel.KeyboardLayout) => emiel.Rule;

const exports = emiel as unknown as Record<string, unknown>;
const presetsOf = <T>(prefix: string): [string, T][] =>
  Object.entries(exports)
    .filter(([name, value]) => name.startsWith(prefix) && typeof value === "function")
    .map(([name, value]) => [name.slice(prefix.length), value as T]);

const ruleLoaders = presetsOf<Loader>("loadPresetRule");
const layoutLoaders = presetsOf<() => emiel.KeyboardLayout>("loadPresetKeyboardLayout");

// 結果は「ルール → 問題の内容 → 該当レイアウト」の形でまとめる
const problems = new Map<string, Map<string, string[]>>();
const report = (rule: string, problem: string, layout: string) => {
  const byProblem = problems.get(rule) ?? new Map<string, string[]>();
  byProblem.set(problem, [...(byProblem.get(problem) ?? []), layout]);
  problems.set(rule, byProblem);
};

for (const [layoutName, loadLayout] of layoutLoaders) {
  const layout = loadLayout();
  for (const [ruleName, loadRule] of ruleLoaders) {
    let rule: emiel.Rule;
    try {
      rule = loadRule(layout).merge(emiel.createDirectInputRule(layout));
    } catch (e) {
      report(ruleName, `ルールを読み込めない（${(e as Error).message}）`, layoutName);
      continue;
    }
    // 出力が空のエントリがあると build が停止しないため、build する前に検出する
    const emptyOutputs = rule.entries.filter((e) => e.output === "").length;
    if (emptyOutputs > 0) {
      report(ruleName, `出力が空のエントリが ${emptyOutputs} 件ある`, layoutName);
      continue;
    }
    const missing = CORE_CHARS.filter((c) => {
      try {
        emiel.build(rule, c);
        return false;
      } catch {
        return true;
      }
    });
    if (missing.length > 0) {
      report(ruleName, `打てない文字：${missing.join(" ")}`, layoutName);
    }
  }
}

console.log(
  `検査対象：ルール ${ruleLoaders.length} 種 × レイアウト ${layoutLoaders.length} 種、文字 ${CORE_CHARS.length} 字`,
);
if (problems.size === 0) {
  console.log("すべての組み合わせで対象文字集合を打てる");
  process.exit(0);
}
for (const [rule, byProblem] of problems) {
  console.log(`\n${rule}`);
  for (const [problem, layouts] of byProblem) {
    console.log(`  ${problem}`);
    console.log(`    レイアウト：${layouts.join(", ")}`);
  }
}
process.exit(1);
