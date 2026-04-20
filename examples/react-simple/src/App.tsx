import type { InputStroke, KeyboardLayout } from "emiel";
import {
  activate,
  build,
  createDirectInputRule,
  detectKeyboardLayout,
  loadPresetRuleRoman,
  logging,
} from "emiel";
import { useEffect, useMemo, useState } from "react";
import "./App.css";

logging.enable("keyboard.*", "automaton.*");

function App() {
  const [layout, setLayout] = useState<KeyboardLayout | undefined>();
  useEffect(() => {
    detectKeyboardLayout(window).then(setLayout).catch(console.error);
  }, []);
  return layout ? <Typing layout={layout} /> : <></>;
}

const words = ["おをひく", "こんとん", "がっこう", "aから@"];

function Typing(props: { layout: KeyboardLayout }) {
  // loadPresetRuleRoman は「ローマ字 → かな変換」だけの素の Rule を返す。
  // words に英字・記号（例: "aから@"）が含まれる場合は、直接入力 Rule を
  // createDirectInputRule(layout) で作って merge する必要がある。
  const romanRule = useMemo(
    () => loadPresetRuleRoman(props.layout).merge(createDirectInputRule(props.layout)),
    [props.layout],
  );
  const [automatons] = useState(
    words.map((w) => {
      return build(romanRule, w);
    }),
  );
  const [wordIndex, setWordIndex] = useState(0);
  const [lastInputKey, setLastInputKey] = useState<InputStroke | undefined>();
  useEffect(() => {
    return activate(window, (e) => {
      setLastInputKey(e.input);
      const result = automatons[wordIndex].input(e);
      if (result.isFinished) {
        automatons[wordIndex].reset();
        setWordIndex((current) => (current + 1) % words.length);
      }
    });
  }, [wordIndex, automatons]);
  const view = automatons[wordIndex].currentView();
  return (
    <>
      <h1>
        <span style={{ color: "gray" }}>{view.finishedWord}</span> {view.pendingWord}
      </h1>
      <h1>
        <span style={{ color: "gray" }}>{view.finishedRoman}</span> {view.pendingRoman}
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
