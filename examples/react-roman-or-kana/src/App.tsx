import type { Automaton, InputEvent, InputStroke, KeyboardLayout, Rule } from "emiel";
import {
  activate,
  build,
  detectKeyboardLayout,
  loadPresetRuleJisKana,
  loadPresetRuleRoman,
  VirtualKeys,
} from "emiel";
import { useEffect, useMemo, useState } from "react";
import "./App.css";

type ActiveKey = "roman" | "kana";
const ALL_ACTIVES: ReadonlySet<ActiveKey> = new Set(["roman", "kana"]);

// 1 word あたり roman / kana 2 つの automaton を保持し、
// どちらがまだ候補として active かを immutable な Set で管理する。
type WordCandidates = {
  roman: Automaton;
  kana: Automaton;
  actives: ReadonlySet<ActiveKey>;
};

function createCandidates(word: string, romanRule: Rule, kanaRule: Rule): WordCandidates {
  return {
    roman: build(romanRule, word),
    kana: build(kanaRule, word),
    actives: ALL_ACTIVES,
  };
}

function resetCandidates(c: WordCandidates): WordCandidates {
  c.roman.reset();
  c.kana.reset();
  return { ...c, actives: ALL_ACTIVES };
}

function inputCandidates(
  c: WordCandidates,
  e: InputEvent,
): {
  next: WordCandidates;
  succeeded: Automaton[];
  finished: Automaton[];
  failed: Automaton[];
} {
  const succeeded: Automaton[] = [];
  const finished: Automaton[] = [];
  const failed: Automaton[] = [];
  const ignored: Automaton[] = [];
  const newActives = new Set<ActiveKey>();
  for (const key of c.actives) {
    const aut = c[key];
    const result = aut.input(e);
    if (result.isSucceeded) {
      succeeded.push(aut);
      if (result.isFinished) {
        finished.push(aut);
      } else {
        newActives.add(key);
      }
    } else if (result.isFailed) {
      failed.push(aut);
    } else if (result.isIgnored) {
      ignored.push(aut);
    }
  }
  if (succeeded.length > 0) {
    failed.forEach((v) => v.reset());
    ignored.forEach((v) => v.reset());
    return { next: { ...c, actives: newActives }, succeeded, finished, failed };
  }
  return { next: c, succeeded, finished, failed };
}

function App() {
  const [layout, setLayout] = useState<KeyboardLayout | undefined>();
  useEffect(() => {
    detectKeyboardLayout(window).then(setLayout).catch(console.error);
  }, []);
  return layout ? <Typing layout={layout} /> : <></>;
}

function Typing(props: { layout: KeyboardLayout }) {
  const words = ["おをひく", "こんとん", "がっこう", "aから@"];
  const romanRule = useMemo(() => loadPresetRuleRoman(props.layout), [props.layout]);
  const kanaRule = useMemo(() => loadPresetRuleJisKana(props.layout), [props.layout]);
  const [selectors, setSelectors] = useState<WordCandidates[]>(() =>
    words.map((w) => createCandidates(w, romanRule, kanaRule)),
  );
  const [lastInputKey, setLastInputKey] = useState<InputStroke | undefined>();
  const [wordIndex, setWordIndex] = useState(0);
  useEffect(() => {
    return activate(window, (e) => {
      setLastInputKey(e.input);
      if (e.input.key === VirtualKeys.Escape) {
        const reset = resetCandidates(selectors[wordIndex]);
        setSelectors((prev) => prev.map((c, i) => (i === wordIndex ? reset : c)));
        return;
      }
      const { next, succeeded, finished, failed } = inputCandidates(selectors[wordIndex], e);
      succeeded.forEach((a) => {
        console.log("succeeded", a);
      });
      failed.forEach((a) => {
        console.log("failed", a);
      });
      // 次 word に遷移する場合、現在 word の state は next（絞り込み後）のままにしておき、
      // 次 word 側のみ reset して両方 active な状態で再スタートさせる。
      if (finished.length > 0) {
        finished.forEach((a) => console.log("finished", a));
        const newWordIndex = (wordIndex + 1) % words.length;
        const nextReset = resetCandidates(selectors[newWordIndex]);
        setSelectors((prev) =>
          prev.map((c, i) => {
            if (i === wordIndex) return next;
            if (i === newWordIndex) return nextReset;
            return c;
          }),
        );
        setWordIndex(newWordIndex);
      } else {
        setSelectors((prev) => prev.map((c, i) => (i === wordIndex ? next : c)));
      }
    });
  }, [wordIndex, selectors, words.length]);

  const wordCandidates = selectors[wordIndex];
  // getFinishedWord() / getPendingWord() は word ベース表示で roman/kana どちらから
  // 取っても同一結果なので、課題文表示は常に roman 側から取得する。
  const displayAutomaton = wordCandidates.roman;
  const romanAutomaton = wordCandidates.roman;
  const kanaAutomaton = wordCandidates.kana;
  return (
    <>
      <h1>
        {/* 課題文かな表示 */}
        <span style={{ color: "gray" }}>{displayAutomaton.getFinishedWord()}</span>{" "}
        {displayAutomaton.getPendingWord()}
      </h1>
      {/* ローマ字入力 */}
      <h1>
        <p style={{ fontSize: "1rem" }}>ローマ字入力</p>
        <span style={{ color: "gray" }}>{romanAutomaton.getFinishedRoman()}</span>{" "}
        {romanAutomaton.getPendingRoman()}
      </h1>
      {/* かな入力 */}
      <h1>
        <p style={{ fontSize: "1rem" }}>かな入力</p>
        <span style={{ color: "gray" }}>{kanaAutomaton.getFinishedWord()}</span>{" "}
        {kanaAutomaton.getPendingWord()}
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
