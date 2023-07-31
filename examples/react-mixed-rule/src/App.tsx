import "./App.css";
import * as emiel from "../../../src/index";
import { useEffect, useState } from "react";

const layout = emiel.keyboard.get("qwerty-jis");

function App() {
  const words = ["おをひく", "こんとん", "がっこう", "aから@"];
  const [selectors] = useState(
    words.map(
      (w) =>
        new emiel.Selector([
          emiel.build(emiel.rule.getRoman(layout), w),
          emiel.build(emiel.rule.getJisKana(layout), w),
        ])
    )
  );
  const [_, setSucceededCount] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  useEffect(() => {
    return emiel.activate(window, (e) => {
      if (e.input.key === emiel.VirtualKeys.Escape) {
        selectors[wordIndex].reset();
        setSucceededCount(0);
        return;
      }
      selectors[wordIndex].input(e, {
        finished: (a) => {
          console.log("finished", a);
          setWordIndex((current) => {
            const newWordIndex = (current + 1) % words.length;
            selectors[newWordIndex].reset();
            return newWordIndex;
          });
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
  }, [wordIndex]);

  const selector = selectors[wordIndex];
  const romanGuide = new emiel.DefaultGuide(layout, selector.automatons[0]);
  const kanaGuide = new emiel.DefaultGuide(layout, selector.automatons[1]);
  return (
    <>
      <h1>
        {/* 課題文かな表示 */}
        <span style={{ color: "gray" }}>
          {selector.activeAutomatons[0].finishedWordSubstr}
        </span>{" "}
        {selector.activeAutomatons[0].pendingWordSubstr}
      </h1>
      {/* ローマ字入力 */}
      <h1>
        <p style={{ fontSize: "1rem" }}>ローマ字入力</p>
        <span style={{ color: "gray" }}>{romanGuide.finishedKeys}</span>{" "}
        {romanGuide.pendingKeys}
      </h1>
      {/* かな入力 */}
      <h1>
        <p style={{ fontSize: "1rem" }}>かな入力</p>
        <span style={{ color: "gray" }}>
          {kanaGuide.finishedWordSubstr}
        </span>{" "}
        {kanaGuide.pendingWordSubstr}
      </h1>
    </>
  );
}

export default App;
