import type { StylesheetStyle } from "cytoscape";

// ライト / ダーク両モードで視認できるよう、テーマに応じた色を返す
export function getCyStylesheet(dark: boolean): StylesheetStyle[] {
  // 通常ノードはページ背景と同化しないよう、テーマと逆寄りの淡色で塗る
  const nodeBackgroundColor = dark ? "#ffffff" : "#f0f0f0";
  // ノード番号やボーダーは背景とのコントラストを確保する
  const nodeTextColor = dark ? "#000000" : "#213547";
  const borderColor = dark ? "#e6e600" : "#cccc00";
  // edge ラベル（ローマ字）は白固定だと light モードで消えるためテーマ追従させる
  const edgeLabelColor = dark ? "#ffffff" : "#213547";

  const nodeBase = {
    label: "data(label)",
    width: 30,
    height: 30,
    "border-color": borderColor,
    "border-width": 2,
    shape: "round-rectangle",
    "text-valign": "center",
    "text-halign": "center",
  } as const;

  return [
    {
      selector: "node",
      style: {
        ...nodeBase,
        backgroundColor: nodeBackgroundColor,
        color: nodeTextColor,
      },
    },
    {
      selector: "node.success",
      style: {
        ...nodeBase,
        backgroundColor: "green",
        color: "#ffffff",
      },
    },
    {
      selector: "node.miss",
      style: {
        ...nodeBase,
        backgroundColor: "red",
        color: "#ffffff",
      },
    },
    {
      selector: "edge",
      style: {
        label: "data(label)",
        color: edgeLabelColor,
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
}
