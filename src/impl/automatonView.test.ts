import { describe, expect, test } from "vitest";
import { InputEvent, InputStroke } from "../core/inputEvent";
import { KeyboardState } from "../core/keyboardState";
import { VirtualKeys } from "../core/virtualKey";
import { build, type Automaton } from "./buildAutomaton";
import { loadJsonRule } from "./jsonRuleLoader";
import { loadPresetKeyboardLayoutQwertyJis, loadPresetRuleRoman } from "./presets";

/**
 * 指定 keydown/keyup 列を automaton に流すヘルパ。
 * 各イベントの timestamp は呼び出し順に 10ms 刻みで単調増加させる（時刻比較を安定させる）。
 */
function runInputs(
  automaton: Automaton,
  events: { key: (typeof VirtualKeys)[keyof typeof VirtualKeys]; type: "keydown" | "keyup" }[],
  startTime: number = 1000,
): void {
  const state = new KeyboardState();
  events.forEach((ev, i) => {
    if (ev.type === "keydown") {
      state.keydown(ev.key);
    } else {
      state.keyup(ev.key);
    }
    automaton.input(new InputEvent(new InputStroke(ev.key, ev.type), state, startTime + i * 10));
  });
}

const simpleRule = () =>
  loadJsonRule({
    entries: [
      { input: [{ keys: ["A"] }], output: "あ" },
      { input: [{ keys: ["B"] }], output: "い" },
    ],
    backspaces: [{ keys: ["U"] }],
  });

