import type { KeyboardGuide, RuleStroke, StrokeEdge, VirtualKey } from "emiel";
import {
  activate,
  build,
  createDirectInputRule,
  loadPresetKeyboardGuideDirectInput,
  loadPresetKeyboardGuideJisKana,
  loadPresetKeyboardLayoutQwertyJis,
  loadPresetPhysicalKeyboardLayoutJis106,
  loadPresetRuleJisKana,
  placeKeyboardGuide,
} from "emiel";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { KeyboardGuideView } from "./KeyboardGuideView";

const WORDS = [
  "こんにちはHello",
  "せかいWorld",
  "あいうえおabc",
  "タイピングKeyboard",
  "ありがとう!",
];

const KEY_SIZE = { keyWidth: 50, keyHeight: 50, gapX: 6, gapY: 6 };

function ruleStrokeKeys(stroke: RuleStroke): readonly VirtualKey[] {
  return stroke.kind === "single" ? [stroke.key] : stroke.keys;
}

function candidateKeysFromEdges(nextEdges: readonly StrokeEdge[]): Set<VirtualKey> {
  const keys = new Set<VirtualKey>();
  for (const edge of nextEdges) {
    for (const k of ruleStrokeKeys(edge.input)) keys.add(k);
    for (const group of edge.input.requiredModifier.groups) {
      for (const modKey of group.modifiers) keys.add(modKey);
    }
  }
  return keys;
}

function App() {
  const layout = useMemo(() => loadPresetKeyboardLayoutQwertyJis(), []);
  const physicalLayout = useMemo(() => loadPresetPhysicalKeyboardLayoutJis106(), []);
  const rule = useMemo(
    () => loadPresetRuleJisKana().compose(createDirectInputRule(layout)),
    [layout],
  );
  const guideJisKana = useMemo(() => loadPresetKeyboardGuideJisKana(), []);
  const guideDirectInput = useMemo(() => loadPresetKeyboardGuideDirectInput(), []);

  const [wordIndex, setWordIndex] = useState(0);
  const automaton = useMemo(() => build(rule, WORDS[wordIndex]), [rule, wordIndex]);

  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const [missedKeys, setMissedKeys] = useState<ReadonlySet<VirtualKey>>(new Set());
  const missTimersRef = useRef<Map<VirtualKey, number>>(new Map());

  useEffect(() => {
    const off = activate(window, (e) => {
      const result = automaton.input(e);
      if (result.isFailed) {
        const key = e.input.key;
        const prev = missTimersRef.current.get(key);
        if (prev !== undefined) window.clearTimeout(prev);
        const timerId = window.setTimeout(() => {
          missTimersRef.current.delete(key);
          setMissedKeys((m) => {
            const next = new Set(m);
            next.delete(key);
            return next;
          });
        }, 1000);
        missTimersRef.current.set(key, timerId);
        setMissedKeys((m) => new Set(m).add(key));
      }
      if (result.isFinished) {
        setWordIndex((i) => (i + 1) % WORDS.length);
      }
      forceUpdate();
    });
    return () => {
      off();
      for (const id of missTimersRef.current.values()) window.clearTimeout(id);
      missTimersRef.current.clear();
    };
  }, [automaton]);

  const candidateKeys = useMemo(
    () => candidateKeysFromEdges(automaton.currentNode.nextEdges),
    [automaton, automaton.currentNode],
  );

  const currentGuide: KeyboardGuide = useMemo(() => {
    const origins = automaton.getCurrentOriginRules();
    if (origins.length === 0) return guideJisKana;
    const onlyDirectInput = origins.every((r) => r.metadata.name === "directInput");
    return onlyDirectInput ? guideDirectInput : guideJisKana;
  }, [automaton, automaton.currentNode, guideDirectInput, guideJisKana]);

  const placements = useMemo(
    () => placeKeyboardGuide(currentGuide, physicalLayout, layout, KEY_SIZE),
    [currentGuide, physicalLayout, layout],
  );

  return (
    <div style={{ padding: "1rem", fontFamily: "inherit" }}>
      <h1>JIS かな + Qwerty JIS 混在入力</h1>
      <p style={{ color: "#888", marginTop: "0.5em" }}>
        日本語は JIS かな、英数字・記号は Qwerty JIS でそのまま打ちます。次の入力位置に応じて
        キーボードガイドが切り替わります。
      </p>

      <div style={{ fontSize: "1.8em", marginTop: "1em", letterSpacing: "0.05em" }}>
        <span style={{ color: "#888" }}>{automaton.getFinishedWord()}</span>
        <span>{automaton.getPendingWord()}</span>
      </div>

      <div style={{ marginTop: "1.5em" }}>
        <KeyboardGuideView
          placements={placements}
          candidateKeys={candidateKeys}
          missedKeys={missedKeys}
        />
      </div>

      <p style={{ marginTop: "1em", color: "#888", fontSize: "0.9em" }}>
        進行: {wordIndex + 1} / {WORDS.length} — 次のワード: {WORDS[(wordIndex + 1) % WORDS.length]}
      </p>
    </div>
  );
}

export default App;
