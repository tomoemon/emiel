import * as emiel from "emiel";
import { useEffect, useState } from "react";
import "./App.css";

export function Typing(props: {
  logicalWords: string[];
  currentIndex: number;
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
  const currentFinished = view.finishedWord;
  const currentPending = view.pendingWord.trimEnd();

  return (
    <>
      <h1 style={{ letterSpacing: "0.05em" }}>
        {props.logicalWords.map((w, i) => {
          if (i < props.currentIndex) {
            return (
              <span key={i} style={{ color: "#666" }}>
                {i > 0 ? " " : ""}
                {w}
              </span>
            );
          }
          if (i === props.currentIndex) {
            return (
              <span key={i}>
                {i > 0 ? " " : ""}
                <span style={{ color: "#888" }}>{currentFinished}</span>
                <span style={{ color: "#f5a623", textDecoration: "underline" }}>
                  {currentPending}
                </span>
              </span>
            );
          }
          return <span key={i}> {w}</span>;
        })}
      </h1>
      <h2>
        <span style={{ color: "#888" }}>{view.finishedRoman}</span> {view.pendingRoman.trimEnd()}
      </h2>
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
