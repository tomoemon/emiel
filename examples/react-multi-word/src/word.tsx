import * as emiel from "../../../src/index";

export function Word(props: {
  event?: emiel.InputEvent;
  guide: emiel.DefaultGuide;
  layout: emiel.KeyboardLayout;
  index: number;
}) {
  console.log("Word", props.guide.automaton.word);
  const guide = props.guide;
  return (
    <div
      style={{
        border: "2px solid yellow",
        paddingLeft: "3rem",
        paddingRight: "3rem",
      }}
    >
      <h2>
        <span style={{ color: "gray" }}>{guide.finishedWordSubstr}</span>{" "}
        {guide.pendingWordSubstr}
      </h2>
      <h2>
        <span style={{ color: "gray" }}>{guide.finishedKeys}</span>{" "}
        {guide.pendingKeys}
      </h2>
    </div>
  );
}
