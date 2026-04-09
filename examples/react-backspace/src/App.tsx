import type { InputStroke, KeyboardLayout } from "emiel";
import { activate, build, detectKeyboardLayout, loadPresetRuleRoman, VirtualKeys } from "emiel";
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { MissAccumulatingAutomaton } from "./MissAccumulatingAutomaton";

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
  const [index, setIndex] = useState(0);
  const [lastInputKey, setLastInputKey] = useState<InputStroke | undefined>();

  const wrappers = useMemo(
    () => words.map((w) => new MissAccumulatingAutomaton(build(romanRule, w).withBackspace())),
    [romanRule, words],
  );
  const wrapper = wrappers[index];

  useEffect(() => {
    return activate(window, (e) => {
      setLastInputKey(e.input);
      const result = wrapper.input(e);
      if (result.isFinished) {
        wrapper.reset();
        setIndex((current) => (current + 1) % words.length);
      }
    });
  }, [wrapper, words]);

  return (
    <>
      <h1>
        <div style={{ display: "flex" }}>
          <div style={{ color: "gray" }}>{wrapper.getFinishedWord()}</div>
          <div
            style={{
              marginLeft: wrapper.getFinishedWord() ? "0.5rem" : "0",
            }}
          >
            {wrapper.getPendingWord()}
          </div>
        </div>
      </h1>
      <h1>
        <div style={{ display: "flex" }}>
          <div style={{ color: "gray" }}>{wrapper.getFinishedRoman()}</div>
          <div
            style={{
              marginLeft: wrapper.getFinishedRoman() ? "0.5rem" : "0",
              textAlign: "left",
            }}
          >
            {wrapper.getPendingRoman()}
            <br />
            <span style={{ color: "yellow" }}>
              {wrapper.failedInputs
                .map((f) =>
                  props.layout
                    .getCharByKey(
                      f.input.key,
                      f.keyboardState.isAnyKeyDowned(VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight),
                    )
                    .replace(" ", "_"),
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
      <table style={{ margin: "0 auto", textAlign: "left" }}>
        <tbody>
          <tr>
            <td>成功数</td>
            <td>{wrapper.getEffectiveEdgesCount()}</td>
          </tr>
          <tr>
            <td>ミス数 (全体)</td>
            <td>{wrapper.getFailedInputCount()}</td>
          </tr>
          <tr>
            <td>ミス数 (back 除外)</td>
            <td>{wrapper.getEffectiveFailedInputCount()}</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

export default App;
