import * as emiel from "emiel";

export function buildGraphData(startNode: emiel.StrokeNode) {
  const nodes = new Map<emiel.StrokeNode, number>();
  const edges = new Set<emiel.StrokeEdge>();
  walkTree(startNode, nodes, edges);
  return {
    nodesMap: nodes,
    nodes: Array.from(nodes.values()).map((id) => ({
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
  startNode: emiel.StrokeNode,
  nodes: Map<emiel.StrokeNode, number>,
  edges: Set<emiel.StrokeEdge>
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

function strokeToString(stroke: emiel.StrokeEdge): string {
  const key = stroke.input.key;
  const mod = stroke.input.requiredModifier;
  const modStr = Array.from(
    new Set(
      mod.groups
        .flatMap((v) => v.modifiers)
        .map((v) => {
          if (
            v === emiel.VirtualKeys.ShiftLeft ||
            v === emiel.VirtualKeys.ShiftRight
          ) {
            return "Sft";
          }
          return keyToString(v);
        })
    )
  ).join(",");
  return keyToString(key) + (modStr.length > 0 ? `/${modStr}` : "");
}

function keyToString(key: emiel.VirtualKey): string {
  switch (key) {
    case emiel.VirtualKeys.A:
    case emiel.VirtualKeys.B:
    case emiel.VirtualKeys.C:
    case emiel.VirtualKeys.D:
    case emiel.VirtualKeys.E:
    case emiel.VirtualKeys.F:
    case emiel.VirtualKeys.G:
    case emiel.VirtualKeys.H:
    case emiel.VirtualKeys.I:
    case emiel.VirtualKeys.J:
    case emiel.VirtualKeys.K:
    case emiel.VirtualKeys.L:
    case emiel.VirtualKeys.M:
    case emiel.VirtualKeys.N:
    case emiel.VirtualKeys.O:
    case emiel.VirtualKeys.P:
    case emiel.VirtualKeys.Q:
    case emiel.VirtualKeys.R:
    case emiel.VirtualKeys.S:
    case emiel.VirtualKeys.T:
    case emiel.VirtualKeys.U:
    case emiel.VirtualKeys.V:
    case emiel.VirtualKeys.W:
    case emiel.VirtualKeys.X:
    case emiel.VirtualKeys.Y:
    case emiel.VirtualKeys.Z:
      return key.toString();
    case emiel.VirtualKeys.Digit0:
    case emiel.VirtualKeys.Digit1:
    case emiel.VirtualKeys.Digit2:
    case emiel.VirtualKeys.Digit3:
    case emiel.VirtualKeys.Digit4:
    case emiel.VirtualKeys.Digit5:
    case emiel.VirtualKeys.Digit6:
    case emiel.VirtualKeys.Digit7:
    case emiel.VirtualKeys.Digit8:
    case emiel.VirtualKeys.Digit9:
      return key.toString().replace("Digit", "");
    case emiel.VirtualKeys.Minus:
      return "-";
    case emiel.VirtualKeys.Equal:
      return "^";
    case emiel.VirtualKeys.JpnYen:
      return "¥";
    case emiel.VirtualKeys.BracketLeft:
      return "@";
    case emiel.VirtualKeys.BracketRight:
      return "[";
    case emiel.VirtualKeys.Semicolon:
      return ";";
    case emiel.VirtualKeys.Quote:
      return ":";
    case emiel.VirtualKeys.Backslash:
      return "]";
    case emiel.VirtualKeys.Comma:
      return ",";
    case emiel.VirtualKeys.Period:
      return ".";
    case emiel.VirtualKeys.Slash:
      return "/";
    case emiel.VirtualKeys.JpnRo:
      return "_";
    case emiel.VirtualKeys.Space:
      return "␣";
    case emiel.VirtualKeys.Lang2:
      return "親左";
    case emiel.VirtualKeys.Lang1:
      return "親右";
  }
  return key.toString();
}
