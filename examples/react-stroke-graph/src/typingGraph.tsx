import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import type { Automaton, InputStroke } from "emiel";
import { activate } from "emiel";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildGraphData } from "./graphData";
import { cyStylesheet } from "./grpahStyle";

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
cytoscape.use(dagre);

export function TypingGraph(props: { automaton: Automaton; onFinished: () => void }) {
  const { automaton, onFinished } = props;
  const graphData = useMemo(() => buildGraphData(automaton.startNode), [automaton]);
  const htmlElem = useRef(null);
  const [, setLastInputKey] = useState<InputStroke | undefined>();
  useEffect(() => {
    if (htmlElem.current === null) {
      return;
    }
    const cy = cytoscape({
      container: htmlElem.current,
      // @ts-expect-error rankDir is not defined in cytoscape
      layout: { name: "dagre", rankDir: "LR" },
      userZoomingEnabled: false,
      style: cyStylesheet,
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
  }, [automaton, graphData, onFinished]);

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
          border: "1px solid white",
          margin: "0 auto",
        }}
      />
    </>
  );
}
