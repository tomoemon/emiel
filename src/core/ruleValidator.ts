import { prettyPrint } from "@base2/pretty-print-object";
import { Rule, RuleEntry } from "./rule";
import { RuleStroke } from "./ruleStroke";

/**
 * validation 時にのみ使う関数はメソッドとしてではなく、ここの中に記述する
 */

/**
 * Rule の中に重複するエントリがないか検証する
 * 同じ Output でかつ不要な修飾キーのみが異なる Input Stroke を持つエントリがある場合にエラーを投げる
 * 完全に同じ Output, Input を持つエントリは許容する（同じ RuleEntry があっても矛盾や不整合は生じないため）
 * @param rule 
 */
export function validateRule(rule: Rule): void {
  const outputHashMap = new Map<string, RuleEntry[]>();
  rule.entries.forEach((entry) => {
    if (outputHashMap.has(entry.output)) {
      // 同じ Output を持つ RuleEntry が存在する場合、Input が同じかどうかを確認する
      const otherEntries = outputHashMap.get(entry.output) as RuleEntry[];
      otherEntries.forEach((otherEntry) => {
        for (let i = 0; i < otherEntry.input.length && i < entry.input.length; i++) {
          const result = compareStroke(otherEntry.input[i], entry.input[i]);
          if (!result.keyEquals || !result.requiredModifierEquals) {
            // 必要なキーや修飾キーが異なる場合はそもそも StrokeNode として区別可能なので問題ない
            break;
          }
          if (!result.unnecessaryModifiersEquals) {
            throw new Error(
              `Rule ${rule.name} has duplicated input entry: ${prettyPrint(
                entry
              )} and ${prettyPrint(otherEntry)}`
            );
          }
        }
      });
      otherEntries.push(entry);
    } else {
      outputHashMap.set(entry.output, [entry]);
    }
  });
}

/**
 * Stroke 内に含まれる各要素について一致するかどうかを返す
 */
function compareStroke(
  thisStroke: RuleStroke,
  other: RuleStroke
): { keyEquals: boolean; requiredModifierEquals: boolean; unnecessaryModifiersEquals: boolean } {
  const keyResult = thisStroke.key === other.key;

  const requiredModifierResult = thisStroke.requiredModifier.equals(
    other.requiredModifier
  );
  return {
    keyEquals: keyResult,
    requiredModifierEquals: requiredModifierResult,
    unnecessaryModifiersEquals: thisStroke.unnecessaryModifiers.equals(other.unnecessaryModifiers),
  };
}
