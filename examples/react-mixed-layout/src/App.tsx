import type { InputStroke } from "emiel";
import {
  activate,
  build,
  createDirectInputRule,
  loadPresetKeyboardLayoutDvorak,
  loadPresetKeyboardLayoutQwertyJis,
  loadPresetRuleRoman,
  logging,
} from "emiel";
import { useEffect, useMemo, useState } from "react";
import "./App.css";

logging.enable("keyboard.*", "automaton.*");

const words = ["おをひく", "apple", "docomoとau"];

function App() {
  const rule = useMemo(() => {
    // ローマ字 → かな変換は Qwerty JIS 配列で物理キーに解決する。
    const kanaLayout = loadPresetKeyboardLayoutQwertyJis();
    // 直接入力（英字・記号）は Dvorak 配列で物理キーに解決する。
    const alphaLayout = loadPresetKeyboardLayoutDvorak();
    return loadPresetRuleRoman(kanaLayout).merge(createDirectInputRule(alphaLayout));
  }, []);
  const [automatons] = useState(words.map((w) => build(rule, w)));
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
      <p>かな: Qwerty JIS ローマ字 / 英字: Dvorak</p>
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