describe("currentView", () => {
  const layout = loadPresetKeyboardLayoutQwertyJis();
  const romanRule = loadPresetRuleRoman(layout);

  test("初期状態: finishedWord 空、pendingWord にワード全体", () => {
    const automaton = build(romanRule, "かた");
    const view = automaton.currentView();
    expect(view.finishedWord).toBe("");
    expect(view.pendingWord).toBe("かた");
    expect(view.finishedStroke).toEqual([]);
    expect(view.finishedRoman).toBe("");
  });

  test("部分入力後: currentNode.kanaIndex で分割された word と、確定した edge 列の roman", () => {
    const automaton = build(romanRule, "かた");
    runInputs(automaton, [
      { key: VirtualKeys.K, type: "keydown" },
      { key: VirtualKeys.K, type: "keyup" },
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    const view = automaton.currentView();
    expect(view.finishedWord).toBe("か");
    expect(view.pendingWord).toBe("た");
    expect(view.finishedRoman).toBe("ka");
    expect(view.finishedStroke.length).toBe(2);
  });

  test("pendingStroke/pendingRoman: 最短経路を返す", () => {
    const automaton = build(romanRule, "か");
    const view = automaton.currentView();
    // "か" の最短は "ka"
    expect(view.pendingRoman).toBe("ka");
    expect(view.pendingStroke.length).toBe(2);
  });

  test("ワード完了後: finishedWord=ワード全体、pending 系は空", () => {
    const automaton = build(romanRule, "あ");
    runInputs(automaton, [
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    const view = automaton.currentView();
    expect(view.finishedWord).toBe("あ");
    expect(view.pendingWord).toBe("");
    expect(view.pendingRoman).toBe("");
    expect(view.pendingStroke).toEqual([]);
  });

  test("back() 後: finishedWord が戻り、finishedStroke からも削られる", () => {
    const automaton = build(romanRule, "あい");
    runInputs(automaton, [
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    expect(automaton.currentView().finishedWord).toBe("あ");
    automaton.back();
    const view = automaton.currentView();
    expect(view.finishedWord).toBe("");
    expect(view.pendingWord).toBe("あい");
    expect(view.finishedStroke).toEqual([]);
    expect(view.finishedRoman).toBe("");
  });
});

describe("eventsView: 基本", () => {
  test("履歴なし: すべて undefined / 0", () => {
    const automaton = build(simpleRule(), "あ");
    const view = automaton.eventsView();
    expect(view.first).toBeUndefined();
    expect(view.last).toBeUndefined();
    expect(view.firstSucceeded).toBeUndefined();
    expect(view.lastSucceeded).toBeUndefined();
    expect(view.succeededCount).toBe(0);
    expect(view.failedCount).toBe(0);
    expect(view.totalCount).toBe(0);
  });

  test("単独成功: first=firstSucceeded、カウントは 1", () => {
    const automaton = build(simpleRule(), "あ");
    runInputs(automaton, [
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    const view = automaton.eventsView();
    expect(view.first).toBeDefined();
    expect(view.first).toBe(view.firstSucceeded);
    expect(view.last).toBeDefined();
    expect(view.succeededCount).toBe(1);
    expect(view.failedCount).toBe(0);
    expect(view.totalCount).toBe(1);
  });

  test("失敗入力のみ: failedCount=1、firstSucceeded は undefined", () => {
    const automaton = build(simpleRule(), "あ");
    runInputs(automaton, [
      { key: VirtualKeys.B, type: "keydown" }, // 「あ」に対して B はミス
      { key: VirtualKeys.B, type: "keyup" },
    ]);
    const view = automaton.eventsView();
    expect(view.firstSucceeded).toBeUndefined();
    expect(view.lastSucceeded).toBeUndefined();
    expect(view.succeededCount).toBe(0);
    expect(view.failedCount).toBe(1);
    expect(view.first).toBeDefined();
  });

  test("失敗 → 成功: first は失敗イベント、firstSucceeded は成功イベント", () => {
    const automaton = build(simpleRule(), "あ");
    runInputs(automaton, [
      { key: VirtualKeys.B, type: "keydown" }, // miss
      { key: VirtualKeys.B, type: "keyup" },
      { key: VirtualKeys.A, type: "keydown" }, // hit
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    const view = automaton.eventsView();
    expect(view.first?.input.key).toBe(VirtualKeys.B);
    expect(view.firstSucceeded?.input.key).toBe(VirtualKeys.A);
    expect(view.succeededCount).toBe(1);
    expect(view.failedCount).toBe(1);
    expect(view.totalCount).toBe(2);
  });

  test("stale keyup のみ受けた場合: first は undefined のまま（keydown 限定）、last は keyup で更新", () => {
    // 前ワード完了直後の Automaton 切替で、前ワードの keydown に対応する keyup だけが流入するケース
    const automaton = build(simpleRule(), "あ");
    runInputs(
      automaton,
      [
        { key: VirtualKeys.A, type: "keyup" }, // t=1000 stale keyup（自動的に IGNORED として inputHistory に残る）
      ],
      1000,
    );
    const view = automaton.eventsView();
    expect(view.first).toBeUndefined();
    expect(view.last?.timestamp).toBe(1000);
    expect(view.firstSucceeded).toBeUndefined();
    expect(view.succeededCount).toBe(0);
    expect(view.failedCount).toBe(0);
  });

  test("stale keyup → keydown の順: first は新しい keydown の timestamp", () => {
    const automaton = build(simpleRule(), "あ");
    runInputs(
      automaton,
      [
        { key: VirtualKeys.A, type: "keyup" }, // t=1000 stale keyup
        { key: VirtualKeys.A, type: "keydown" }, // t=1010 実際の最初の keydown
        { key: VirtualKeys.A, type: "keyup" }, // t=1020
      ],
      1000,
    );
    const view = automaton.eventsView();
    expect(view.first?.timestamp).toBe(1010);
    expect(view.firstSucceeded?.timestamp).toBe(1010);
    expect(view.last?.timestamp).toBe(1020);
  });

  test("first / last の timestamp は失敗イベントも含めて決定される", () => {
    const automaton = build(simpleRule(), "あ");
    runInputs(
      automaton,
      [
        { key: VirtualKeys.B, type: "keydown" }, // t=1000 miss
        { key: VirtualKeys.B, type: "keyup" },
        { key: VirtualKeys.A, type: "keydown" }, // t=1020 succ
        { key: VirtualKeys.A, type: "keyup" }, // t=1030
      ],
      1000,
    );
    const view = automaton.eventsView();
    expect(view.first?.timestamp).toBe(1000);
    expect(view.last?.timestamp).toBe(1030);
    expect(view.firstSucceeded?.timestamp).toBe(1020);
  });
});

describe("eventsView: back() の軸", () => {
  test("back() 取消後: succeededCount は取消分を除外する", () => {
    const automaton = build(simpleRule(), "あ");
    runInputs(automaton, [
      { key: VirtualKeys.A, type: "keydown" }, // 成功
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    expect(automaton.eventsView().succeededCount).toBe(1);
    automaton.back();
    const view = automaton.eventsView();
    expect(view.succeededCount).toBe(0);
    expect(view.firstSucceeded).toBeUndefined();
    expect(view.lastSucceeded).toBeUndefined();
  });

  test("back() 取消区間のミスは failedCount に含まれる", () => {
    // simpleRule の backspace は U キー
    const automaton = build(simpleRule(), "あ");
    runInputs(automaton, [
      { key: VirtualKeys.B, type: "keydown" }, // ミス（成功の前）→ backed 区間には入らない
      { key: VirtualKeys.B, type: "keyup" },
      { key: VirtualKeys.A, type: "keydown" }, // 成功
      { key: VirtualKeys.A, type: "keyup" },
      { key: VirtualKeys.B, type: "keydown" }, // 成功後のミス → backed 区間に入る
      { key: VirtualKeys.B, type: "keyup" },
      { key: VirtualKeys.U, type: "keydown" }, // backspace マッチ
      { key: VirtualKeys.U, type: "keyup" },
    ]);
    automaton.back();
    const view = automaton.eventsView();
    // 成功は取消されて 0
    expect(view.succeededCount).toBe(0);
    // backed 区間内外の両方のミスが含まれる
    expect(view.failedCount).toBe(2);
  });

  test("back() 後に再入力: succeededCount は再入力分のみ、失敗は累積", () => {
    const automaton = build(simpleRule(), "あ");
    runInputs(automaton, [
      { key: VirtualKeys.A, type: "keydown" }, // 成功1
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    automaton.back();
    runInputs(
      automaton,
      [
        { key: VirtualKeys.B, type: "keydown" }, // ミス
        { key: VirtualKeys.B, type: "keyup" },
        { key: VirtualKeys.A, type: "keydown" }, // 成功2（再入力）
        { key: VirtualKeys.A, type: "keyup" },
      ],
      2000,
    );
    const view = automaton.eventsView();
    expect(view.succeededCount).toBe(1);
    expect(view.failedCount).toBe(1);
    // firstSucceeded は取消されていない方（2回目）
    expect(view.firstSucceeded?.timestamp).toBe(2020);
    expect(view.lastSucceeded?.timestamp).toBe(2020);
  });

  test("複数 back() が積み重なっても succeededCount は正しくデクリメント", () => {
    const rule = loadJsonRule({
      entries: [
        { input: [{ keys: ["A"] }], output: "あ" },
        { input: [{ keys: ["I"] }], output: "い" },
      ],
      backspaces: [{ keys: ["U"] }],
    });
    const automaton = build(rule, "あい");
    runInputs(automaton, [
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
      { key: VirtualKeys.I, type: "keydown" },
      { key: VirtualKeys.I, type: "keyup" },
    ]);
    expect(automaton.eventsView().succeededCount).toBe(2);
    automaton.back();
    expect(automaton.eventsView().succeededCount).toBe(1);
    automaton.back();
    expect(automaton.eventsView().succeededCount).toBe(0);
  });

  test("first / last は back 取消区間のイベントも含めて決定される", () => {
    const automaton = build(simpleRule(), "あ");
    runInputs(
      automaton,
      [
        { key: VirtualKeys.A, type: "keydown" }, // t=1000 成功（後に取消される）
        { key: VirtualKeys.A, type: "keyup" }, // t=1010
      ],
      1000,
    );
    automaton.back();
    const view = automaton.eventsView();
    // 成功は取消されたが、first/last は残る
    expect(view.first?.timestamp).toBe(1000);
    expect(view.last?.timestamp).toBe(1010);
    expect(view.succeededCount).toBe(0);
  });

  test("back() 取消区間は BackHistoryEntry 自体もスキップされ first/last に含まれない", () => {
    const automaton = build(simpleRule(), "あ");
    runInputs(
      automaton,
      [
        { key: VirtualKeys.A, type: "keydown" },
        { key: VirtualKeys.A, type: "keyup" },
      ],
      1000,
    );
    automaton.back();
    const view = automaton.eventsView();
    // last は InputHistoryEntry 側の最後（A keyup）、BackHistoryEntry は除外
    expect(view.last?.timestamp).toBe(1010);
  });
});

describe("eventsView: totalCount", () => {
  test("totalCount = succeededCount + failedCount（hybrid）", () => {
    const automaton = build(simpleRule(), "あ");
    runInputs(automaton, [
      { key: VirtualKeys.B, type: "keydown" }, // miss
      { key: VirtualKeys.B, type: "keyup" },
      { key: VirtualKeys.A, type: "keydown" }, // succ
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    const view = automaton.eventsView();
    expect(view.totalCount).toBe(view.succeededCount + view.failedCount);
    expect(view.totalCount).toBe(2);
  });

  test("back() 取消後: succeededCount は減るが failedCount は維持、totalCount は両者の和", () => {
    const automaton = build(simpleRule(), "あ");
    runInputs(automaton, [
      { key: VirtualKeys.B, type: "keydown" }, // miss
      { key: VirtualKeys.B, type: "keyup" },
      { key: VirtualKeys.A, type: "keydown" }, // succ
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    expect(automaton.eventsView().totalCount).toBe(2);
    automaton.back();
    const view = automaton.eventsView();
    expect(view.succeededCount).toBe(0);
    expect(view.failedCount).toBe(1);
    expect(view.totalCount).toBe(1);
  });
});
