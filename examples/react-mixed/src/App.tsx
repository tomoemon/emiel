import "./App.css";
import * as emiel from "../../../src/index";
import { useEffect, useState } from "react";

const layout = emiel.keyboard.get("qwerty-jis");

function App() {
  const words = [
    { kana: "お,を,ひ,く".split(","), mixed: "尾,を,引,く".split(",") },
    { kana: "こん,とん".split(","), mixed: "混,沌".split(",") },
    {
      kana: "がっ,こう".split(","),
      mixed: "学,校".split(","),
    },
    {
      kana: "a,か,ら,@".split(","),
      mixed: "a,か,ら,@".split(","),
    },
  ];
  const automatons = words.map((w) =>
    emiel.buildMixed(emiel.rule.get("roman", layout), w.kana, w.mixed)
  );
  let wordIndex = 0;
  const [guide, setGuide] = useState(
    new emiel.DefaultMixedGuide(layout, automatons[wordIndex])
  );
  useEffect(() => {
    const deactivate = emiel.activate(window, (e) => {
      const result = automatons[wordIndex].input(e);
      if (result.isFinished) {
        wordIndex = (wordIndex + 1) % automatons.length;
        automatons[wordIndex].reset();
      }
      setGuide(new emiel.DefaultMixedGuide(layout, automatons[wordIndex]));
    });
    return deactivate;
  }, []);

  return (
    <>
      <h1>
        <span style={{ color: "gray" }}>{guide.finishedMixedSubstr}</span>{" "}
        {guide.pendingMixedSubstr}
      </h1>
      <h1>
        <span style={{ color: "gray" }}>{guide.finishedWordSubstr}</span>{" "}
        {guide.pendingWordSubstr}
      </h1>
      <h1>
        <span style={{ color: "gray" }}>{guide.finishedKeys}</span>{" "}
        {guide.pendingKeys}
      </h1>
    </>
  );
}

export default App;
