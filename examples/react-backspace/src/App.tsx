import { activate, detectKeyboardLayout, InputStroke, KeyboardLayout, loadPresetRuleRoman, VirtualKeys } from "emiel";
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { BackspaceRequirdAutomaton } from "./backspace";

function App() {
  const [layout, setLayout] = useState<KeyboardLayout | undefined>();
  useEffect(() => {
    detectKeyboardLayout(window).then(setLayout).catch(console.error);
  }, []);
  return layout ? <Typing layout={layout} /> : <></>;
}

function Typing(props: { layout: KeyboardLayout }) {
  const romanRule = useMemo(() => loadPresetRuleRoman(props.layout), [props.layout]);
  const words = useMemo(() => ["おをひく", "こんとん", "がっこう", "aから@"], []);
  const [automatons] = useState(
    words.map((w) => {
      return new BackspaceRequirdAutomaton(
        romanRule.build(w)
      );
    })
  );
  const [index, setIndex] = useState(0);
  const [lastInputKey, setLastInputKey] = useState<
    InputStroke | undefined
  >();
  const automaton = automatons[index];
  useEffect(() => {
    return activate(window, (e) => {
      setLastInputKey(e.input);
      if (e.input.key === VirtualKeys.Backspace) {
        automaton.backFailedInput();
        return;
      }
      const result = automaton.input(e);
      if (result.isFinished) {
        automaton.reset();
        setIndex((current) => (current + 1) % words.length);
      }
    });
  }, [index, automaton, words]);
  return (
    <>
      <h1>
        <div style={{ display: "flex" }}>
          <div style={{ color: "gray" }}>{automaton.base.getFinishedWord()}</div>
          <div
            style={{
              marginLeft: automaton.base.getFinishedWord() ? "0.5rem" : "0",
            }}
          >
            {automaton.base.getPendingWord()}
          </div>
        </div>
      </h1>
      <h1>
        <div style={{ display: "flex" }}>
          <div style={{ color: "gray" }}>{automaton.base.getFinishedRoman()}</div>
          <div
            style={{
              marginLeft: automaton.base.getFinishedRoman() ? "0.5rem" : "0",
              textAlign: "left",
            }}
          >
            {automaton.base.getPendingRoman()}
            <br />
            <span style={{ color: "yellow" }}>
              {automaton.failedInputs
                .map((f) =>
                  props.layout
                    .getCharByKey(
                      f.input.key,
                      f.keyboardState.isAnyKeyDowned(
                        VirtualKeys.ShiftLeft,
                        VirtualKeys.ShiftRight
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
