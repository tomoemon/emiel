import { useEffect, useRef, useState } from "react";
import { buildGraphData } from "./graphData";
import dagre from "cytoscape-dagre";
import cytoscape from "cytoscape";
import { cyStylesheet } from "./grpahStyle";
import * as emiel from "emiel";

cytoscape.use(dagre);

export function TypingGraph(props: {
  automaton: emiel.Automaton;
  ruleName: string;
  onFinished: () => void;
}) {
  const automaton = props.automaton;
  const graphData = buildGraphData(automaton.currentNode);
  const htmlElem = useRef(null);
  const [_, setLastInputKey] = useState<emiel.InputStroke | undefined>();
  useEffect(() => {
    const cy = cytoscape({
      container: htmlElem.current!,
      layout: { name: "dagre", rankDir: "LR" } as any,
      userZoomingEnabled: false,
      style: cyStylesheet,
    });
    cy.remove(cy.elements());
    cy.add([...graphData.nodes, ...graphData.edges]);
    cy.layout({ name: "dagre", rankDir: "LR" } as any).run();

    const deactivate = emiel.activate(window, (e) => {
      setLastInputKey(e.input);
      const result = automaton.input(e);
      if (result.isFinished) {
        props.onFinished();
      } else if (result.isSucceeded) {
        const nodeId = graphData.nodesMap.get(automaton.currentNode)!;
        cy.elements(`#${nodeId}`).addClass("success");
      } else if (result.isFailed) {
        const nodeId = graphData.nodesMap.get(automaton.currentNode)!;
        cy.elements(`#${nodeId}`).addClass("miss");
      }
    });
    return deactivate;
  }, [props.automaton]);

  const finishedRomanSubstr = automaton.finishedRomanSubstr;
  const pendingRomanSubstr = automaton.pendingRomanSubstr;
  return (
    <>
      <h2>{props.ruleName}</h2>
      <h1>
        <span style={{ color: "gray" }}>{automaton.finishedWordSubstr}</span>{" "}
        {automaton.pendingWordSubstr}
      </h1>
      {finishedRomanSubstr || pendingRomanSubstr ? (
        <h1>
          <span style={{ color: "gray" }}>{automaton.finishedRomanSubstr}</span>{" "}
          {automaton.pendingRomanSubstr}
        </h1>
      ) : (
        <></>
      )}
      <div
        ref={htmlElem}
        style={{ width: "600px", height: "300px", border: "1px solid white" }}
      />
    </>
  );
}
