// 同梱のかな配列ルール × キーボードレイアウトのすべての組み合わせで、
// 対象文字集合 (coreCharset) を打てるかを検査する。
// プリセットの読み込みに vite の ?raw import を使うため、ビルド済みの dist を読み込む。
//   pnpm run check:charset
import * as emiel from "../dist/index.js";

// export 名の接頭辞からプリセットを集めるので、プリセットを追加してもこのスクリプトは変更不要
const presetsOf = <F>(prefix: string): [string, F][] =>
  Object.entries(emiel as unknown as Record<string, unknown>)
    .filter(([name, value]) => name.startsWith(prefix) && typeof value === "function")
    .map(([name, value]) => [name.slice(prefix.length), value as F]);

const ruleLoaders = presetsOf<(layout: emiel.KeyboardLayout) => emiel.Rule>("loadPresetRule");
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
    const missing = emiel.findUntypableChars(rule);
    if (missing.length > 0) {
      report(ruleName, `打てない文字：${missing.join(" ")}`, layoutName);
    }
  }
}

console.log(
  `検査対象：ルール ${ruleLoaders.length} 種 × レイアウト ${layoutLoaders.length} 種、文字 ${emiel.coreCharset.length} 字`,
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
