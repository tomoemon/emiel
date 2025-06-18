import * as emiel from "emiel";

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
        <span style={{ color: "gray" }}>{automaton.getFinishedWord()}</span>{" "}
        {automaton.getPendingWord()}
      </h2>
      <h2>
        <span style={{ color: "gray" }}>{automaton.getFinishedRoman()}</span>{" "}
        {automaton.getPendingRoman()}
      </h2>
    </div>
  );
}
