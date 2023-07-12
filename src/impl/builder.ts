import { Automaton } from "../core/automaton";
import { build } from "../core/builder";
import { Rule } from "../core/rule";
import { VirtualKey } from "./virtual_key";

export function buildAutomaton(
  rule: Rule<VirtualKey>,
  kanaText: string
): Automaton<VirtualKey> {
  const strokeNode = build(rule, kanaText);
  return new Automaton(kanaText, strokeNode);
}
