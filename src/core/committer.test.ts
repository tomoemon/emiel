import { describe, expect, test } from "vitest";
import { loadJsonRule } from "../impl/jsonRuleLoader";
import { loadPresetKeyboardLayoutQwertyJis } from "../impl/presets";
import {
  loadPresetRuleJisKana,
  loadPresetRuleNaginatashikiV15,
  loadPresetRuleNicola,
  loadPresetRuleRoman,
} from "../impl/presets";
import { build, type Automaton } from "../impl/buildAutomaton";
import { InputEvent, InputStroke } from "./inputEvent";
import { KeyboardState } from "./keyboardState";
import type { Rule } from "./rule";
import { VirtualKeys } from "./virtualKey";

/**
 * テストヘルパ: automaton を指定 Rule で構築して一連の keydown/keyup を流し込む。
 * 各イベントの結果 (InputResult の文字列表現) を返す。
 */
function runInputs(
  rule: Rule,
  word: string,
  events: { key: (typeof VirtualKeys)[keyof typeof VirtualKeys]; type: "keydown" | "keyup" }[],
): { results: string[]; automaton: Automaton } {
  const automaton = build(rule, word);
  const state = new KeyboardState();
  const results: string[] = [];
  for (const ev of events) {
    if (ev.type === "keydown") {
      state.keydown(ev.key);
    } else {
      state.keyup(ev.key);
    }
    const result = automaton.input(
      new InputEvent(new InputStroke(ev.key, ev.type), state, new Date()),
    );
    results.push(result.toString());
  }
  return { results, automaton };
}

describe("StrokeCommitter naginata (ModifierStroke + SimultaneousStroke 混在)", () => {
  const rule = loadPresetRuleNaginatashikiV15(loadPresetKeyboardLayoutQwertyJis());

  test("W 単独押し: き (単キー ModifierStroke)", () => {
    // word="き" のグラフには W 単打の ModifierStroke(empty) しかないため即確定
    const { results, automaton } = runInputs(rule, "き", [
      { key: VirtualKeys.W, type: "keydown" },
      { key: VirtualKeys.W, type: "keyup" },
    ]);
    expect(results[0]).toBe("finished");
    expect(automaton.getFinishedWord()).toBe("き");
  });

  test("Space 先押し → W で ぬ (ModifierStroke(W, [Space]))", () => {
    // word="ぬ" は ModifierStroke(W, requiredModifier=[Space])。Space 先押し必須
    const { results, automaton } = runInputs(rule, "ぬ", [
      { key: VirtualKeys.Space, type: "keydown" },
      { key: VirtualKeys.W, type: "keydown" },
      { key: VirtualKeys.W, type: "keyup" },
      { key: VirtualKeys.Space, type: "keyup" },
    ]);
    expect(results[1]).toBe("finished");
    expect(automaton.getFinishedWord()).toBe("ぬ");
  });

  test("W+J 同時押し (順序不問): ぎ", () => {
    // W+J は SimultaneousStroke([W,J]) (modifier なし)
    const { results: r1, automaton: a1 } = runInputs(rule, "ぎ", [
      { key: VirtualKeys.W, type: "keydown" },
      { key: VirtualKeys.J, type: "keydown" },
      { key: VirtualKeys.W, type: "keyup" },
      { key: VirtualKeys.J, type: "keyup" },
    ]);
    expect(r1[1]).toBe("finished");
    expect(a1.getFinishedWord()).toBe("ぎ");

    // 順序を入れ替えても同じ結果
    const { results: r2, automaton: a2 } = runInputs(rule, "ぎ", [
      { key: VirtualKeys.J, type: "keydown" },
      { key: VirtualKeys.W, type: "keydown" },
      { key: VirtualKeys.J, type: "keyup" },
      { key: VirtualKeys.W, type: "keyup" },
    ]);
    expect(r2[1]).toBe("finished");
    expect(a2.getFinishedWord()).toBe("ぎ");
  });

  test("Space 先押し + A+J 同時押し: ぜ (SimultaneousStroke + requiredModifier)", () => {
    // word="ぜ" は SimultaneousStroke([A,J], requiredModifier=[Space])
    // Space を先押し必須、A と J は順不同で同時押し
    const { automaton } = runInputs(rule, "ぜ", [
      { key: VirtualKeys.Space, type: "keydown" },
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.J, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
      { key: VirtualKeys.J, type: "keyup" },
      { key: VirtualKeys.Space, type: "keyup" },
    ]);
    expect(automaton.isFinished()).toBe(true);
    expect(automaton.getFinishedWord()).toBe("ぜ");
  });

  test("Space 先押し + J+A 同時押し (順序入替): ぜ", () => {
    // A と J は順不同なので J→A でも確定する
    const { automaton } = runInputs(rule, "ぜ", [
      { key: VirtualKeys.Space, type: "keydown" },
      { key: VirtualKeys.J, type: "keydown" },
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.J, type: "keyup" },
      { key: VirtualKeys.A, type: "keyup" },
      { key: VirtualKeys.Space, type: "keyup" },
    ]);
    expect(automaton.isFinished()).toBe(true);
    expect(automaton.getFinishedWord()).toBe("ぜ");
  });
});

