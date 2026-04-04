import { RuleEntry } from "./rule";
import type { RuleStroke } from "./ruleStroke";

export function expandPrefixRules(entries: RuleEntry[]): RuleEntry[] {
  const unextendable = entries.filter((e) => !e.extendCommonPrefixCommonEntry);
  const extendable = entries.filter((e) => e.extendCommonPrefixCommonEntry);
  return [...unextendable, ...resolvePrefixConflicts(extendable)];
}

function strokeHash(...strokes: RuleStroke[]): string {
  return strokes.map((s) => `${s.key.toString()}/${s.requiredModifier.toString()}`).join("-");
}

function findPrefixConflict(entryMap: Map<string, RuleEntry>): {
  entry: RuleEntry;
  hash: string;
  takenStrokes: Set<string>;
} | null {
  for (const [hash, entry] of entryMap) {
    const takenStrokes = new Set<string>();
    let hasConflict = false;
    for (const other of entryMap.values()) {
      if (other.input.length <= entry.input.length) continue;
      if (strokeHash(...other.input.slice(0, entry.input.length)) === hash) {
        takenStrokes.add(strokeHash(other.input[entry.input.length]));
        hasConflict = true;
      }
    }
    if (hasConflict) {
      takenStrokes.add(strokeHash(entry.input[0]));
      return { entry, hash, takenStrokes };
    }
  }
  return null;
}

function resolvePrefixConflicts(entries: RuleEntry[]): RuleEntry[] {
  const entryMap = new Map<string, RuleEntry>();
  for (const e of entries) {
    entryMap.set(strokeHash(...e.input), e);
  }

  while (true) {
    const conflict = findPrefixConflict(entryMap);
    if (!conflict) break;

    const { entry, hash, takenStrokes } = conflict;

    const availableEntries = [...entryMap.values()].filter(
      (e) => !takenStrokes.has(strokeHash(e.input[0])),
    );

    entryMap.delete(hash);

    for (const avail of availableEntries) {
      if (avail.input.length === 1) {
        const newInput = [...entry.input, ...avail.input];
        entryMap.set(
          strokeHash(...newInput),
          new RuleEntry(newInput, entry.output + avail.output, avail.nextInput, true),
        );
      } else {
        const newInput = [...entry.input, avail.input[0]];
        entryMap.set(
          strokeHash(...newInput),
          new RuleEntry(newInput, entry.output, [avail.input[0]], true),
        );
      }
    }
  }

  return [...entryMap.values()];
}
