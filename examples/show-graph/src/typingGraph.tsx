import { useEffect, useRef, useState } from "react";
import { buildGraphData } from "./graphData";
import dagre from "cytoscape-dagre";
import cytoscape from "cytoscape";
import { cyStylesheet } from "./grpahStyle";
import * as emiel from "../../../src/index";

cytoscape.use(dagre);

export function TypingGraph(props: {
  layout: emiel.KeyboardLayout;
  automaton: emiel.Automaton;
  ruleName: string;
  ruleRelyingOnKeyboardLayout: boolean;
  onFinished: () => void;
}) {
  console.log("relying on keyboard", props.ruleRelyingOnKeyboardLayout);
  const automaton = props.automaton;
  const graphData = buildGraphData(automaton.currentNode);
  const [guide, setGuide] = useState(
    new emiel.DefaultGuide(props.layout, automaton)
  );
  const htmlElem = useRef(null);
  useEffect(() => {
    const cy = cytoscape({
      container: htmlElem.current!,
      layout: { name: "dagre", rankDir: "LR" } as any,
      userZoomingEnabled: false,
      style: cyStylesheet,
    });
    setGuide(new emiel.DefaultGuide(props.layout, automaton));
    cy.remove(cy.elements());
    cy.add([...graphData.nodes, ...graphData.edges]);
    cy.layout({ name: "dagre", rankDir: "LR" } as any).run();

    const deactivate = emiel.activate(window, (e) => {
      console.log(e);
      const result = automaton.input(e);
      console.log(result);
      console.log(automaton.currentNode);
      if (result.isFinished) {
        props.onFinished();
      } else if (result.isSucceeded) {
        const nodeId = graphData.nodesMap.get(automaton.currentNode)!;
        cy.elements(`#${nodeId}`).addClass("success");
      } else if (result.isFailed) {
        const nodeId = graphData.nodesMap.get(automaton.currentNode)!;
        cy.elements(`#${nodeId}`).addClass("miss");
      }
      setGuide(new emiel.DefaultGuide(props.layout, automaton));
    });
    return deactivate;
  }, [props.automaton]);

  return (
    <>
      <h2>{props.ruleName}</h2>
      <h1>
        <span style={{ color: "gray" }}>{guide.finishedWordSubstr}</span>{" "}
        {guide.pendingWordSubstr}
      </h1>
      {props.ruleRelyingOnKeyboardLayout ? (
        <h1>
          <span style={{ color: "gray" }}>{guide.finishedKeys}</span>{" "}
          {guide.pendingKeys}
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
