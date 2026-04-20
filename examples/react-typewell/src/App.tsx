import type { Automaton, KeyboardLayout } from "emiel";
import {
  build,
  createDirectInputRule,
  detectKeyboardLayout,
  loadPresetRuleRoman,
  logging,
} from "emiel";
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import type { WordRecordValue } from "./Record";
import { Record } from "./Record";
import { Typing } from "./Typing";

logging.enable("keyboard.*", "automaton.*");

const LOGICAL_WORDS = ["キャンペーン", "かった", "hello", "pocket", "the Sun"];

function App() {
  const [layout, setLayout] = useState<KeyboardLayout | undefined>();
  useEffect(() => {
    detectKeyboardLayout(window).then(setLayout).catch(console.error);
  }, []);
  return layout ? <TypingRoot layout={layout} /> : <></>;
}

function TypingRoot(props: { layout: KeyboardLayout }) {
  const rule = useMemo(
    () => loadPresetRuleRoman(props.layout).merge(createDirectInputRule(props.layout)),
    [props.layout],
  );
  const automatons = useMemo(() => {
    return LOGICAL_WORDS.map((w, i) => {
      const isLast = i === LOGICAL_WORDS.length - 1;
      return build(rule, isLast ? w : `${w} `);
    });
  }, [rule]);
  const [wordIndex, setWordIndex] = useState(0);
  const [wordRecords, setWordRecords] = useState<WordRecordValue[]>([]);
  const onWordFinished = (a: Automaton, displayedAt: DOMHighResTimeStamp) => {
    const index = wordRecords.length;
    setWordRecords((prev) => [
      ...prev,
      { automaton: a, displayedAt, logicalWord: LOGICAL_WORDS[index] },
    ]);
    setWordIndex((current) => current + 1);
  };
  return wordIndex >= automatons.length ? (
    <Record wordRecords={wordRecords} />
  ) : (
    <Typing
      logicalWords={LOGICAL_WORDS}
      currentIndex={wordIndex}
      automaton={automatons[wordIndex]}
      onWordFinished={onWordFinished}
    />
  );
}

export default App;
