import { Comparable, Rule, RuleEntry } from "./rule";
import { RuleStroke } from "./stroke";

/**
 * validation 時にのみ使う関数はメソッドとしてではなく、ここの中に記述する
 */

export function validateRule<T extends Comparable<T>>(rule: Rule<T>): void {
  const outputHashMap = new Map<string, RuleEntry<T>[]>();
  rule.entries.forEach((entry) => {
    if (outputHashMap.has(entry.output)) {
      const entries = outputHashMap.get(entry.output) as RuleEntry<T>[];
      entries.forEach((v) => {
        for (let i = 0; i < v.input.length && i < entry.input.length; i++) {
          const result = compareStroke(v.input[i], entry.input[i]);
          if (!result.keys || !result.requiredModifier) {
            // 必要なキーが異なる場合はそもそも StrokeNode として区別可能なので問題ない
            break;
          }
          if (!result.unnecessaryModifiers) {
            throw new Error(
              `Rule ${rule.name} has duplicated input entry: ${entry} and ${v}`
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
function compareStroke<T extends Comparable<T>>(
  thisStroke: RuleStroke<T>,
  other: RuleStroke<T>
): { keys: boolean; requiredModifier: boolean; unnecessaryModifiers: boolean } {
  const keysResult =
    thisStroke.keys.length === other.keys.length &&
    thisStroke.keys.every((v, i) => v.equals(other.keys[i]));

  const requiredModifierResult = thisStroke.requiredModifier.equals(
    other.requiredModifier
  );
  const thisMods = thisStroke.unnecessaryModifiers.flatMap((v) => v.modifiers);
  const otherMods = other.unnecessaryModifiers.flatMap((v) => v.modifiers);
  const unnecesaryModifiersResult =
    thisMods.length === otherMods.length &&
    thisMods.every((v) => otherMods.some((v2) => v.equals(v2)));
  return {
    keys: keysResult,
    requiredModifier: requiredModifierResult,
    unnecessaryModifiers: unnecesaryModifiersResult,
  };
}
