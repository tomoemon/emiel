import { Comparable, Rule } from "./rule";
import { buildKanaNode } from "./builderKanaGraph";
import { StrokeNode, buildStrokeNode } from "./builderStrokeGraph";

export function build<T extends Comparable<T>>(
  rule: Rule<T>,
  kanaText: string
): StrokeNode<T> {
  const [_, endKanaNode] = buildKanaNode(rule, kanaText);
  return buildStrokeNode(rule, endKanaNode);
}
