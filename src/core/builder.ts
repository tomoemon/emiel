import { Acceptable, Comparable, Rule } from "./rule";
import { buildKanaNode } from "./kana_graph_builder";
import { StrokeNode, buildStrokeNode } from "./stroke_graph_builder";

export function build<U, T extends Comparable<T> & Acceptable<U>>(
  rule: Rule<U, T>,
  kanaText: string
): StrokeNode<U, T> {
  const [_, endKanaNode] = buildKanaNode(rule, kanaText);
  return buildStrokeNode(endKanaNode);
}
