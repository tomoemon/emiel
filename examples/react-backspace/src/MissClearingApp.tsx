import type { InputStroke, KeyboardLayout } from "emiel";
import { activate, backspaceExtension, build, loadPresetRuleRoman, VirtualKeys } from "emiel";
import { useEffect, useMemo, useState } from "react";
import { MissClearingAutomaton } from "./MissClearingAutomaton";

export function MissClearingApp(props: { layout: KeyboardLayout }) {
  const romanRule = useMemo(() => loadPresetRuleRoman(props.layout), [props.layout]);
  const words = useMemo(() => ["おをひく", "こんとん", "がっこう", "aから@"], []);
  const [index, setIndex] = useState(0);
  const [lastInputKey, setLastInputKey] = useState<InputStroke | undefined>();

  const wrappers = useMemo(
    () => words.map((w) => new MissClearingAutomaton(build(romanRule, w).with(backspaceExtension))),
    [romanRule, words],
  );
  const wrapper = wrappers[index];

  useEffect(() => {
    return activate(window, (e) => {
      setLastInputKey(e.input);
      const result = wrapper.input(e);
      if (result.isFinished) {
        wrapper.reset();
        setIndex((current) => (current + 1) % words.length);
      }
    });
  }, [wrapper, words]);

  return (
    <>
      <h1>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ color: "gray" }}>{wrapper.getFinishedWord()}</div>
          <div
            style={{
              marginLeft: wrapper.getFinishedWord() ? "0.5rem" : "0",
            }}
          >
            {wrapper.getPendingWord()}
          </div>
        </div>
      </h1>
      <h1>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ color: "gray" }}>{wrapper.getFinishedRoman()}</div>
          <div
            style={{
              marginLeft: wrapper.getFinishedRoman() ? "0.5rem" : "0",
              textAlign: "left",
            }}
          >
            {wrapper.getPendingRoman()}
            <br />
            <span style={{ color: "yellow" }}>
              {wrapper.failedInputs
                .map((f) =>
                  props.layout
                    .getCharByKey(
                      f.input.key,
                      f.keyboardState.isAnyKeyDowned(VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight),
                    )
                    .replace(" ", "_"),
                )
                .join("")}
            </span>
          </div>
        </div>
      </h1>
      <h2>
        Key:{" "}
        <code style={{ border: "1px solid gray", padding: "0.2rem" }}>
          {lastInputKey ? lastInputKey.key.toString() : ""}
        </code>
      </h2>
    </>
  );
}
