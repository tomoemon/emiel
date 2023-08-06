import "./App.css";
import * as emiel from "emiel";
import { useEffect, useState } from "react";
import { Word } from "./word";

// 表示位置と入力状態を合わせて保持しておく
class PositionedAutomaton extends emiel.Automaton {
  constructor(readonly base: emiel.Automaton, readonly position: number) {
    super(base.word, base.startNode);
  }
}

// 繰り返し次のワードを生成するジェネレータ
const wordGen = (function* wordGenerator(): Generator<string> {
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
const initialWords = [...Array(3)].map((_) => wordGen.next().value);

function App() {
  const [layout, setLayout] = useState<emiel.KeyboardLayout | undefined>();
  useEffect(() => {
    emiel.detectKeyboardLayout(window).then(setLayout);
  }, []);
  return layout ? <Typing layout={layout} /> : <></>;
}

function Typing(props: { layout: emiel.KeyboardLayout }) {
  const [selector, setSelector] = useState(
    new emiel.Selector(
      initialWords.map(
        (w, i) =>
          new PositionedAutomaton(emiel.rule.getRoman(props.layout).build(w), i)
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
          const newAutomaton = new PositionedAutomaton(
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
        {[...selector.automatons]
          .sort((a, b) => a.position - b.position)
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
