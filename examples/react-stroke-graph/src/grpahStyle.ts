import { Stylesheet } from "cytoscape";

export const cyStylesheet: Stylesheet[] = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      width: 30,
      height: 30,
      backgroundColor: "white",
      "border-color": "yellow",
      "border-width": 2,
      shape: "round-rectangle",
      "text-valign": "center",
      "text-halign": "center",
    },
  },
  {
    selector: "node.success",
    style: {
      label: "data(label)",
      width: 30,
      height: 30,
      backgroundColor: "green",
      "border-color": "yellow",
      "border-width": 2,
      shape: "round-rectangle",
      "text-valign": "center",
      "text-halign": "center",
    },
  },
  {
    selector: "node.miss",
    style: {
      label: "data(label)",
      width: 30,
      height: 30,
      backgroundColor: "red",
      "border-color": "yellow",
      "border-width": 2,
      shape: "round-rectangle",
      "text-valign": "center",
      "text-halign": "center",
    },
  },
  {
    selector: "edge",
    style: {
      label: "data(label)",
      color: "white",
      width: 3,
      "line-color": "green",
      "text-margin-y": -10,
      "arrow-scale": 1,
      "curve-style": "bezier",
      "target-arrow-color": "green",
      "target-arrow-shape": "triangle",
    },
  },
];
