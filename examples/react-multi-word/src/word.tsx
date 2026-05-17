import type * as emiel from "emiel";

export function Word(props: { automaton: emiel.Automaton }) {
  console.log("Word", props.automaton.word);
  const view = props.automaton.currentView();
  return (
    <div
      style={{
        border: "2px solid #888",
        paddingLeft: "3rem",
        paddingRight: "3rem",
      }}
    >
      <h2>
        <span style={{ color: "gray" }}>{view.finishedWord}</span> {view.pendingWord}
      </h2>
      <h2>
        <span style={{ color: "gray" }}>{view.finishedRoman}</span> {view.pendingRoman}
      </h2>
    </div>
  );
}
