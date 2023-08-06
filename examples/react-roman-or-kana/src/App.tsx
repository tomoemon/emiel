import "./App.css";
import * as emiel from "emiel";
import { useEffect, useState } from "react";

function App() {
  const [layout, setLayout] = useState<emiel.KeyboardLayout | undefined>();
  useEffect(() => {
    emiel.detectKeyboardLayout(window).then(setLayout);
  }, []);
  return layout ? <Typing layout={layout} /> : <></>;
}

function Typing(props: { layout: emiel.KeyboardLayout }) {
  const words = ["おをひく", "こんとん", "がっこう", "aから@"];
  const [selectors] = useState(
    words.map(
      (w) =>
        new emiel.Selector([
          emiel.rule.getRoman(props.layout).build(w),
          emiel.rule.getJisKana(props.layout).build(w),
        ])
    )
  );
  const [lastInputKey, setLastInputKey] = useState<
    emiel.InputStroke | undefined
  >();
  const [wordIndex, setWordIndex] = useState(0);
  useEffect(() => {
    return emiel.activate(window, (e) => {
      setLastInputKey(e.input);
      if (e.input.key === emiel.VirtualKeys.Escape) {
        selectors[wordIndex].reset();
        return;
      }
      selectors[wordIndex].input(e, {
        finished: (a) => {
          console.log("finished", a);
          setWordIndex((current) => {
            const newWordIndex = (current + 1) % words.length;
            selectors[newWordIndex].reset();
            return newWordIndex;
          });
        },
        succeeded: (a) => {
          console.log("succeeded", a);
        },
        failed: (a) => {
          console.log("failed", a);
        },
      });
    });
  }, [wordIndex]);

  const selector = selectors[wordIndex];
  const romanAutomaton = selector.automatons[0];
  const kanaAutomaton = selector.automatons[1];
  return (
    <>
      <h1>
        {/* 課題文かな表示 */}
        <span style={{ color: "gray" }}>
          {selector.activeAutomatons[0].finishedWordSubstr}
        </span>{" "}
        {selector.activeAutomatons[0].pendingWordSubstr}
      </h1>
      {/* ローマ字入力 */}
      <h1>
        <p style={{ fontSize: "1rem" }}>ローマ字入力</p>
        <span style={{ color: "gray" }}>
          {romanAutomaton.finishedRomanSubstr}
        </span>{" "}
        {romanAutomaton.pendingRomanSubstr}
      </h1>
      {/* かな入力 */}
      <h1>
        <p style={{ fontSize: "1rem" }}>かな入力</p>
        <span style={{ color: "gray" }}>
          {kanaAutomaton.finishedWordSubstr}
        </span>{" "}
        {kanaAutomaton.pendingWordSubstr}
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
