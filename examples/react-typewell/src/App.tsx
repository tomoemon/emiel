import type { KeyboardLayout } from "emiel";
import { createDirectInputRule, detectKeyboardLayout, loadPresetRuleRoman, logging } from "emiel";
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { Record } from "./Record";
import { Typing } from "./Typing";
import { buildWords } from "./wordAutomaton";

logging.enable("keyboard.*", "automaton.*");

const LOGICAL_WORDS = ["キャンペーン", "かった", "pocket", "the Sun"];
const SEPARATOR = " ";

function App() {
  const [layout, setLayout] = useState<KeyboardLayout | undefined>();
  useEffect(() => {
    detectKeyboardLayout(window).then(setLayout).catch(console.error);
  }, []);
  return layout ? <TypingRoot layout={layout} /> : <></>;
}

function TypingRoot(props: { layout: KeyboardLayout }) {
  const rule = useMemo(
    () => loadPresetRuleRoman(props.layout).merge(createDirectInputRule(props.layout)),
    [props.layout],
  );
  const automaton = useMemo(() => buildWords(rule, LOGICAL_WORDS, SEPARATOR), [rule]);
  const [finished, setFinished] = useState(false);
  return finished ? (
    <Record automaton={automaton} />
  ) : (
    <Typing automaton={automaton} onFinished={() => setFinished(true)} />
  );
}

export default App;
