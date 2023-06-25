import "./App.css";
import * as emiel from "../../../src/index";
import { useEffect, useState } from "react";

function App() {
  const [inputted, setInputted] = useState("");
  const [rest, setRest] = useState("");
  useEffect(() => {
    const rule = emiel.rules.roman;
    const automaton = emiel.buildAutomaton(rule, "おった");
    console.log(automaton);
    const guide = new emiel.ShortestStrokeGuide(automaton);
    setRest(guide.restStrokes.map((s) => s.keys.join("|")).join(""));
    const deactivate = emiel.activate(window, function (e) {
      if (e.input.type === "keyup") return;
      console.log(e);
      const result = automaton.input(e);
      console.log(result);
      console.log(automaton.getCurrentNode());
      setInputted(automaton.succeededInputs.map((s) => s.input.key).join(""));
      setRest(guide.restStrokes.map((s) => s.keys.join("|")).join(""));
    });
    return deactivate;
  }, []);
  return (
    <>
      <h1>Vite + React</h1>
      <p>{inputted}</p>
      <p>{rest}</p>
    </>
  );
}

export default App;
