import { prettyPrint } from "@base2/pretty-print-object";
import { Rule, RuleEntry } from "./rule";
import { RuleStroke } from "./ruleStroke";

/**
 * validation 時にのみ使う関数はメソッドとしてではなく、ここの中に記述する
 */

export function validateRule(rule: Rule): void {
  const outputHashMap = new Map<string, RuleEntry[]>();
  rule.entries.forEach((entry) => {
    if (outputHashMap.has(entry.output)) {
      const entries = outputHashMap.get(entry.output) as RuleEntry[];
      entries.forEach((v) => {
        for (let i = 0; i < v.input.length && i < entry.input.length; i++) {
          const result = compareStroke(v.input[i], entry.input[i]);
          if (!result.key || !result.requiredModifier) {
            // 必要なキーが異なる場合はそもそも StrokeNode として区別可能なので問題ない
            break;
          }
          if (!result.unnecessaryModifiers) {
            throw new Error(
              `Rule ${rule.name} has duplicated input entry: ${prettyPrint(
                entry
              )} and ${prettyPrint(v)}`
            );
          }
        }
      });
      entries.push(entry);
    } else {
      outputHashMap.set(entry.output, [entry]);
    }
  });
}

/**
 * keys と requiredModifiers は一致しているが unnecesaryModifiers が一致していないときに true を返す
 */
function compareStroke(
  thisStroke: RuleStroke,
  other: RuleStroke
): { key: boolean; requiredModifier: boolean; unnecessaryModifiers: boolean } {
  const keysResult = thisStroke.key === other.key;

  const requiredModifierResult = thisStroke.requiredModifier.equals(
    other.requiredModifier
  );
  const thisMods = thisStroke.unnecessaryModifiers.flatMap((v) => v.modifiers);
  const otherMods = other.unnecessaryModifiers.flatMap((v) => v.modifiers);
  const unnecesaryModifiersResult =
    thisMods.length === otherMods.length &&
    thisMods.every((v) => otherMods.some((v2) => v === v2));
  return {
    key: keysResult,
    requiredModifier: requiredModifierResult,
    unnecessaryModifiers: unnecesaryModifiersResult,
  };
}
