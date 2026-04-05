import type { Automaton, InputEvent, InputStroke, KeyboardLayout } from "emiel";
import { activate, detectKeyboardLayout, loadPresetRuleRoman, VirtualKeys } from "emiel";
import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

function App() {
  const [layout, setLayout] = useState<KeyboardLayout | undefined>();
  useEffect(() => {
    detectKeyboardLayout(window).then(setLayout).catch(console.error);
  }, []);
  return layout ? <Typing layout={layout} /> : <></>;
}

/**
 * Rule.backspaces + onBackspace オプションを使った例。
 *
 * Rule はデフォルトで VirtualKeys.Backspace 単独打鍵を backspace として扱うため、
 * 呼び出し側で Backspace キーを特別扱いする必要がない。Automaton.input(e) に
 * 普通に InputEvent を渡すだけで、Backspace キー押下時は result.isBack === true になり
 * onBackspace ハンドラが発火する。
 *
 * naginata 式のように U キーを backspace として扱いたい場合は、Rule 側の
 * `backspaces` に追加定義することで、同じハンドラで反応させられる。
 */
function Typing(props: { layout: KeyboardLayout }) {
  const romanRule = useMemo(() => loadPresetRuleRoman(props.layout), [props.layout]);
  const words = useMemo(() => ["おをひく", "こんとん", "がっこう", "aから@"], []);
  // React の state 更新より後にハンドラから参照したいので ref を併用する
  const failedInputsRef = useRef<InputEvent[]>([]);
  const [failedInputs, setFailedInputs] = useState<InputEvent[]>([]);
  const [index, setIndex] = useState(0);
  const [lastInputKey, setLastInputKey] = useState<InputStroke | undefined>();

  // onBackspace ハンドラ:
  //   - 蓄積されたミス入力があれば 1 つ pop
  //   - ゲームルール次第で automaton.back() を呼んで成功ストロークを巻き戻すことも可能
  const onBackspace = (_a: Automaton) => {
    if (failedInputsRef.current.length > 0) {
      failedInputsRef.current = failedInputsRef.current.slice(0, -1);
      setFailedInputs([...failedInputsRef.current]);
    }
  };

  const automatons = useMemo(
    () => words.map((w) => romanRule.build(w, { onBackspace })),
    [romanRule, words],
  );
  const automaton = automatons[index];

  useEffect(() => {
    return activate(window, (e) => {
      setLastInputKey(e.input);
      // 通常入力: testInput で結果だけ確認し、failedInputs 状態に応じて apply する
      const [result, apply] = automaton.testInput(e);
      if (result.isIgnored) {
        return;
      }
      if (result.isBack) {
        // Backspace キー (Rule 側にデフォルトで登録) の場合はここに来る。
        // apply() を呼ぶと onBackspace ハンドラが発火する。
        apply();
        return;
      }
      if (failedInputsRef.current.length > 0) {
        // すでにミス中は以降も強制 failed 扱い
        failedInputsRef.current = [...failedInputsRef.current, e];
        setFailedInputs([...failedInputsRef.current]);
        return;
      }
      if (result.isFailed) {
        failedInputsRef.current = [...failedInputsRef.current, e];
        setFailedInputs([...failedInputsRef.current]);
        return;
      }
      apply();
      if (result.isFinished) {
        automaton.reset();
        failedInputsRef.current = [];
        setFailedInputs([]);
        setIndex((current) => (current + 1) % words.length);
      }
    });
  }, [automaton, words]);

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
