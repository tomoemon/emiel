import { activate, Automaton, detectKeyboardLayout, InputEvent, InputResult, InputStroke, Inputtable, KeyboardLayout, loadPresetRuleRoman, Selector, VirtualKeys } from "emiel";
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

class PositionAutomaton implements Inputtable {
  constructor(readonly base: Automaton, readonly position: number) {
  }
  input(stroke: InputEvent): InputResult {
    return this.base.input(stroke);
  }
  reset(): void {
    this.base.reset();
  }
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
          new PositionAutomaton(
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
      selector.input(e, {
        finished: (a) => {
          console.log("finished", a);
          const newAutomaton =
            new PositionAutomaton(
              romanRule.build(wordGen.next().value),
              a.position
            );
          setSelector((current) => current.replaced(a, newAutomaton));
        },
        succeeded: (a) => {
          console.log("succeeded", a);
        },
        failed: (a) => {
          console.log("failed", a);
        },
      });
    });
  }, [selector]);

  return (
    <>
      <ul style={{ display: "flex", gap: "2rem", listStyle: "none" }}>
        {[...selector.items]
          .sort((a, b) => a.position - b.position)
          .map((a, i) => (
            <li key={a.base.word + i.toString()}>
              <Word automaton={a.base} />
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
