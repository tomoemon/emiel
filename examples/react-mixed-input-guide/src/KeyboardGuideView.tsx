import type { KeyPlacement, VirtualKey } from "emiel";
import { useMemo } from "react";

export function KeyboardGuideView(props: {
  placements: readonly KeyPlacement[];
  candidateKeys: ReadonlySet<VirtualKey>;
  missedKeys: ReadonlySet<VirtualKey>;
}) {
  const { boardWidth, boardHeight } = useMemo(() => {
    let w = 0;
    let h = 0;
    for (const p of props.placements) {
      w = Math.max(w, p.rect.x + p.rect.width);
      h = Math.max(h, p.rect.y + p.rect.height);
    }
    return { boardWidth: w, boardHeight: h };
  }, [props.placements]);

  return (
    <div style={{ position: "relative", width: boardWidth, height: boardHeight }}>
      {props.placements.map((p, i) => (
        <KeyView
          key={i}
          placement={p}
          isCandidate={props.candidateKeys.has(p.key)}
          isMissed={props.missedKeys.has(p.key)}
        />
      ))}
    </div>
  );
}

function KeyView(props: { placement: KeyPlacement; isCandidate: boolean; isMissed: boolean }) {
  const { rect } = props.placement;
  const p = props.placement;
  const backgroundColor = props.isMissed
    ? "#ff5555"
    : props.isCandidate
      ? "#3388ff"
      : "transparent";
  return (
    <div
      style={{
        position: "absolute",
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        border: "1px solid #888",
        borderRadius: "4px",
        backgroundColor,
        transition: "background-color 0.12s",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        lineHeight: "10pt",
        fontSize: "10pt",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          height: `${rect.height / 3}px`,
          position: "relative",
          top: "2px",
        }}
      >
        <div>{p.topLeft ?? ""}</div>
        <div>{p.top ?? ""}</div>
        <div>{p.topRight ?? ""}</div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          height: `${rect.height / 3}px`,
        }}
      >
        <div>{p.left ?? ""}</div>
        <div style={{ fontSize: "9pt" }}>{p.center ?? ""}</div>
        <div>{p.right ?? ""}</div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          height: `${rect.height / 3}px`,
          position: "relative",
          top: "-2px",
        }}
      >
        <div>{p.bottomLeft ?? ""}</div>
        <div>{p.bottom ?? ""}</div>
        <div>{p.bottomRight ?? ""}</div>
      </div>
    </div>
  );
}
