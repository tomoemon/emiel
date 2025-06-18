import { activate, Automaton, detectKeyboardLayout, InputStroke, KeyboardLayout, loadPresetRuleRoman, Selector, VirtualKeys } from "emiel";
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { Word } from "./word";

// 繰り返し次のワードを生成するジェネレータ
const wordGen = (function* wordGenerator(): Generator<string, string> {
  const words = [
    "こうきょう",
    "こんとん",
    "がっこう",
    "aから@",
    "トイレ",
    "でんしゃ",
    "どうろ",
  ];
  for (let i = 0; ; i++) {
    yield words[i % words.length];
  }
})();

// 初期ワード3つ
const initialWords = Array.from({ length: 3 }, () => wordGen.next().value);

type PositionAutomaton = Automaton & {
  getPosition: () => number;
}

function withPosition(automaton: Automaton, position: number): PositionAutomaton {
  return automaton.with({
    getPosition: () => position,
  });
}


function App() {
  const [layout, setLayout] = useState<KeyboardLayout | undefined>();
  useEffect(() => {
    detectKeyboardLayout(window).then(setLayout).catch(console.error);
  }, []);
  return layout ? <Typing layout={layout} /> : <></>;
}

function Typing(props: { layout: KeyboardLayout }) {
  const romanRule = useMemo(() => loadPresetRuleRoman(props.layout), [props.layout]);
  const [selector, setSelector] = useState(
    new Selector(
      // 各 automaton の metadata として表示位置をもたせる
      initialWords.map(
        (w, i) =>
          withPosition(
            romanRule.build(w),
            i
          )
      )
    )
  );
  const [lastInputKey, setLastInputKey] = useState<
    InputStroke | undefined
  >();
  useEffect(() => {
    return activate(window, (e) => {
      setLastInputKey(e.input);
      console.log("input:", e);
      if (e.input.key === VirtualKeys.Escape) {
        console.log("reset");
        selector.reset();
        return;
      }
      const { finished, succeeded, failed } = selector.input(e);
      finished.forEach((a) => {
        console.log("finished", a);
        const newAutomaton = withPosition(
          romanRule.build(wordGen.next().value),
          a.getPosition()
        );
        setSelector((current) => current.replaced(a, newAutomaton));
      });
      succeeded.forEach((a) => {
        console.log("succeeded", a);
      });
      failed.forEach((a) => {
        console.log("failed", a);
      });
    });
  }, [selector, romanRule]);

  return (
    <>
      <ul style={{ display: "flex", gap: "2rem", listStyle: "none" }}>
        {[...selector.items]
          .sort((a, b) => a.getPosition() - b.getPosition())
          .map((a, i) => (
            <li key={a.word + i.toString()}>
              <Word automaton={a} />
            </li>
          ))}
      </ul>
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
