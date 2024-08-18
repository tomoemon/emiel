import "./App.css";
import * as emiel from "emiel";
import { useEffect, useMemo, useState } from "react";
import { Typing } from "./Typing";
import { Record, WordRecordValue } from "./Record";

function App() {
  const [layout, setLayout] = useState<emiel.KeyboardLayout | undefined>();
  useEffect(() => {
    emiel.keyboard.detect(window).then(setLayout);
  }, []);
  const automatons = useMemo(() => {
    const words = ["おをひく", "こんとん", "がっこう", "aから@"];
    return words.map((w) => {
      return emiel.rule.getRoman(layout).build(w);
    })
  }, [layout])
  const [wordIndex, setWordIndex] = useState(0);
  const [wordRecords, setWordRecords] = useState<WordRecordValue[]>([]);
  const onWordFinished = (
    a: emiel.Automaton,
    displayedAt: Date,
  ) => {
    setWordRecords((wordRecords) => [
      ...wordRecords,
      {
        automaton: a,
        displayedAt,
        firstInputtedAt: a.histories[0].event.timestamp,
        finishedAt:
          a.histories[a.histories.length - 1].event.timestamp,
      },
    ]);
    setWordIndex((current) => {
      return current + 1;
    });
  };
  return layout ? (
    wordIndex >= automatons.length ? (
      <Record wordRecords={wordRecords} />
    ) : (
      <Typing
        layout={layout}
        automaton={automatons[wordIndex]}
        onWordFinished={onWordFinished}
      />
    )
  ) : (
    <></>
  );
}

export default App;
