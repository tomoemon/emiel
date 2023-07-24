import { Automaton, MixedAutomaton } from "../core/automaton";
import { build, buildMixed } from "../core/automatonBuilder";
import { Rule } from "../core/rule";
import { VirtualKey } from "./virtualKey";

export function buildAutomaton(
  rule: Rule<VirtualKey>,
  kanaText: string
): Automaton<VirtualKey> {
  return build(rule, kanaText);
}

export function buildMixedAutomaton(
  rule: Rule<VirtualKey>,
  kanaTextSplit: string[],
  mixedTextSplit: string[]
): MixedAutomaton<VirtualKey> {
  return buildMixed(rule, kanaTextSplit, mixedTextSplit);
}
