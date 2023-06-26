import { Comparable, Rule } from "./rule";
import { buildKanaNode } from "./kana_graph_builder";
import { StrokeNode, buildStrokeNode } from "./stroke_graph_builder";

export function build<T extends Comparable<T>, M>(
  rule: Rule<T, M>,
  kanaText: string
): StrokeNode<T> {
  const [_, endKanaNode] = buildKanaNode(rule, kanaText);
  return buildStrokeNode(endKanaNode);
}
