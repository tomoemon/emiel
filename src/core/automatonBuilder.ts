import { Comparable, Rule } from "./rule";
import { buildKanaNode } from "./builderKanaGraph";
import { buildStrokeNode } from "./builderStrokeGraph";
import { Automaton } from "./automaton";

export function build<T extends Comparable<T>>(
  rule: Rule<T>,
  kanaText: string,
): Automaton<T> {
  const [_, endKanaNode] = buildKanaNode(rule, kanaText);
  return new Automaton<T>(kanaText, buildStrokeNode(rule, endKanaNode));
}
