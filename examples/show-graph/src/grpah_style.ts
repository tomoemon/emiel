export const cyStylesheet = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      width: 30,
      height: 30,
      backgroundColor: "white",
      borderColor: "yellow",
      borderWidth: 2,
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
      borderColor: "yellow",
      borderWidth: 2,
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
      borderColor: "yellow",
      borderWidth: 2,
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
      lineColor: "green",
      "text-margin-y": "-10px",
      "arrow-scale": 1,
      "curve-style": "bezier",
      "target-arrow-color": "green",
      "target-arrow-shape": "triangle",
    },
  },
];
