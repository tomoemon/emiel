import "./App.css";
import * as emiel from "emiel";
import { useEffect, useState } from "react";

const words = ["おをひく", "こんとん", "がっこう", "aから@"];

export function Typing(props: {
  layout: emiel.KeyboardLayout;
  onWordFinished: (
    a: emiel.Automaton,
    displayedAt: Date,
    missCount: number
  ) => void;
  onFinished: () => void;
}) {
  const [automatons] = useState(
    words.map((w) => {
      return emiel.rule.getRoman(props.layout).build(w);
    })
  );
  const [wordIndex, setWordIndex] = useState(0);
  const [wordDisplayedAt, setWordDisplayedAt] = useState(new Date());
  const [missCount, setMissCount] = useState(0);
  const [lastInputKey, setLastInputKey] = useState<
    emiel.InputStroke | undefined
  >();
  const automaton = automatons[wordIndex];
  useEffect(() => {
    setWordDisplayedAt(new Date());
    return emiel.activate(window, (e) => {
      setLastInputKey(e.input);
      const result = automaton.input(e);
      if (result.isFinished) {
        props.onWordFinished(automaton, wordDisplayedAt, missCount);
        if (wordIndex === words.length - 1) {
          props.onFinished();
        }
        setWordIndex((current) => current + 1);
        setWordDisplayedAt(new Date());
        setMissCount(0);
      }
      if (result.isFailed) {
        setMissCount((current) => current + 1);
      }
    });
  }, [wordIndex]);
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
