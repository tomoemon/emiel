import { Automaton } from "../core/automaton";
import { build } from "../core/builder";
import { Rule } from "../core/rule";
import { AcceptableCodeStroke, InputKeyEvent } from "./stroke";
import { VirtualKey } from "./virtual_key";

export function buildAutomaton(
  rule: Rule<InputKeyEvent, AcceptableCodeStroke, VirtualKey>,
  kanaText: string
) {
  const strokeNode = build(rule, kanaText);
  return new Automaton(strokeNode);
}
