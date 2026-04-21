import * as emiel from "emiel";
import { useEffect, useState } from "react";
import "./App.css";
import type { WordAutomaton } from "./wordAutomaton";

export function Typing(props: { automaton: WordAutomaton; onFinished: () => void }) {
  const { automaton, onFinished } = props;
  const [lastInputKey, setLastInputKey] = useState<emiel.InputStroke | undefined>();
  useEffect(() => {
    return emiel.activate(window, (e) => {
      // keyup ごとの再レンダは不要（表示は keydown で更新済み）
      if (e.input.type === "keydown") setLastInputKey(e.input);
      const result = automaton.input(e);
      if (result.isFinished) onFinished();
    });
    // onFinished は親がインライン関数で渡すため毎レンダ参照が変わる。 automaton の
    // 寿命中は同じ動作で良いのでクロージャに捕まえた初期参照で問題ない。
    // biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
  }, [automaton]);

  const view = automaton.currentView();
  const ranges = automaton.wordRanges();
  const words = automaton.words();
  const currentIndex = automaton.currentWordIndex();
  const finishedLen = view.finishedWord.length;

  return (
    <>
      <h1 style={{ letterSpacing: "0.05em" }}>
        {words.map((w, i) => {
          const r = ranges[i];
          if (i < currentIndex) {
            return (
              <span key={i} style={{ color: "#666" }}>
                {i > 0 ? " " : ""}
                {w}
              </span>
            );
          }
          if (i === currentIndex) {
            const localFinishedLen = Math.max(0, finishedLen - r.start);
            const localFinished = w.slice(0, localFinishedLen);
            const localPending = w.slice(localFinishedLen);
            return (
              <span key={i}>
                {i > 0 ? " " : ""}
                <span style={{ color: "#888" }}>{localFinished}</span>
                <span style={{ color: "#f5a623", textDecoration: "underline" }}>
                  {localPending}
                </span>
              </span>
            );
          }
          return (
            <span key={i}>
              {i > 0 ? " " : ""}
              {w}
            </span>
          );
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
