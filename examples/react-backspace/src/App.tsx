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
      return new emiel.BackspaceAutomaton(
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
      console.log("result", result);
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
          <div style={{ color: "gray" }}>{automaton.finishedWordSubstr}</div>
          <div
            style={{
              marginLeft: automaton.finishedWordSubstr ? "0.5rem" : "0",
            }}
          >
            {automaton.pendingWordSubstr}
          </div>
        </div>
      </h1>
      <h1>
        <div style={{ display: "flex" }}>
          <div style={{ color: "gray" }}>{automaton.finishedRomanSubstr}</div>
          <div
            style={{
              marginLeft: automaton.finishedRomanSubstr ? "0.5rem" : "0",
              textAlign: "left",
            }}
          >
            {automaton.pendingRomanSubstr}
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
