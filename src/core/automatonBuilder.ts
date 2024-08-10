import { Rule } from "./rule";
import { buildKanaNode } from "./builderKanaGraph";
import { buildStrokeNode } from "./builderStrokeGraph";
import { Automaton } from "./automaton";

export function build(
  rule: Rule,
  kanaText: string,
): Automaton {
  const [_, endKanaNode] = buildKanaNode(rule, kanaText);
  return new Automaton(kanaText, buildStrokeNode(rule, endKanaNode));
}
