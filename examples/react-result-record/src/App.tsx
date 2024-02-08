import "./App.css";
import * as emiel from "emiel";
import { useEffect, useState } from "react";
import { Typing } from "./Typing";
import { Record, WordRecordValue } from "./Record";

function App() {
  const [layout, setLayout] = useState<emiel.KeyboardLayout | undefined>();
  useEffect(() => {
    emiel.keyboard.detect(window).then(setLayout);
  }, []);
  const [isFinished, setIsFinished] = useState(false);
  const [wordRecords, setWordRecords] = useState<WordRecordValue[]>([]);
  const onWordFinished = (
    a: emiel.Automaton,
    displayedAt: Date,
    missCount: number
  ) => {
    setWordRecords([
      ...wordRecords,
      {
        automaton: a,
        displayedAt,
        firstInputtedAt: a.succeededInputs[0].event.timestamp,
        finishedAt:
          a.succeededInputs[a.succeededInputs.length - 1].event.timestamp,
        missCount: missCount,
      },
    ]);
  };
  return layout ? (
    isFinished ? (
      <Record wordRecords={wordRecords} />
    ) : (
      <Typing
        layout={layout}
        onWordFinished={onWordFinished}
        onFinished={() => setIsFinished(true)}
      />
    )
  ) : (
    <></>
  );
}

export default App;
