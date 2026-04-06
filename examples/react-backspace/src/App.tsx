import type { InputEvent, InputStroke, KeyboardLayout } from "emiel";
import { activate, detectKeyboardLayout, loadPresetRuleRoman, VirtualKeys } from "emiel";
import { useEffect, useMemo, useState } from "react";
import "./App.css";

function App() {
  const [layout, setLayout] = useState<KeyboardLayout | undefined>();
  useEffect(() => {
    detectKeyboardLayout(window).then(setLayout).catch(console.error);
  }, []);
  return layout ? <Typing layout={layout} /> : <></>;
}

/**
 * Rule.backspaceStrokes を使った例。
 *
 * Rule はデフォルトで VirtualKeys.Backspace 単独打鍵を backspace として扱うため、
 * 呼び出し側で Backspace キーを特別扱いする必要がない。Automaton.input(e) に
 * 普通に InputEvent を渡すだけで、Backspace キー押下時は result.isBack === true になる。
 *
 * 復旧ロジック (ミス入力 pop / automaton.back() など) は呼び出し側で自由に実装する。
 *
 * naginata 式のように U キーを backspace として扱いたい場合は、Rule 側の
 * `backspaces` に追加定義することで、同じ result.isBack 分岐で反応させられる。
 */
function Typing(props: { layout: KeyboardLayout }) {
  const romanRule = useMemo(() => loadPresetRuleRoman(props.layout), [props.layout]);
  const words = useMemo(() => ["おをひく", "こんとん", "がっこう", "aから@"], []);
  const [failedInputs, setFailedInputs] = useState<InputEvent[]>([]);
  const [index, setIndex] = useState(0);
  const [lastInputKey, setLastInputKey] = useState<InputStroke | undefined>();

  const automatons = useMemo(() => words.map((w) => romanRule.build(w)), [romanRule, words]);
  const automaton = automatons[index];

  useEffect(() => {
    return activate(window, (e) => {
      setLastInputKey(e.input);
      const [result, apply] = automaton.testInput(e);
      if (result.isIgnored) {
        return;
      }
      if (result.isBack) {
        // backspace 発動: 蓄積されたミス入力があれば 1 つ pop する。
        // ゲームルール次第で automaton.back() を呼んで成功ストロークを巻き戻すことも可能。
        setFailedInputs((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
        apply();
        return;
      }
      if (failedInputs.length > 0) {
        // すでにミス中は以降も強制 failed 扱い
        setFailedInputs([...failedInputs, e]);
        return;
      }
      if (result.isFailed) {
        setFailedInputs([...failedInputs, e]);
        return;
      }
      apply();
      if (result.isFinished) {
        automaton.reset();
        setFailedInputs([]);
        setIndex((current) => (current + 1) % words.length);
      }
    });
  }, [automaton, words, failedInputs]);

  return (
    <>
      <h1>
        <div style={{ display: "flex" }}>
          <div style={{ color: "gray" }}>{automaton.getFinishedWord()}</div>
          <div
            style={{
              marginLeft: automaton.getFinishedWord() ? "0.5rem" : "0",
            }}
          >
            {automaton.getPendingWord()}
          </div>
        </div>
      </h1>
      <h1>
        <div style={{ display: "flex" }}>
          <div style={{ color: "gray" }}>{automaton.getFinishedRoman()}</div>
          <div
            style={{
              marginLeft: automaton.getFinishedRoman() ? "0.5rem" : "0",
              textAlign: "left",
            }}
          >
            {automaton.getPendingRoman()}
            <br />
            <span style={{ color: "yellow" }}>
              {failedInputs
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

export default App;