describe("StrokeCommitter ModifierStroke (ローマ字互換性)", () => {
  const rule = loadPresetRuleRoman(loadPresetKeyboardLayoutQwertyJis());

  test("a → あ (単打)", () => {
    const { results, automaton } = runInputs(rule, "あ", [
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    expect(results[0]).toBe("finished");
    expect(automaton.getFinishedWord()).toBe("あ");
  });

  test("k + a → か", () => {
    const { results, automaton } = runInputs(rule, "か", [
      { key: VirtualKeys.K, type: "keydown" },
      { key: VirtualKeys.K, type: "keyup" },
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    expect(results[0]).toBe("key_succeeded");
    expect(results[2]).toBe("finished");
    expect(automaton.getFinishedWord()).toBe("か");
  });

  test("a → i で 'あい' 確定 (baseline)", () => {
    const { automaton } = runInputs(rule, "あい", [
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
      { key: VirtualKeys.I, type: "keydown" },
      { key: VirtualKeys.I, type: "keyup" },
    ]);
    expect(automaton.isFinished()).toBe(true);
    expect(automaton.getFinishedWord()).toBe("あい");
  });
});

describe("StrokeCommitter 衝突解決", () => {
  // 同一 currentNode に mod A と sim [A,B] が共存する (いずれも同じ output を生む) ルールを構築。
  // グラフには両方のエッジが載るため、A↓ 時点で sim partial により pending になる。
  const customRule = loadJsonRule({
    extendCommonPrefixEntry: false,
    entries: [
      { input: [{ keys: ["A"] }], output: "X" },
      { input: [{ keys: ["A", "B"] }], output: "X" },
    ],
  });

  test("A↓ → A↑ で mod 単打パスが keyup 救済で確定", () => {
    const { results, automaton } = runInputs(customRule, "X", [
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    expect(results[0]).toBe("pending");
    expect(results[1]).toBe("finished");
    expect(automaton.getFinishedWord()).toBe("X");
  });

  test("A↓ → B↓ で同時押し sim パスが即確定", () => {
    const { results, automaton } = runInputs(customRule, "X", [
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.B, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
      { key: VirtualKeys.B, type: "keyup" },
    ]);
    expect(results[0]).toBe("pending");
    expect(results[1]).toBe("finished");
    expect(automaton.getFinishedWord()).toBe("X");
  });

  test("逆順 B↓ → A↓ でも sim が確定 (順不同)", () => {
    const { results, automaton } = runInputs(customRule, "X", [
      { key: VirtualKeys.B, type: "keydown" },
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.B, type: "keyup" },
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    // B↓ は [A,B] の partial
    expect(results[0]).toBe("pending");
    expect(results[1]).toBe("finished");
    expect(automaton.getFinishedWord()).toBe("X");
  });
});

describe("StrokeCommitter 押しっぱなしモディファイア (nicola)", () => {
  // nicola では LangLeft/LangRight が親指シフトキーとして同時押しに参加する。
  // thumb-shift を押しっぱなしで連続同時押し入力できることを確認する。
  const rule = loadPresetRuleNicola(loadPresetKeyboardLayoutQwertyJis());

  test("nicola 単打エントリ: A 単独押しで単打ルールが確定", () => {
    // nicola の A 単打エントリ (A → う)
    const { automaton } = runInputs(rule, "う", [
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    expect(automaton.isFinished()).toBe(true);
    expect(automaton.getFinishedWord()).toBe("う");
  });

  test("nicola 親指シフト同時押し: Q+LangLeft → ぁ", () => {
    // [Q, LangLeft] は SimultaneousStroke。順不同で確定する
    const { automaton } = runInputs(rule, "ぁ", [
      { key: VirtualKeys.LangLeft, type: "keydown" },
      { key: VirtualKeys.Q, type: "keydown" },
      { key: VirtualKeys.Q, type: "keyup" },
      { key: VirtualKeys.LangLeft, type: "keyup" },
    ]);
    expect(automaton.isFinished()).toBe(true);
    expect(automaton.getFinishedWord()).toBe("ぁ");
  });

  test("nicola 親指シフト同時押し (逆順): Q→LangLeft でも ぁ", () => {
    const { automaton } = runInputs(rule, "ぁ", [
      { key: VirtualKeys.Q, type: "keydown" },
      { key: VirtualKeys.LangLeft, type: "keydown" },
      { key: VirtualKeys.LangLeft, type: "keyup" },
      { key: VirtualKeys.Q, type: "keyup" },
    ]);
    expect(automaton.isFinished()).toBe(true);
    expect(automaton.getFinishedWord()).toBe("ぁ");
  });

  test("nicola 連続シフト非対応: LangLeft 押しっぱで Q→E は ぁり にならず ぁた になる", () => {
    // NICOLA 仕様上、親指シフトを押しっぱなしにして複数キーを順に叩く「連続シフト」は
    // 認められていない。1 回目の同時押し (Q+LangLeft → ぁ) を確定した時点で LangLeft の
    // 同時押し効力は消費され、続く E 単独押しは E 単打ルール (E → た) として確定する。
    const { automaton } = runInputs(rule, "ぁた", [
      { key: VirtualKeys.LangLeft, type: "keydown" },
      { key: VirtualKeys.Q, type: "keydown" },
      { key: VirtualKeys.Q, type: "keyup" },
      { key: VirtualKeys.E, type: "keydown" },
      { key: VirtualKeys.E, type: "keyup" },
      { key: VirtualKeys.LangLeft, type: "keyup" },
    ]);
    expect(automaton.isFinished()).toBe(true);
    expect(automaton.getFinishedWord()).toBe("ぁた");
  });

  test("nicola 単打 W → か", () => {
    // word="か" のグラフには W 単打の ModifierStroke のみが載るため (sim [W,LangLeft] は
    // 別出力 "え" 用) 衝突は発生せず W↓ で即確定する
    const { results, automaton } = runInputs(rule, "か", [
      { key: VirtualKeys.W, type: "keydown" },
      { key: VirtualKeys.W, type: "keyup" },
    ]);
    expect(results[0]).toBe("finished");
    expect(automaton.getFinishedWord()).toBe("か");
  });
});

describe("StrokeCommitter jis_kana (単打 + Shift modifier)", () => {
  const rule = loadPresetRuleJisKana(loadPresetKeyboardLayoutQwertyJis());

  test("Digit3 単打 → あ", () => {
    const { automaton } = runInputs(rule, "あ", [
      { key: VirtualKeys.Digit3, type: "keydown" },
      { key: VirtualKeys.Digit3, type: "keyup" },
    ]);
    expect(automaton.isFinished()).toBe(true);
    expect(automaton.getFinishedWord()).toBe("あ");
  });

  test("Shift+Digit3 → ぁ (ModifierStroke with requiredModifier)", () => {
    const { automaton } = runInputs(rule, "ぁ", [
      { key: VirtualKeys.ShiftLeft, type: "keydown" },
      { key: VirtualKeys.Digit3, type: "keydown" },
      { key: VirtualKeys.Digit3, type: "keyup" },
      { key: VirtualKeys.ShiftLeft, type: "keyup" },
    ]);
    expect(automaton.isFinished()).toBe(true);
    expect(automaton.getFinishedWord()).toBe("ぁ");
  });

  test("Shift 押しっぱなしで Digit3 → Digit4 で ぁぅ 連続入力", () => {
    const { automaton } = runInputs(rule, "ぁぅ", [
      { key: VirtualKeys.ShiftLeft, type: "keydown" },
      { key: VirtualKeys.Digit3, type: "keydown" },
      { key: VirtualKeys.Digit3, type: "keyup" },
      { key: VirtualKeys.Digit4, type: "keydown" },
      { key: VirtualKeys.Digit4, type: "keyup" },
      { key: VirtualKeys.ShiftLeft, type: "keyup" },
    ]);
    expect(automaton.isFinished()).toBe(true);
    expect(automaton.getFinishedWord()).toBe("ぁぅ");
  });
});

describe("StrokeCommitter tentative failure は元キーの keyup でのみ発火", () => {
  const rule = loadPresetRuleNaginatashikiV15(loadPresetKeyboardLayoutQwertyJis());

  test("Space+U は backspace ではなく failed (さ の方が具体的)", () => {
    // naginata "お" = N+Space。Space 先押し後に U を押すと、"さ" (Space+U, keyCount=2)
    // が backspace の U (keyCount=1) より具体的なので failed (ミス入力) になる。
    // tentative failure は U keydown 時点で解消されるため、以降の keyup は ignored。
    const { results } = runInputs(rule, "お", [
      { key: VirtualKeys.Space, type: "keydown" }, // pending (modifier 候補)
      { key: VirtualKeys.U, type: "keydown" }, // failed (Space+U → "さ" がミス入力)
      { key: VirtualKeys.U, type: "keyup" }, // ignored
      { key: VirtualKeys.Space, type: "keyup" }, // ignored (tentative は既に解消済み)
    ]);
    expect(results[0]).toBe("pending");
    expect(results[1]).toBe("failed");
    expect(results[2]).toBe("ignored");
    expect(results[3]).toBe("ignored");
  });

  test("ShiftLeft keydown/keyup は ignored", () => {
    const { results } = runInputs(rule, "お", [
      { key: VirtualKeys.Space, type: "keydown" }, // [0] pending
      { key: VirtualKeys.U, type: "keydown" }, // [1] failed
      { key: VirtualKeys.U, type: "keyup" }, // [2] ignored
      { key: VirtualKeys.Space, type: "keyup" }, // [3] ignored
      { key: VirtualKeys.ShiftLeft, type: "keydown" }, // [4] ignored
      { key: VirtualKeys.ShiftLeft, type: "keyup" }, // [5] ignored
    ]);
    expect(results[4]).toBe("ignored");
    expect(results[5]).toBe("ignored");
  });
});
