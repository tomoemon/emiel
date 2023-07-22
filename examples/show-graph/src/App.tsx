import "./App.css";
import * as emiel from "../../../src/index";
import { useEffect, useState } from "react";
import dagre from "cytoscape-dagre";
import cytoscape from "cytoscape";
import { TypingGraph } from "./typingGraph";

const layout = emiel.keyboard.get("qwerty-jis");

cytoscape.use(dagre);

function App() {
  const rules = [
    { name: "ローマ字", rule: emiel.rule.get("roman", layout) },
    { name: "JISかな", rule: emiel.rule.get("jis-kana", layout) },
    { name: "NICOLA", rule: emiel.rule.get("nicola", layout) },
  ];
  const words = ["おをひく", "こんとん", "がっこう", "aから@"];
  const [automaton, setAutomaton] = useState<emiel.Automaton | undefined>(
    undefined
  );
  const [ruleName, setRuleName] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [ruleIndex, setRuleIndex] = useState(0);
  const [relyingOnKeyboard, setRelyingOnKeyboard] = useState(true);
  const onFinished = () => {
    const automaton = emiel.build(rules[ruleIndex].rule, words[wordIndex]);
    setAutomaton(automaton);
    setRuleName(rules[ruleIndex].name);
    setRelyingOnKeyboard(rules[ruleIndex].rule.isStrokeRelyingOnKeyboardLayout);
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
          ruleRelyingOnKeyboardLayout={relyingOnKeyboard}
          onFinished={onFinished}
        ></TypingGraph>
      ) : (
        <>loading...</>
      )}
    </>
  );
}

export default App;
