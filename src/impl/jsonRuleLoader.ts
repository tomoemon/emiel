import * as v from "valibot";
import { AndModifier, ModifierGroup } from "../core/modifier";
import { Rule, RuleEntry } from "../core/rule";
import { RuleStroke } from "../core/ruleStroke";
import { virtualKeySchema } from "../core/virtualKey";
import { product } from "../utils/itertools";
import { defaultKanaNormalize } from "./charNormalizer";

const strokeSchema = v.object({
  // 同時に押すキー（1つ以上）
  keys: v.pipe(v.array(virtualKeySchema), v.minLength(1)),
  // 修飾キーのグループ（各グループ内のいずれか1つが押されていればよい）
  modifiers: v.optional(v.array(v.array(virtualKeySchema))),
});

const entryWithInputSchema = v.object({
  // 打鍵列
  input: v.array(strokeSchema),
  // 入力結果として出力されるかな文字列
  output: v.string(),
  // 次の入力の先頭として扱う打鍵列
  nextInput: v.optional(v.array(strokeSchema)),
  // 共通プレフィックスを持つエントリを自動拡張するか
  extendCommonPrefixEntry: v.optional(v.boolean()),
  comment: v.optional(v.string()),
});

const commentOnlyEntrySchema = v.object({
  comment: v.string(),
});

const entrySchema = v.union([entryWithInputSchema, commentOnlyEntrySchema]);

export const jsonRuleSchema = v.object({
  // 全エントリに対するデフォルトの共通プレフィックス拡張設定
  extendCommonPrefixEntry: v.optional(v.boolean()),
  entries: v.array(entrySchema),
});

export type JsonRuleSchema = v.InferOutput<typeof jsonRuleSchema>;
export type JsonRuleInput = v.InferInput<typeof jsonRuleSchema>;
type Stroke = v.InferOutput<typeof strokeSchema>;

function loadStroke(jsonStroke: Stroke): RuleStroke[] {
  const keys = jsonStroke.keys;
  const modifierGroups: ModifierGroup[] =
    jsonStroke.modifiers?.map((modifierKeys) => new ModifierGroup(modifierKeys)) || [];
  return keys.map((key) => {
    // 同時押しの場合は、他のキーをモディファイアとして扱う
    // keys: [A,B] の場合、key=A のとき、A+mod(B)
    const multipleStrokeModifier = keys.filter((v) => v !== key).map((v) => new ModifierGroup([v]));
    return new RuleStroke(key, new AndModifier(...modifierGroups, ...multipleStrokeModifier));
  });
}

/**
 * input の配列を読み込み、RuleStroke の配列の配列を返す。
 *
 * eg. 単打の連続の場合は1要素の配列を返す
 *    input: [{keys: ["A"]},{keys: ["B"]}]
 *    output: [[RuleStroke(A),RuleStroke(B)]]
 * eg. 同時打ちの場合は相互にモディファイアとするRuleStrokeを生成し複数要素の配列を返す
 *    input: [{keys: ["A","B"]}]
 *    output: [
 *              [RuleStroke(A+mod(B))],
 *              [RuleStroke(B+mod(A))],
 *            ]
 * eg. 3つ同時打ちの場合は相互にモディファイアとするRuleStrokeを生成し複数要素の配列を返す
 *    input: [{keys: ["A","B","C"]}]
 *    output: [
 *              [RuleStroke(A+mod(B)+mod(C))],
 *              [RuleStroke(B+mod(A)+mod(C))],
 *              [RuleStroke(C+mod(A)+mod(B))],
 *            ]
 * eg. 同時打ちの打鍵列の全組み合わせで相互にモディファイアとするRuleStrokeを生成し複数要素の配列を返す
 *    input: [{keys: ["A","B"]}, {keys: ["C","D"]}]
 *    output: [
 *              [RuleStroke(A+mod(B)),RuleStroke(C+mod(D))],
 *              [RuleStroke(B+mod(A)),RuleStroke(C+mod(D))],
 *              [RuleStroke(A+mod(B)),RuleStroke(D+mod(C))],
 *              [RuleStroke(B+mod(A)),RuleStroke(D+mod(C))],
 *            ]
 */
function loadInput(input: Stroke[]): RuleStroke[][] {
  /**
   * aとbの同時打鍵の後に、cとdの同時打鍵が必要な場合
   * input: [[a,b], [c,d]]
   * strokeGroups: [[a+mod(b),b+mod(a)], [c+mod(d),d+mod(c)]]
   */
  const strokeGroups = input.map((v) => loadStroke(v));
  // strokeGroups の直積を作って返す
  return Array.from(product(strokeGroups));
}

function loadEntries(
  jsonEntries: v.InferOutput<typeof entrySchema>[],
  jsonExtendablePrefixCommon: boolean,
): RuleEntry[] {
  const entries: RuleEntry[] = [];
  jsonEntries.forEach((v) => {
    if (!("input" in v)) {
      return;
    }
    const inputExtended = loadInput(v.input);
    const output = v.output;
    // 次の入力として使用するものは具体化されたもの1つだけなので、配列の先頭を取得する
    const nextInput = v.nextInput ? loadInput(v.nextInput)[0] : [];
    inputExtended.forEach((input) => {
      entries.push(
        new RuleEntry(
          input,
          output,
          nextInput,
          v.extendCommonPrefixEntry ?? jsonExtendablePrefixCommon ?? false,
        ),
      );
    });
  });
  return entries;
}

export function loadJsonRule(jsonRule: JsonRuleInput | string, name?: string): Rule {
  if (typeof jsonRule === "string") {
    return loadJsonRule(JSON.parse(jsonRule), name);
  }
  const validated = v.parse(jsonRuleSchema, jsonRule);
  const entries = loadEntries(validated.entries, validated.extendCommonPrefixEntry ?? false);
  return new Rule(entries, defaultKanaNormalize, name);
}
