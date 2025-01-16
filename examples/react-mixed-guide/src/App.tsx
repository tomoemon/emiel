import { activate, detectKeyboardLayout, InputStroke, KeyboardLayout, loadPresetRuleRoman } from "emiel";
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { MixedText, MixedTextAutomaton } from "./MixedGuide";

function App() {
  const [layout, setLayout] = useState<KeyboardLayout | undefined>();
  useEffect(() => {
    detectKeyboardLayout(window).then(setLayout).catch(console.error);
  }, []);
  return layout ? <Typing layout={layout} /> : <></>;
}

function Typing(props: { layout: KeyboardLayout }) {
  const romanRule = useMemo(() => loadPresetRuleRoman(props.layout), [props.layout]);
  const words = [
    new MixedText("お,を,ひ,く", "尾,を,引,く"),
    new MixedText("こん,とん", "混,沌"),
    new MixedText("がっ,こう", "学,校"),
    new MixedText("a,か,ら,@", "a,か,ら,@"),
  ];
  const [automatons] = useState(
    words.map((w) =>
      new MixedTextAutomaton(
        romanRule.build(w.kanaText),
        w,
      )
    )
  );
  const [index, setIndex] = useState(0);
  const [lastInputKey, setLastInputKey] = useState<
    InputStroke | undefined
  >();
  useEffect(() => {
    return activate(window, (e) => {
      setLastInputKey(e.input);
      const result = automatons[index].base.input(e);
      if (result.isFinished) {
        setIndex((current) => {
          const newIndex = (current + 1) % automatons.length;
          automatons[newIndex].base.reset();
          return newIndex;
        });
      }
    });
  }, [index, automatons]);
  const automaton = automatons[index];

  return (
    <>
      <h1>
        <span style={{ color: "gray" }}>{automaton.finishedMixedSubstr}</span>{" "}
        {automaton.pendingMixedSubstr}
      </h1>
      <h1>
        <span style={{ color: "gray" }}>{automaton.base.finishedWord}</span>{" "}
        {automaton.base.pendingWord}
      </h1>
      <h1>
        <span style={{ color: "gray" }}>{automaton.base.finishedRoman}</span>{" "}
        {automaton.base.pendingRoman}
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
