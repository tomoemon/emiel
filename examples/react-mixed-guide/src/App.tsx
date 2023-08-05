import "./App.css";
import * as emiel from "../../../src/index";
import { useEffect, useState } from "react";

function App() {
  const [layout, setLayout] = useState<emiel.KeyboardLayout | undefined>();
  useEffect(() => {
    emiel.detectKeyboardLayout(window).then(setLayout);
  }, []);
  return layout ? <Typing layout={layout} /> : <></>;
}

function Typing(props: { layout: emiel.KeyboardLayout }) {
  const words = [
    { kana: "お,を,ひ,く".split(","), mixed: "尾,を,引,く".split(",") },
    { kana: "こん,とん".split(","), mixed: "混,沌".split(",") },
    {
      kana: "がっ,こう".split(","),
      mixed: "学,校".split(","),
    },
    {
      kana: "a,か,ら,@".split(","),
      mixed: "a,か,ら,@".split(","),
    },
  ];
  const [automatons] = useState(
    words.map((w) =>
      emiel.rule.getRoman(props.layout).buildMixed(w.kana, w.mixed)
    )
  );
  const [index, setIndex] = useState(0);
  const [lastInputKey, setLastInputKey] = useState<
    emiel.InputStroke | undefined
  >();
  useEffect(() => {
    return emiel.activate(window, (e) => {
      setLastInputKey(e.input);
      const result = automatons[index].input(e);
      if (result.isFinished) {
        setIndex((current) => {
          const newIndex = (current + 1) % automatons.length;
          automatons[newIndex].reset();
          return newIndex;
        });
      }
    });
  }, [index]);
  const automaton = automatons[index];

  return (
    <>
      <h1>
        <span style={{ color: "gray" }}>{automaton.finishedMixedSubstr}</span>{" "}
        {automaton.pendingMixedSubstr}
      </h1>
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
