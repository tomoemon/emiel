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
  console.log("selector", selector);
  const romanAutomaton = selector.items[0];
  const kanaAutomaton = selector.items[1];
  return (
    <>
      <h1>
        {/* 課題文かな表示 */}
        <span style={{ color: "gray" }}>
          {selector.activeItems[0].finishedWord}
        </span>{" "}
        {selector.activeItems[0].pendingWord}
      </h1>
      {/* ローマ字入力 */}
      <h1>
        <p style={{ fontSize: "1rem" }}>ローマ字入力</p>
        <span style={{ color: "gray" }}>
          {romanAutomaton.finishedRoman}
        </span>{" "}
        {romanAutomaton.pendingRoman}
      </h1>
      {/* かな入力 */}
      <h1>
        <p style={{ fontSize: "1rem" }}>かな入力</p>
        <span style={{ color: "gray" }}>
          {kanaAutomaton.finishedWord}
        </span>{" "}
        {kanaAutomaton.pendingWord}
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
