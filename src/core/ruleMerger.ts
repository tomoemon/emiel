import { Rule, RuleEntry } from "./rule";
import { validateRule } from "./ruleValidator";

// entires と modifierGroups を結合した新しい Rule を返す
export function mergeRule(
  thisRule: Rule,
  other: Rule
): Rule {
  const thisEntryHashMap = new Map<string, RuleEntry[]>();
  thisRule.entries.forEach((entry) => {
    if (thisEntryHashMap.has(entry.output)) {
      (thisEntryHashMap.get(entry.output) as RuleEntry[]).push(entry);
    } else {
      thisEntryHashMap.set(entry.output, [entry]);
    }
  });
  const toBeAddedEntries = other.entries.filter((entry) => {
    if (thisEntryHashMap.has(entry.output)) {
      // 同じ output を持ち、かつ equals になる entry がすでにあるならマージ対象にしない
      const entries = thisEntryHashMap.get(entry.output) as RuleEntry[];
      return !entries.some((v) => v.equals(entry));
    } else {
      // 同じ output を持つ entry が存在しない場合はマージ対象にする
      return true;
    }
  });
  // すでに存在する Modifier 以外をマージする
  const newModifiers = [
    ...thisRule.modifierGroups,
    ...other.modifierGroups.filter(
      (v) => !thisRule.modifierGroups.some((w) => w.equals(v))
    ),
  ];
  const newRule = new Rule(
    thisRule.name,
    [...thisRule.entries, ...toBeAddedEntries],
    newModifiers,
    (v: string) => other.normalize(thisRule.normalize(v))
  );
  validateRule(newRule);
  return newRule;
}
