import "./App.css";
import * as emiel from "emiel";
import { useEffect, useState } from "react";

function App() {
  const [layout, setLayout] = useState<emiel.KeyboardLayout | undefined>();
  useEffect(() => {
    emiel.keyboard.detect(window).then(setLayout).catch(console.error);
  }, []);
  return layout ? <Typing layout={layout} /> : <></>;
}

const words = ["おをひく", "こんとん", "がっこう", "aから@"];

function Typing(props: { layout: emiel.KeyboardLayout }) {
  const [automatons] = useState(
    words.map((w) => {
      return emiel.rule.getRoman(props.layout).build(w);
    })
  );
  const [wordIndex, setWordIndex] = useState(0);
  const [lastInputKey, setLastInputKey] = useState<
    emiel.InputStroke | undefined
  >();
  useEffect(() => {
    return emiel.activate(window, (e) => {
      setLastInputKey(e.input);
      const result = automatons[wordIndex].input(e);
      if (result.isFinished) {
        automatons[wordIndex].reset();
        setWordIndex((current) => (current + 1) % words.length);
      }
    });
  }, [wordIndex, automatons]);
  const automaton = automatons[wordIndex];
  console.log(automaton);
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
