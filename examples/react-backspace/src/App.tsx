import "./App.css";
import * as emiel from "emiel";
import { useEffect, useState } from "react";
import { BackspaceRequirdAutomaton } from "./backspace";

function App() {
  const [layout, setLayout] = useState<emiel.KeyboardLayout | undefined>();
  useEffect(() => {
    emiel.keyboard.detect(window).then(setLayout).catch(console.error);
  }, []);
  return layout ? <Typing layout={layout} /> : <></>;
}

function Typing(props: { layout: emiel.KeyboardLayout }) {
  const words = ["おをひく", "こんとん", "がっこう", "aから@"];
  const [automatons] = useState(
    words.map((w) => {
      return new BackspaceRequirdAutomaton(
        emiel.rule.getRoman(props.layout).build(w)
      );
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
      if (e.input.key === emiel.VirtualKeys.Backspace) {
        automaton.backFailedInput();
        return;
      }
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
        <div style={{ display: "flex" }}>
          <div style={{ color: "gray" }}>{automaton.base.finishedWord}</div>
          <div
            style={{
              marginLeft: automaton.base.finishedWord ? "0.5rem" : "0",
            }}
          >
            {automaton.base.pendingWord}
          </div>
        </div>
      </h1>
      <h1>
        <div style={{ display: "flex" }}>
          <div style={{ color: "gray" }}>{automaton.base.finishedRoman}</div>
          <div
            style={{
              marginLeft: automaton.base.finishedRoman ? "0.5rem" : "0",
              textAlign: "left",
            }}
          >
            {automaton.base.pendingRoman}
            <br />
            <span style={{ color: "yellow" }}>
              {automaton.failedInputs
                .map((f) =>
                  props.layout
                    .getCharByKey(
                      f.input.key,
                      f.keyboardState.isAnyKeyDowned(
                        emiel.VirtualKeys.ShiftLeft,
                        emiel.VirtualKeys.ShiftRight
                      )
                    )
                    .replace(" ", "_")
                )
                .join("")}
            </span>
          </div>
        </div>
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
