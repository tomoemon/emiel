import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import type { Automaton, InputStroke } from "emiel";
import { activate } from "emiel";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildGraphData } from "./graphData";
import { getCyStylesheet } from "./grpahStyle";

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
cytoscape.use(dagre);

// OS のカラースキーム（ライト / ダーク）を監視し、変更に追従する
function usePrefersDark() {
  const [dark, setDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return dark;
}

export function TypingGraph(props: { automaton: Automaton; onFinished: () => void }) {
  const { automaton, onFinished } = props;
  const graphData = useMemo(() => buildGraphData(automaton.startNode), [automaton]);
  const htmlElem = useRef(null);
  const [, setLastInputKey] = useState<InputStroke | undefined>();
  const dark = usePrefersDark();
  useEffect(() => {
    if (htmlElem.current === null) {
      return;
    }
    const cy = cytoscape({
      container: htmlElem.current,
      // @ts-expect-error rankDir is not defined in cytoscape
      layout: { name: "dagre", rankDir: "LR" },
      userZoomingEnabled: false,
      style: getCyStylesheet(dark),
    });
    cy.remove(cy.elements());
    cy.add([...graphData.nodes, ...graphData.edges]);
    // @ts-expect-error rankDir is not defined in cytoscape
    cy.layout({ name: "dagre", rankDir: "LR" }).run();

    return activate(window, (e) => {
      setLastInputKey(e.input);
      const result = automaton.input(e);
      console.log(e.input.key.toString(), e.input.type, result);
      if (result.isFinished) {
        onFinished();
      } else if (result.isSucceeded) {
        const nodeId = graphData.nodesMap.get(automaton.currentNode);
        if (nodeId !== undefined) {
          cy.elements(`#${nodeId}`).addClass("success");
        }
      } else if (result.isFailed) {
        const nodeId = graphData.nodesMap.get(automaton.currentNode);
        if (nodeId !== undefined) {
          cy.elements(`#${nodeId}`).addClass("miss");
        }
      }
    });
  }, [automaton, graphData, onFinished, dark]);

  const view = automaton.currentView();
  return (
    <>
      <p className="target-word">
        <span style={{ color: "gray" }}>{view.finishedWord}</span> {view.pendingWord}
      </p>
      <div
        ref={htmlElem}
        style={{
          width: "600px",
          height: "300px",
          border: "1px solid #888",
          margin: "0 auto",
        }}
      />
    </>
  );
}
