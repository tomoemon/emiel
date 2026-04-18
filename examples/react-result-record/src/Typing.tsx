import * as emiel from "emiel";
import { useEffect, useState } from "react";
import "./App.css";

export function Typing(props: {
  layout: emiel.KeyboardLayout;
  automaton: emiel.Automaton;
  onWordFinished: (a: emiel.Automaton, displayedAt: DOMHighResTimeStamp) => void;
}) {
  const [lastInputKey, setLastInputKey] = useState<emiel.InputStroke | undefined>();
  const automaton = props.automaton;
  useEffect(() => {
    const wordDisplayedAt = performance.now();
    return emiel.activate(window, (e) => {
      setLastInputKey(e.input);
      const result = automaton.input(e);
      if (result.isFinished) {
        props.onWordFinished(automaton, wordDisplayedAt);
      }
    });
  }, [automaton]);
  const view = automaton.currentView();
  return (
    <>
      <h1>
        <span style={{ color: "gray" }}>{view.finishedWord}</span> {view.pendingWord}
      </h1>
      <h1>
        <span style={{ color: "gray" }}>{view.finishedRoman}</span> {view.pendingRoman}
      </h1>
      <h2>
        Miss: <code>{automaton.eventsView().failedCount}</code>
      </h2>
      <h2>
        Key:{" "}
        <code style={{ border: "1px solid gray", padding: "0.2rem" }}>
          {lastInputKey ? lastInputKey.key.toString() : ""}
        </code>
      </h2>
    </>
  );
}
