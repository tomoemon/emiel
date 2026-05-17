import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import type { Automaton, KeyboardLayout, Rule } from "emiel";
import {
  build,
  createDirectInputRule,
  loadPresetKeyboardLayoutAstarte,
  loadPresetKeyboardLayoutColemak,
  loadPresetKeyboardLayoutColemakDh,
  loadPresetKeyboardLayoutDvorak,
  loadPresetKeyboardLayoutEucalyn,
  loadPresetKeyboardLayoutOnishi,
  loadPresetKeyboardLayoutQwertyJis,
  loadPresetKeyboardLayoutQwertyUs,
  loadPresetKeyboardLayoutTomisukeJis,
  loadPresetRuleAsuka123,
  loadPresetRuleAsuka290,
  loadPresetRuleAzikRomantable,
  loadPresetRuleJisKana,
  loadPresetRuleNaginatashikiV15,
  loadPresetRuleNicola,
  loadPresetRuleRoman,
  loadPresetRuleShingeta,
  loadPresetRuleTsuki2_263,
  logging,
} from "emiel";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { TypingGraph } from "./typingGraph";

logging.enable("keyboard.*", "automaton.*");

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
cytoscape.use(dagre);

const rules: { name: string; load: (layout: KeyboardLayout) => Rule }[] = [
  { name: "ローマ字", load: (layout) => loadPresetRuleRoman(layout) },
  { name: "JISかな", load: () => loadPresetRuleJisKana() },
  { name: "NICOLA", load: () => loadPresetRuleNicola() },
  { name: "薙刀式", load: () => loadPresetRuleNaginatashikiV15() },
  { name: "飛鳥123", load: () => loadPresetRuleAsuka123() },
  { name: "飛鳥290", load: () => loadPresetRuleAsuka290() },
  { name: "AZIK", load: (layout) => loadPresetRuleAzikRomantable(layout) },
  { name: "新下駄", load: () => loadPresetRuleShingeta() },
  { name: "月2-263", load: () => loadPresetRuleTsuki2_263() },
];

const layouts: { name: string; load: () => KeyboardLayout }[] = [
  { name: "QWERTY JIS", load: loadPresetKeyboardLayoutQwertyJis },
  { name: "QWERTY US", load: loadPresetKeyboardLayoutQwertyUs },
  { name: "Dvorak", load: loadPresetKeyboardLayoutDvorak },
  { name: "Colemak", load: loadPresetKeyboardLayoutColemak },
  { name: "Colemak DH", load: loadPresetKeyboardLayoutColemakDh },
  { name: "大西配列", load: loadPresetKeyboardLayoutOnishi },
  { name: "eucalyn", load: loadPresetKeyboardLayoutEucalyn },
  { name: "Astarte", load: loadPresetKeyboardLayoutAstarte },
  { name: "とみすけ JIS", load: loadPresetKeyboardLayoutTomisukeJis },
];

const initialWordsText = "じょをひく しるため しょうがっこう";

function App() {
  // 操作中の入力値（適用ボタンを押すまで反映されない）
  const [draftRuleIndex, setDraftRuleIndex] = useState(0);
  const [draftLayoutIndex, setDraftLayoutIndex] = useState(0);
  const [draftWordsText, setDraftWordsText] = useState(initialWordsText);

  // 適用済みの値（適用ボタンを押したタイミングで draft を反映する）
  const [applied, setApplied] = useState({
    ruleIndex: 0,
    layoutIndex: 0,
    wordsText: initialWordsText,
  });

  const [wordIndex, setWordIndex] = useState(0);
  // 入力完了ごとに増やすカウンタ。単語が 1 つだけで wordIndex が変わらない場合でも
  // automaton を作り直してループさせるために使う
  const [round, setRound] = useState(0);
  const [automaton, setAutomaton] = useState<Automaton | undefined>(undefined);

  const layout = useMemo(() => layouts[applied.layoutIndex].load(), [applied.layoutIndex]);
  // 英字・記号を含むワードにも対応できるよう、直接入力ルールを合成する
  const rule = useMemo(
    () => rules[applied.ruleIndex].load(layout).merge(createDirectInputRule(layout)),
    [applied.ruleIndex, layout],
  );
  const words = useMemo(
    () => applied.wordsText.trim().split(/\s+/).filter(Boolean),
    [applied.wordsText],
  );

  // rule / layout / 単語が変わったら出題位置を先頭へ戻す（打鍵状態リセット）
  useEffect(() => {
    setWordIndex(0);
    setRound(0);
  }, [rule, words]);

  // automaton を再構築する。新しい automaton インスタンスへの差し替えが打鍵状態リセットになる
  useEffect(() => {
    const word = words[wordIndex];
    if (word !== undefined) {
      setAutomaton(build(rule, word));
    } else {
      setAutomaton(undefined);
    }
  }, [rule, words, wordIndex, round]);

  const onFinished = useCallback(() => {
    setWordIndex((i) => (words.length > 0 ? (i + 1) % words.length : 0));
    setRound((r) => r + 1);
  }, [words.length]);

  // 単語が入力済みで、かつ draft が適用済みの値から変更されている場合のみ適用できる
  const isDirty =
    draftRuleIndex !== applied.ruleIndex ||
    draftLayoutIndex !== applied.layoutIndex ||
    draftWordsText !== applied.wordsText;
  const canApply = draftWordsText.trim().length > 0 && isDirty;
  const apply = () => {
    if (!canApply) {
      return;
    }
    setApplied({
      ruleIndex: draftRuleIndex,
      layoutIndex: draftLayoutIndex,
      wordsText: draftWordsText,
    });
  };

  return (
    <>
      <div className="controls">
        <label>
          入力ルール{" "}
          <select
            value={draftRuleIndex}
            onChange={(e) => setDraftRuleIndex(Number(e.target.value))}
          >
            {rules.map((r, i) => (
              <option key={r.name} value={i}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          キーボードレイアウト{" "}
          <select
            value={draftLayoutIndex}
            onChange={(e) => setDraftLayoutIndex(Number(e.target.value))}
          >
            {layouts.map((l, i) => (
              <option key={l.name} value={i}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label className="words-field">
          <input
            type="text"
            value={draftWordsText}
            onChange={(e) => setDraftWordsText(e.target.value)}
            onKeyDown={(e) => {
              // IME 変換確定の Enter は除外する
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                apply();
              }
            }}
          />
          <button type="button" onClick={apply} disabled={!canApply}>
            適用
          </button>
        </label>
      </div>
      {automaton ? (
        <TypingGraph automaton={automaton} onFinished={onFinished}></TypingGraph>
      ) : (
        <>単語を入力してください</>
      )}
    </>
  );
}

export default App;
