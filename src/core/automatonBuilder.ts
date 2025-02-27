import { Automaton } from "./automaton";
import { buildKanaNode } from "./builderKanaGraph";
import { buildStrokeNode } from "./builderStrokeGraph";
import { Rule } from "./rule";

export function build(
  rule: Rule,
  kanaText: string,
): Automaton {
  const [_, endKanaNode] = buildKanaNode(rule, kanaText);
  return new Automaton(kanaText, buildStrokeNode(endKanaNode), rule);
}
