import { buildKanaNode } from "../core/builder";
import { Rule } from "../core/rule";
import { AcceptableCodeStroke, InputKeyEvent } from "./stroke";

export function buildAutomaton(
  rule: Rule<InputKeyEvent, AcceptableCodeStroke>,
  kanaText: string
) {
  return buildKanaNode(rule, kanaText);
}
