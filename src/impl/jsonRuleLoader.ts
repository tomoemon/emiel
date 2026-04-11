import * as v from "valibot";
import { KeyboardGuide } from "../core/keyboardGuide";
import { AndModifier, ModifierGroup } from "../core/modifier";
import { Rule, RuleEntry } from "../core/rule";
import { ModifierStroke, type RuleStroke, SimultaneousStroke } from "../core/ruleStroke";
import { virtualKeySchema } from "../core/virtualKey";
import { defaultKanaNormalize } from "./charNormalizer";
import { jsonKeyboardGuideEntriesSchema } from "./keyboardGuideLoader";

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
  // Rule.backspaceStrokes に渡す「backspace として扱うキーストローク」の定義。
  // 現在のノードに関係なく常に受理され、一致すると Automaton.input() が
  // InputResult.BACK を返す。例: naginata 式の U 単独打鍵
  backspaces: v.optional(v.array(strokeSchema)),
  // この入力方式に対応する KeyboardGuide 定義 (オプショナル)。
  guide: v.optional(
    v.object({
      entries: jsonKeyboardGuideEntriesSchema,
    }),
  ),
});

export type JsonRuleSchema = v.InferOutput<typeof jsonRuleSchema>;
type Stroke = v.InferOutput<typeof strokeSchema>;

/**
 * 1つの JSON ストロークを RuleStroke に変換する。
 *
 * - keys が 1 個: ModifierStroke を生成 (modifiers は AndModifier として事前押下必須のキー)
 * - keys が 2 個以上: SimultaneousStroke を生成 (順不同の同時押し)。
 *   modifiers がある場合は SimultaneousStroke の requiredModifier として扱う
 *   (例: naginata の「A+J 同時押し + Space 先押し」)
 */
function loadStroke(jsonStroke: Stroke): RuleStroke {
  const keys = jsonStroke.keys;
  const modifierGroups: ModifierGroup[] =
    jsonStroke.modifiers?.map((modifierKeys) => new ModifierGroup(modifierKeys)) || [];
  const modifier = new AndModifier(...modifierGroups);
  if (keys.length >= 2) {
    return new SimultaneousStroke(keys, modifier);
  }
  return new ModifierStroke(keys[0], modifier);
}

/**
 * input の配列を読み込み、RuleStroke の配列を返す。
 * 各 JSON ストロークは単一の RuleStroke にマップされるため、展開は不要。
 *
 * eg. 単打の連続
 *    input: [{keys: ["A"]},{keys: ["B"]}]
 *    output: [ModifierStroke(A), ModifierStroke(B)]
 * eg. 同時押し (2 キー以上)
 *    input: [{keys: ["A","B"]}]
 *    output: [SimultaneousStroke([A, B])]
 * eg. 修飾キー付き単打
 *    input: [{keys: ["A"], modifiers: [["ShiftLeft", "ShiftRight"]]}]
 *    output: [ModifierStroke(A, shift)]
 */
function loadInput(input: Stroke[]): RuleStroke[] {
  return input.map((v) => loadStroke(v));
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
    const input = loadInput(v.input);
    const output = v.output;
    const nextInput = v.nextInput ? loadInput(v.nextInput) : [];
    entries.push(
      new RuleEntry(
        input,
        output,
        nextInput,
        v.extendCommonPrefixEntry ?? jsonExtendablePrefixCommon ?? false,
      ),
    );
  });
  return entries;
}

export function loadJsonRule(jsonRule: unknown, name?: string, next?: Rule): Rule {
  if (typeof jsonRule === "string") {
    return loadJsonRule(JSON.parse(jsonRule), name, next);
  }
  const validated = v.parse(jsonRuleSchema, jsonRule);
  const entries = loadEntries(validated.entries, validated.extendCommonPrefixEntry ?? false);
  // JSON に backspaces フィールドが無い場合は undefined を渡して Rule 側のデフォルト
  // (VirtualKeys.Backspace 単独打鍵) を適用する。空配列を指定した場合は backspace 無効
  const backspaceStrokes: RuleStroke[] | undefined = validated.backspaces?.map((s) =>
    loadStroke(s),
  );
  const guide = validated.guide
    ? new KeyboardGuide({ entries: validated.guide.entries })
    : undefined;
  return new Rule(entries, defaultKanaNormalize, name, backspaceStrokes, guide, next);
}
