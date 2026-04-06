import type { RuleEntry } from "./rule";
import { Rule } from "./rule";

// entries を結合した新しい Rule を返す
export function mergeRule(thisRule: Rule, other: Rule, newName: string = ""): Rule {
  // backspaceStrokes は thisRule (メイン側) のものだけを引き継ぐ。
  // alphaNumeric などの補助 Rule が自動マージされる際に、そちらのデフォルト Backspace が
  // 意図せず有効化されるのを防ぐため、other 側の backspaceStrokes は無視する。
  // 補助 Rule 側に独自の backspace を持たせたい場合は、メイン Rule の JSON で
  // 明示的に backspaces を指定すること。
  const newRule = new Rule(
    mergeEntries(thisRule, other),
    (v: string) => other.normalize(thisRule.normalize(v)),
    newName,
    thisRule.backspaceStrokes,
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
