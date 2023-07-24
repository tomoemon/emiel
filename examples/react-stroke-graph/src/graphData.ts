import { StrokeEdge, StrokeNode } from "../../../src/core/builderStrokeGraph";
import { VirtualKey, VirtualKeys } from "../../../src/impl/virtualKey";

export function buildGraphData(startNode: StrokeNode<VirtualKey>) {
  const nodes = new Map<StrokeNode<VirtualKey>, number>();
  const edges = new Set<StrokeEdge<VirtualKey>>();
  walkTree(startNode, nodes, edges);
  return {
    nodesMap: nodes,
    nodes: Array.from(nodes.entries()).map(([_, id]) => ({
      data: {
        id: id.toString(),
        label: id.toString(),
      },
      classes: id === 0 ? "success" : "",
    })),
    edges: Array.from(edges).map((edge) => {
      return {
        data: {
          source: nodes.get(edge.previous)!.toString(),
          target: nodes.get(edge.next)!.toString(),
          label: strokeToString(edge),
        },
      };
    }),
  };
}

function walkTree(
  startNode: StrokeNode<VirtualKey>,
  nodes: Map<StrokeNode<VirtualKey>, number>,
  edges: Set<StrokeEdge<VirtualKey>>
) {
  if (nodes.has(startNode)) {
    return;
  }
  nodes.set(startNode, nodes.size);
  startNode.nextEdges.forEach((edge) => {
    edges.add(edge);
    walkTree(edge.next, nodes, edges);
  });
}

function strokeToString(stroke: StrokeEdge<VirtualKey>): string {
  const key = stroke.input.key;
  const mod = stroke.input.requiredModifier;
  const modStr = Array.from(
    new Set(
      mod.groups
        .flatMap((v) => v.modifiers)
        .map((v) => {
          if (v === VirtualKeys.ShiftLeft || v === VirtualKeys.ShiftRight) {
            return "Sft";
          }
          return keyToString(v);
        })
    )
  ).join(",");
  return keyToString(key) + (modStr.length > 0 ? `/${modStr}` : "");
}

function keyToString(key: VirtualKey): string {
  switch (key) {
    case VirtualKeys.A:
    case VirtualKeys.B:
    case VirtualKeys.C:
    case VirtualKeys.D:
    case VirtualKeys.E:
    case VirtualKeys.F:
    case VirtualKeys.G:
    case VirtualKeys.H:
    case VirtualKeys.I:
    case VirtualKeys.J:
    case VirtualKeys.K:
    case VirtualKeys.L:
    case VirtualKeys.M:
    case VirtualKeys.N:
    case VirtualKeys.O:
    case VirtualKeys.P:
    case VirtualKeys.Q:
    case VirtualKeys.R:
    case VirtualKeys.S:
    case VirtualKeys.T:
    case VirtualKeys.U:
    case VirtualKeys.V:
    case VirtualKeys.W:
    case VirtualKeys.X:
    case VirtualKeys.Y:
    case VirtualKeys.Z:
      return key.toString();
    case VirtualKeys.Digit0:
    case VirtualKeys.Digit1:
    case VirtualKeys.Digit2:
    case VirtualKeys.Digit3:
    case VirtualKeys.Digit4:
    case VirtualKeys.Digit5:
    case VirtualKeys.Digit6:
    case VirtualKeys.Digit7:
    case VirtualKeys.Digit8:
    case VirtualKeys.Digit9:
      return key.toString().replace("Digit", "");
    case VirtualKeys.Minus:
      return "-";
    case VirtualKeys.Equal:
      return "^";
    case VirtualKeys.JpnYen:
      return "¥";
    case VirtualKeys.BracketLeft:
      return "@";
    case VirtualKeys.BracketRight:
      return "[";
    case VirtualKeys.Semicolon:
      return ";";
    case VirtualKeys.Quote:
      return ":";
    case VirtualKeys.Backslash:
      return "]";
    case VirtualKeys.Comma:
      return ",";
    case VirtualKeys.Period:
      return ".";
    case VirtualKeys.Slash:
      return "/";
    case VirtualKeys.JpnRo:
      return "_";
    case VirtualKeys.Space:
      return "␣";
    case VirtualKeys.Lang2:
      return "親左";
    case VirtualKeys.Lang1:
      return "親右";
  }
  return key.toString();
}
