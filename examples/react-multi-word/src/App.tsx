import "./App.css";
import * as emiel from "emiel";
import { useEffect, useState } from "react";
import { Word } from "./word";
import { InputEvent } from "../../../dist/types/core/ruleStroke";

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

class PositionAutomaton implements emiel.Inputtable {
  constructor(readonly base: emiel.Automaton, readonly position: number) {
  }
  input(stroke: InputEvent<emiel.VirtualKey>): emiel.InputResult {
    return this.base.input(stroke);
  }
  reset(): void {
    this.base.reset();
  }
}

function App() {
  const [layout, setLayout] = useState<emiel.KeyboardLayout | undefined>();
  useEffect(() => {
    emiel.keyboard.detect(window).then(setLayout).catch(console.error);
  }, []);
  return layout ? <Typing layout={layout} /> : <></>;
}

function Typing(props: { layout: emiel.KeyboardLayout }) {
  const [selector, setSelector] = useState(
    new emiel.Selector(
      // 各 automaton の metadata として表示位置をもたせる
      initialWords.map(
        (w, i) =>
          new PositionAutomaton(
            emiel.rule.getRoman(props.layout).build(w),
            i
          )
      )
    )
  );
  const [lastInputKey, setLastInputKey] = useState<
    emiel.InputStroke | undefined
  >();
  useEffect(() => {
    return emiel.activate(window, (e) => {
      setLastInputKey(e.input);
      console.log("input:", e);
      if (e.input.key === emiel.VirtualKeys.Escape) {
        console.log("reset");
        selector.reset();
        return;
      }
      selector.input(e, {
        finished: (a) => {
          console.log("finished", a);
          const newAutomaton =
            new PositionAutomaton(
              emiel.rule.getRoman(props.layout).build(wordGen.next().value),
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
