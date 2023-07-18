import * as emiel from "../../../src/index";
import CytoscapeComponent from "react-cytoscapejs";
import { useEffect, useState } from "react";
import { buildGraphData } from "./graph_data";
import dagre from "cytoscape-dagre";
import cytoscape from "cytoscape";
import { cyStylesheet } from "./grpah_style";
import { Automaton } from "../../../src/core/automaton";
import { VirtualKey } from "../../../src/impl/virtual_key";
import { KeyboardLayout } from "../../../src/core/keyboard_layout";

cytoscape.use(dagre);

export function TypingGraph(props: {
  layout: KeyboardLayout<VirtualKey>;
  automaton: Automaton<VirtualKey>;
  ruleName: string;
  ruleRelyingOnKeyboardLayout: boolean;
  onFinished: () => void;
}) {
  const automaton = props.automaton;
  const graphData = buildGraphData(automaton.currentNode);
  const [guide, setGuide] = useState(
    new emiel.DefaultGuide(props.layout, automaton)
  );
  let ref: cytoscape.Core;
  useEffect(() => {
    setGuide(new emiel.DefaultGuide(props.layout, automaton));
    ref.remove(ref.elements());
    ref.add([...graphData.nodes, ...graphData.edges]);
    ref.layout({ name: "dagre", rankDir: "LR" } as any).run();

    const deactivate = emiel.activate(window, (e) => {
      console.log(e);
      const result = automaton.input(e);
      console.log(result);
      console.log(automaton.currentNode);
      if (result.isFinished) {
        props.onFinished();
      } else if (result.isKeySucceeded) {
        const nodeId = graphData.nodesMap.get(automaton.currentNode)!;
        ref.elements(`#${nodeId}`).addClass("success");
      } else if (result.isFailed) {
        const nodeId = graphData.nodesMap.get(automaton.currentNode)!;
        ref.elements(`#${nodeId}`).addClass("miss");
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
      <CytoscapeComponent
        elements={[]}
        layout={{ name: "dagre", rankDir: "LR" } as any}
        userZoomingEnabled={false}
        style={{ width: "600px", height: "300px", border: "1px solid white" }}
        stylesheet={cyStylesheet as any}
        cy={(cy) => {
          ref = cy;
        }}
      />
    </>
  );
}
