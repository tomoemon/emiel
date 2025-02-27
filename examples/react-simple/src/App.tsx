import { activate, detectKeyboardLayout, InputStroke, KeyboardLayout, loadPresetRuleRoman } from "emiel";
import { useEffect, useMemo, useState } from "react";
import "./App.css";

function App() {
  const [layout, setLayout] = useState<KeyboardLayout | undefined>();
  useEffect(() => {
    detectKeyboardLayout(window).then(setLayout).catch(console.error);
  }, []);
  return layout ? <Typing layout={layout} /> : <></>;
}

const words = ["おをひく", "こんとん", "がっこう", "aから@"];

function Typing(props: { layout: KeyboardLayout }) {
  const romanRule = useMemo(() => loadPresetRuleRoman(props.layout), [props.layout]);
  const [automatons] = useState(
    words.map((w) => {
      return romanRule.build(w);
    })
  );
  const [wordIndex, setWordIndex] = useState(0);
  const [lastInputKey, setLastInputKey] = useState<
    InputStroke | undefined
  >();
  useEffect(() => {
    return activate(window, (e) => {
      setLastInputKey(e.input);
      const result = automatons[wordIndex].input(e);
      console.log(e.input.key.toString(), e.input.type, result);
      if (result.isFinished) {
        automatons[wordIndex].reset();
        setWordIndex((current) => (current + 1) % words.length);
      }
    });
  }, [wordIndex, automatons]);
  const automaton = automatons[wordIndex];
  return (
    <>
      <h1>
        <span style={{ color: "gray" }}>{automaton.finishedWord}</span>{" "}
        {automaton.pendingWord}
      </h1>
      <h1>
        <span style={{ color: "gray" }}>{automaton.finishedRoman}</span>{" "}
        {automaton.pendingRoman}
      </h1>
      <h2>
        Key:{" "}
        <code style={{ border: "1px solid gray", padding: "0.2rem" }}>
          {lastInputKey ? lastInputKey.key.toString() : ""}
        </code>
      </h2>
    </>
  );
}

export default App;
