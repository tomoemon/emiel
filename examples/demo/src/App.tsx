import "./App.css";
import * as emiel from "../../../src/index";
import { useEffect, useState } from "react";

function App() {
  const words = ["さいりうむ", "しょうがっこう", "すいせいのGUNDAM"];
  const automatons = words.map((w) =>
    emiel.buildAutomaton(emiel.rules.roman, w)
  );
  let wordIndex = 0;
  const [guide, setGuide] = useState(
    new emiel.DefaultGuide(automatons[wordIndex])
  );
  useEffect(() => {
    const deactivate = emiel.activate(window, (e) => {
      console.log(e);
      const result = automatons[wordIndex].input(e);
      console.log(result);
      console.log(automatons[wordIndex].currentNode);
      if (result.isFinished) {
        wordIndex = (wordIndex + 1) % automatons.length;
        automatons[wordIndex].reset();
      }
      setGuide(new emiel.DefaultGuide(automatons[wordIndex]));
    });
    return deactivate;
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
