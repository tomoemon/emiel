import type { Automaton, KeyboardLayout } from "emiel";
import { build, createDirectInputRule, detectKeyboardLayout, loadPresetRuleRoman } from "emiel";
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import type { WordRecordValue } from "./Record";
import { Record } from "./Record";
import { Typing } from "./Typing";

function App() {
  const [layout, setLayout] = useState<KeyboardLayout | undefined>();
  useEffect(() => {
    detectKeyboardLayout(window).then(setLayout).catch(console.error);
  }, []);
  return layout ? <TypingRoot layout={layout} /> : <></>;
}

function TypingRoot(props: { layout: KeyboardLayout }) {
  const rule = useMemo(
    () => loadPresetRuleRoman(props.layout).compose(createDirectInputRule(props.layout)),
    [props.layout],
  );
  const automatons = useMemo(() => {
    const words = ["おをひく", "こんとん", "がっこう", "aから@"];
    return words.map((w) => {
      return build(rule, w);
    });
  }, [rule]);
  const [wordIndex, setWordIndex] = useState(0);
  const [wordRecords, setWordRecords] = useState<WordRecordValue[]>([]);
  const onWordFinished = (a: Automaton, displayedAt: DOMHighResTimeStamp) => {
    setWordRecords((wordRecords) => [
      ...wordRecords,
      {
        automaton: a,
        displayedAt,
        firstInputtedAt: a.getFirstSucceededInputTime(),
        finishedAt: a.getLastSucceededInputTime(),
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
  );
}

export default App;
