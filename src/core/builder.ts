import { Comparable, Rule } from "./rule";
import { buildKanaNode } from "./builder_kana_graph";
import { StrokeNode, buildStrokeNode } from "./builder_stroke_graph";

export function build<T extends Comparable<T>>(
  rule: Rule<T>,
  kanaText: string
): StrokeNode<T> {
  const [_, endKanaNode] = buildKanaNode(rule, kanaText);
  return buildStrokeNode(rule, endKanaNode);
}
