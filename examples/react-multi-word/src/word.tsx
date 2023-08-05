import * as emiel from "../../../src/index";

export function Word(props: { automaton: emiel.Automaton }) {
  console.log("Word", props.automaton.word);
  const automaton = props.automaton;
  return (
    <div
      style={{
        border: "2px solid yellow",
        paddingLeft: "3rem",
        paddingRight: "3rem",
      }}
    >
      <h2>
        <span style={{ color: "gray" }}>{automaton.finishedWordSubstr}</span>{" "}
        {automaton.pendingWordSubstr}
      </h2>
      <h2>
        <span style={{ color: "gray" }}>{automaton.finishedRomanSubstr}</span>{" "}
        {automaton.pendingRomanSubstr}
      </h2>
    </div>
  );
}
