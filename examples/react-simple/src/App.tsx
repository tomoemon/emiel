import "./App.css";
import * as emiel from "emiel";
import { useEffect, useState } from "react";

function App() {
  const [layout, setLayout] = useState<emiel.KeyboardLayout | undefined>();
  useEffect(() => {
    emiel.keyboard.detect(window).then(setLayout);
  }, []);
  return layout ? <Typing layout={layout} /> : <></>;
}

function Typing(props: { layout: emiel.KeyboardLayout }) {
  const words = ["おをひく", "こんとん", "がっこう", "aから@"];
  const [automatons] = useState(
    words.map((w) => {
      return emiel.rule.getRoman(props.layout).build(w);
    })
  );
  const [index, setIndex] = useState(0);
  const [lastInputKey, setLastInputKey] = useState<
    emiel.InputStroke | undefined
  >();
  const automaton = automatons[index];
  useEffect(() => {
    return emiel.activate(window, (e) => {
      setLastInputKey(e.input);
      const result = automaton.input(e);
      if (result.isFinished) {
        automaton.reset();
        setIndex((current) => (current + 1) % words.length);
      }
    });
  }, [index]);
  return (
    <>
      <h1>
        <span style={{ color: "gray" }}>{automaton.finishedWordSubstr}</span>{" "}
        {automaton.pendingWordSubstr}
      </h1>
      <h1>
        <span style={{ color: "gray" }}>{automaton.finishedRomanSubstr}</span>{" "}
        {automaton.pendingRomanSubstr}
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
