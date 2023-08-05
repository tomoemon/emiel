import "./App.css";
import * as emiel from "../../../src/index";
import { useEffect, useState } from "react";

function App() {
  const [layout, setLayout] = useState<emiel.KeyboardLayout | undefined>();
  useEffect(() => {
    emiel.detectKeyboardLayout(window).then(setLayout);
  }, []);
  return layout ? <Typing layout={layout} /> : <></>;
}

function Typing(props: { layout: emiel.KeyboardLayout }) {
  const layout = props.layout;
  const words = ["おをひく", "こんとん", "がっこう", "aから@"];
  const [automatons] = useState(
    words.map((w) => {
      return emiel.rule.getRoman(layout).build(w);
    })
  );
  const [index, setIndex] = useState(0);
  const [_, setStrokeCount] = useState(0);
  const automaton = automatons[index];
  useEffect(() => {
    return emiel.activate(window, (e) => {
      const result = automaton.input(e);
      if (result.isFinished) {
        automaton.reset();
        setIndex((current) => (current + 1) % words.length);
      }
      // 1打鍵ごとの再レンダリングのため
      setStrokeCount((current) => current + 1);
    });
  }, [index]);
  return (
    <>
      <p style={{ fontSize: "1rem" }}>[{layout.name} KEYBOARD]</p>
      <h1>
        <span style={{ color: "gray" }}>{automaton.finishedWordSubstr}</span>{" "}
        {automaton.pendingWordSubstr}
      </h1>
      <h1>
        <span style={{ color: "gray" }}>{automaton.finishedRomanSubstr}</span>{" "}
        {automaton.pendingRomanSubstr}
      </h1>
    </>
  );
}

export default App;
