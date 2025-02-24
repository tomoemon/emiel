import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { Automaton, detectKeyboardLayout, KeyboardLayout, loadPresetRuleNaginatashikiV15 } from "emiel";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { TypingGraph } from "./typingGraph";

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
cytoscape.use(dagre);

function App() {
  const [layout, setLayout] = useState<KeyboardLayout | undefined>();
  useEffect(() => {
    detectKeyboardLayout(window).then(setLayout).catch(console.error);
  }, []);
  return layout ? <Typing layout={layout} /> : <></>;
}

function Typing(props: { layout: KeyboardLayout }) {
  const rules = useMemo(() => [
    { name: "薙刀式", rule: loadPresetRuleNaginatashikiV15(props.layout) },
    // { name: "ローマ字", rule: loadPresetRuleRoman(props.layout) },
    // { name: "JISかな", rule: loadPresetRuleJisKana(props.layout) },
    // { name: "NICOLA", rule: loadPresetRuleNicola(props.layout) },
  ], [props.layout]);
  const [automaton, setAutomaton] = useState<Automaton | undefined>(
    undefined
  );
  const [ruleName, setRuleName] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [ruleIndex, setRuleIndex] = useState(0);
  const onFinished = useCallback(() => {
    const words = ["じょをひく", "しるため", "しょうがっこう"];
    const automaton = rules[ruleIndex].rule.build(words[wordIndex]);
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
  }, [ruleIndex, rules, wordIndex]);
  useEffect(() => {
    if (wordIndex === 0) {
      onFinished();
    }
  }, [onFinished, wordIndex]);
  return (
    <>
      {automaton ? (
        <TypingGraph
          automaton={automaton}
          ruleName={ruleName}
          onFinished={onFinished}
        ></TypingGraph>
      ) : (
        <>loading...</>
      )}
    </>
  );
}

export default App;
