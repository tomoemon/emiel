import "./App.css";
import * as emiel from "../../../src/index";
import { useEffect, useState } from "react";

const layout = emiel.keyboard.get("qwerty-jis");

function App() {
  const words = ["おをひく", "こんとん", "がっこう", "aから@"];
  const automatons = words.map((w) =>
    emiel.build(emiel.rule.getRoman(layout), w)
  );
  let wordIndex = 0;
  const [guide, setGuide] = useState(
    new emiel.DefaultGuide(layout, automatons[wordIndex])
  );
  useEffect(() => {
    return emiel.activate(window, (e) => {
      const result = automatons[wordIndex].input(e);
      if (result.isFinished) {
        wordIndex = (wordIndex + 1) % automatons.length;
        automatons[wordIndex].reset();
      }
      setGuide(new emiel.DefaultGuide(layout, automatons[wordIndex]));
    });
  }, []);

  return (
    <>
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
