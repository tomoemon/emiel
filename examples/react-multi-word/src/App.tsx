import "./App.css";
import * as emiel from "../../../src/index";
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
  const layout = props.layout;
  const [selector, setSelector] = useState(
    new emiel.Selector(
      initialWords.map(
        (w, i) =>
          new PositionedAutomaton(emiel.rule.getRoman(layout).build(w), i)
      )
    )
  );
  const [_, setSucceededCount] = useState(0);
  useEffect(() => {
    return emiel.activate(window, (e) => {
      console.log("input:", e);
      if (e.input.key === emiel.VirtualKeys.Escape) {
        console.log("reset");
        selector.reset();
        setSucceededCount(0);
        return;
      }
      selector.input(e, {
        finished: (a) => {
          console.log("finished", a);
          const newAutomaton = new PositionedAutomaton(
            emiel.rule.getRoman(layout).build(wordGen.next().value),
            a.position
          );
          setSelector((current) => current.replaced(a, newAutomaton));
        },
        succeeded: (a) => {
          console.log("succeeded", a);
          setSucceededCount((current) => current + 1);
        },
        failed: (a) => {
          console.log("failed", a);
        },
      });
    });
  }, [selector]);

  return (
    <ul style={{ display: "flex", gap: "2rem", listStyle: "none" }}>
      {[...selector.automatons]
        .sort((a, b) => a.position - b.position)
        .map((a, i) => (
          <li key={a.word + i.toString()}>
            <Word
              automaton={a}
              layout={layout}
              index={a.succeededInputs.length}
            />
          </li>
        ))}
    </ul>
  );
}

export default App;
