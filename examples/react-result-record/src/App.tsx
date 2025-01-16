import { Automaton, detectKeyboardLayout, KeyboardLayout, loadPresetRuleRoman } from "emiel";
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { Record, WordRecordValue } from "./Record";
import { Typing } from "./Typing";

function App() {
  const [layout, setLayout] = useState<KeyboardLayout | undefined>();
  useEffect(() => {
    detectKeyboardLayout(window).then(setLayout).catch(console.error);
  }, []);
  return layout ? <TypingRoot layout={layout} /> : <></>;
}

function TypingRoot(props: { layout: KeyboardLayout }) {
  const romanRule = useMemo(() => loadPresetRuleRoman(props.layout), [props.layout]);
  const automatons = useMemo(() => {
    const words = ["おをひく", "こんとん", "がっこう", "aから@"];
    return words.map((w) => {
      return romanRule.build(w);
    })
  }, [props.layout])
  const [wordIndex, setWordIndex] = useState(0);
  const [wordRecords, setWordRecords] = useState<WordRecordValue[]>([]);
  const onWordFinished = (
    a: Automaton,
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
  return wordIndex >= automatons.length ? (
    <Record wordRecords={wordRecords} />
  ) : (
    <Typing
      layout={props.layout}
      automaton={automatons[wordIndex]}
      onWordFinished={onWordFinished}
    />
  )
}

export default App;
