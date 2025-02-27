import { Rule, RuleEntry } from "./rule";

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
  const newRule = new Rule(
    thisRule.name,
    [...thisRule.entries, ...toBeAddedEntries],
    (v: string) => other.normalize(thisRule.normalize(v))
  );
  return newRule;
}
