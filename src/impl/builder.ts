import { Automaton } from "../core/automaton";
import { build } from "../core/builder";
import { Rule } from "../core/rule";
import { AcceptableCodeStroke, InputKeyEvent } from "./stroke";

export function buildAutomaton(
  rule: Rule<InputKeyEvent, AcceptableCodeStroke>,
  kanaText: string
) {
  const strokeNode = build(rule, kanaText);
  return new Automaton(strokeNode);
}
