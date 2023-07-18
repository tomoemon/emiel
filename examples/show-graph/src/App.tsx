import "./App.css";
import * as emiel from "../../../src/index";
import { useEffect, useState } from "react";
import dagre from "cytoscape-dagre";
import cytoscape from "cytoscape";
import { TypingGraph } from "./typingGraph";
import { Automaton } from "../../../src/core/automaton";
import { VirtualKey } from "../../../src/impl/virtualKey";

const layout = emiel.getKeyboardLayout("dvorak");

cytoscape.use(dagre);

function App() {
  const rules = [
    { name: "ローマ字", rule: emiel.rules.get("roman", layout) },
    { name: "JISかな", rule: emiel.rules.get("jis-kana", layout) },
    { name: "NICOLA", rule: emiel.rules.get("nicola", layout) },
  ];
  const words = ["おをひく", "こんとん", "がっこう", "aから@"];
  const [automaton, setAutomaton] = useState<Automaton<VirtualKey> | undefined>(
    undefined
  );
  const [ruleName, setRuleName] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [ruleIndex, setRuleIndex] = useState(0);
  const onFinished = () => {
    console.log("finished", wordIndex, ruleIndex);
    const automaton = emiel.buildAutomaton(
      rules[ruleIndex].rule,
      words[wordIndex]
    );
    setAutomaton(automaton);
    setRuleName(rules[ruleIndex].name);
    if (wordIndex < words.length - 1) {
      setWordIndex(wordIndex + 1);
    } else {
      setWordIndex(0);
      if (ruleIndex < rules.length - 1) {
        setRuleIndex(ruleIndex + 1);
      } else {
        setRuleIndex(0);
      }
    }
    console.log("next", wordIndex, ruleIndex);
  };
  useEffect(() => {
    if (wordIndex === 0) {
      onFinished();
    }
  }, []);
  return (
    <>
      {automaton ? (
        <TypingGraph
          layout={layout}
          automaton={automaton}
          ruleName={ruleName}
          ruleRelyingOnKeyboardLayout={
            rules[ruleIndex].rule.isStrokeRelyingOnKeyboardLayout
          }
          onFinished={onFinished}
        ></TypingGraph>
      ) : (
        <>loading...</>
      )}
    </>
  );
}

/*
function App() {
  const words = ["おをひく", "こんとん", "がっこう", "aからz"];
  const automatons = words.map((w) =>
    emiel.buildAutomaton(emiel.rules.nicola, w)
  );
  const graphDatas = automatons.map((a) => buildGraphData(a.currentNode));
  let wordIndex = 0;
  const [guide, setGuide] = useState(
    new emiel.DefaultGuide(automatons[wordIndex])
  );
  let ref: cytoscape.Core;
  useEffect(() => {
    const data = graphDatas[wordIndex];
    ref.add([...data.nodes, ...data.edges]);
    ref.layout({ name: "dagre", rankDir: "LR" } as any).run();

    const deactivate = emiel.activate(window, (e) => {
      console.log(e);
      const result = automatons[wordIndex].input(e);
      console.log(result);
      console.log(automatons[wordIndex].currentNode);
      if (result.isFinished) {
        wordIndex = (wordIndex + 1) % automatons.length;
        automatons[wordIndex].reset();
        ref.remove(ref.elements());
        const data = graphDatas[wordIndex];
        ref.add([...data.nodes, ...data.edges]);
        ref.layout({ name: "dagre", rankDir: "LR" } as any).run();
      } else if (result.isKeySucceeded) {
        const data = graphDatas[wordIndex];
        const nodeId = data.nodesMap.get(automatons[wordIndex].currentNode)!;
        ref.elements(`#${nodeId}`).addClass("success");
      } else if (result.isFailed) {
        const data = graphDatas[wordIndex];
        const nodeId = data.nodesMap.get(automatons[wordIndex].currentNode)!;
        ref.elements(`#${nodeId}`).addClass("miss");
      }
      setGuide(new emiel.DefaultGuide(automatons[wordIndex]));
    });
    return deactivate;
  }, []);

  return (
    <>
      <h1>
        <span style={{ color: "gray" }}>{guide.finishedWordSubstr}</span>{" "}
        {guide.pendingWordSubstr}
      </h1>
      <h1>
        <span style={{ color: "gray" }}>{guide.finishedKeys}</span>{" "}
        {guide.pendingKeys}
      </h1>
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
*/

export default App;
