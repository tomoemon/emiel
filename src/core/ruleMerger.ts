import { Rule, RuleEntry } from "./rule";

// entries を結合した新しい Rule を返す
export function mergeRule(thisRule: Rule, other: Rule, newName: string = ""): Rule {
  const newRule = new Rule(
    mergeEntries(thisRule, other),
    (v: string) => other.normalize(thisRule.normalize(v)),
    newName,
  );
  return newRule;
}

export function mergeEntries(thisRule: Rule, other: Rule): RuleEntry[] {
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
  return [...thisRule.entries, ...toBeAddedEntries];
}
