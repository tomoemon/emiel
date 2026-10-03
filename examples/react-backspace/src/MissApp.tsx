import type {
  Automaton,
  CurrentView,
  InputEvent,
  InputResult,
  InputStroke,
  KeyboardLayout,
} from "emiel";
import { activate, build, createDirectInputRule, loadPresetRuleRoman } from "emiel";
import { useEffect, useMemo, useState } from "react";

/** Miss*Automaton が共通で持つインターフェース */
export type MissAutomaton = {
  readonly failedInputs: readonly InputEvent[];
  input(stroke: InputEvent): InputResult;
  reset(): void;
  currentView(): CurrentView;
};

/**
 * ミス入力を表示用の文字に変換する。Shift+Space のように layout に定義のない組み合わせでは
 * getCharByKey が例外を投げるので、Shift なしの文字 → キー名の順にフォールバックする。
 */
function failedInputChar(layout: KeyboardLayout, event: InputEvent): string {
  const shifted = event.keyboardState.isAnyKeyDowned(...layout.shiftKeys);
  for (const s of shifted ? [true, false] : [false]) {
    try {
      return layout.getCharByKey(event.input.key, s);
    } catch {
      // 次の候補を試す
    }
  }
  return event.input.key.toString();
}

export function MissApp(props: {
  layout: KeyboardLayout;
  createWrapper: (automaton: Automaton) => MissAutomaton;
}) {
  const { createWrapper } = props;
  const rule = useMemo(
    () => loadPresetRuleRoman(props.layout).merge(createDirectInputRule(props.layout)),
    [props.layout],
  );
  const words = useMemo(() => ["おをひく", "こんとん", "がっこう", "aから@"], []);
  const [index, setIndex] = useState(0);
  const [lastInputKey, setLastInputKey] = useState<InputStroke | undefined>();

  const wrappers = useMemo(
    () => words.map((w) => createWrapper(build(rule, w))),
    [rule, words, createWrapper],
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

  const view = wrapper.currentView();
  return (
    <>
      <h1>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ color: "gray" }}>{view.finishedWord}</div>
          <div
            style={{
              marginLeft: view.finishedWord ? "0.5rem" : "0",
            }}
          >
            {view.pendingWord}
          </div>
        </div>
      </h1>
      <h1>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ color: "gray" }}>{view.finishedRoman}</div>
          <div
            style={{
              marginLeft: view.finishedRoman ? "0.5rem" : "0",
              textAlign: "left",
            }}
          >
            {view.pendingRoman}
            <br />
            <span style={{ color: "#e5484d" }}>
              {wrapper.failedInputs
                .map((f) => failedInputChar(props.layout, f).replace(" ", "_"))
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
