import { describe, expect, it, test } from "vitest";
import { loadJsonRule } from "../impl/jsonRuleLoader";
import { loadPresetKeyboardLayoutQwertyJis } from "../impl/presetKeyboardLayout";
import { loadPresetRuleNaginatashikiV15, loadPresetRuleRoman } from "../impl/presetRules";
import type { Automaton } from "./automaton";
import type { AutomatonState } from "./automatonState";
import { InputEvent, InputStroke } from "./inputEvent";
import { KeyboardState } from "./keyboardState";
import type { Rule } from "./rule";
import { VirtualKeys } from "./virtualKey";

describe("Automaton with extensions", () => {
  const rule = loadPresetRuleRoman(loadPresetKeyboardLayoutQwertyJis());

  it("should work with default extension after build", () => {
    const automaton = rule.build("こんにちは");

    // デフォルト拡張のメソッドが使える（rule.build はデフォルト拡張を含む）
    expect(automaton.getFinishedWord()).toBe("");
    expect(automaton.getPendingWord()).toBe("こんにちは");
    expect(automaton.isFinished()).toBe(false);
  });

  it("should add extension methods with correct types", () => {
    const automaton = rule.build("こんにちは");

    // 型推論が正しく動作する
    const finishedWord: string = automaton.getFinishedWord();
    const pendingWord: string = automaton.getPendingWord();
    const isFinished: boolean = automaton.isFinished();

    expect(finishedWord).toBe("");
    expect(pendingWord).toBe("こんにちは");
    expect(isFinished).toBe(false);
  });

  it("should chain multiple extensions", () => {
    const customExtension = {
      getWordLength: (state: AutomatonState) => state.word.length,
      getCustomStat: (state: AutomatonState) => state.currentNode.kanaIndex * 2,
    };

    // baseAutomaton を作るための startNode を取得
    const baseAutomaton = rule.build("こんにちは");

    // 拡張を段階的に適用
    const withDefault = baseAutomaton;
    const automaton = withDefault.with(customExtension);

    // すべての拡張メソッドが使える
    expect(automaton.getFinishedWord()).toBe("");
    expect(automaton.getWordLength()).toBe(5);
    expect(automaton.getCustomStat()).toBe(0);
  });

  it("should preserve Automaton methods", () => {
    const automaton = rule.build("こんにちは");

    // 元の Automaton のメソッドも使える
    expect(automaton.word).toBe("こんにちは");
    expect(automaton.currentNode).toBeDefined();
    expect(automaton.input).toBeDefined();
    expect(automaton.reset).toBeDefined();
  });

  it("should infer correct return types", () => {
    const testExtension = {
      getNumber: (_state: AutomatonState) => 42,
      getString: (_state: AutomatonState) => "hello",
      getBoolean: (_state: AutomatonState) => true,
      getArray: (_state: AutomatonState) => [1, 2, 3],
      getObject: (_state: AutomatonState) => ({ foo: "bar" }),
      getLiteral: (_state: AutomatonState) => "success" as const,
      getUnion: (_state: AutomatonState) => (Math.random() > 0.5 ? "a" : "b"),
    } as const;

    const automaton = rule.build("test").with(testExtension);

    // 型推論のテスト
    const num: number = automaton.getNumber();
    const str: string = automaton.getString();
    const bool: boolean = automaton.getBoolean();
    const arr: number[] = automaton.getArray();
    const obj: { foo: string } = automaton.getObject();
    const literal: "success" = automaton.getLiteral();
    const union: "a" | "b" = automaton.getUnion();

    expect(num).toBe(42);
    expect(str).toBe("hello");
    expect(bool).toBe(true);
    expect(arr).toEqual([1, 2, 3]);
    expect(obj).toEqual({ foo: "bar" });
    expect(literal).toBe("success");
    expect(["a", "b"]).toContain(union);
  });

  // automaton ごとに実行時特有の値を割り当てる
  it("should have their own value", () => {
    const automaton1 = rule.build("こんにちは").with({
      getPosition: (_: AutomatonState) => 10,
    });
    const automaton2 = rule.build("さようなら").with({
      getPosition: (_: AutomatonState) => 20,
    });

    expect(automaton1.getPosition()).toBe(10);
    expect(automaton2.getPosition()).toBe(20);
  });

  it("should allow functions to call other functions in the same extension", () => {
    const extension = {
      getSucceededCount: (_: AutomatonState) => 100,
      getTotalCount(state: AutomatonState) {
        return this.getSucceededCount(state) + this.getMissedCount(state);
      },
      getMissedCount: (_: AutomatonState) => 50,
    };

    const automaton = rule.build("こんにちは").with(extension);

    expect(automaton.getSucceededCount()).toBe(100);
    expect(automaton.getMissedCount()).toBe(50);
    expect(automaton.getTotalCount()).toBe(150);
  });

  it("should have their own state", () => {
    const counterWrapper = (a: Automaton) => {
      let count = 0;
      return a.with({
        increment: () => {
          count++;
        },
        getCount: () => count,
      });
    };
    const automaton1 = counterWrapper(rule.build("こんにちは"));
    const automaton2 = counterWrapper(rule.build("さようなら"));

    expect(automaton1.getCount()).toBe(0);
    expect(automaton2.getCount()).toBe(0);

    automaton1.increment();
    expect(automaton1.getCount()).toBe(1);
    expect(automaton2.getCount()).toBe(0);

    automaton1.increment();
    expect(automaton1.getCount()).toBe(2);
    expect(automaton2.getCount()).toBe(0);

    automaton2.increment();
    expect(automaton1.getCount()).toBe(2);
    expect(automaton2.getCount()).toBe(1);
  });
});

/**
 * テストヘルパ: automaton に一連の keydown/keyup を流し、結果配列を返す。
 */
function runInputsOn(
  automaton: ReturnType<Rule["build"]>,
  events: { key: (typeof VirtualKeys)[keyof typeof VirtualKeys]; type: "keydown" | "keyup" }[],
): string[] {
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
  return results;
}

describe("Automaton backspace stroke integration", () => {
  const simpleRule = () =>
    loadJsonRule({
      entries: [
        { input: [{ keys: ["A"] }], output: "あ" },
        { input: [{ keys: ["B"] }], output: "い" },
      ],
      backspaces: [{ keys: ["U"] }],
    });

  test("matched backspace stroke returns BACK and records the event", () => {
    const rule = simpleRule();
    const automaton = rule.build("あ");
    const results = runInputsOn(automaton, [
      { key: VirtualKeys.U, type: "keydown" },
      { key: VirtualKeys.U, type: "keyup" },
    ]);
    expect(results[0]).toBe("back");
    // 遷移はしない
    expect(automaton.currentNode).toBe(automaton.startNode);
    expect(automaton.edgeHistories.length).toBe(0);
    // backspace イベントがバッファに記録される
    expect(automaton.backspaceEventsAtCurrentNode.length).toBe(1);
  });

  test("backspace events are recorded in backspaceEventsAtCurrentNode and then moved to EdgeHistory on next commit", () => {
    const rule = simpleRule();
    const automaton = rule.build("あ");
    // 失敗入力 → backspace → 正規入力 の順
    runInputsOn(automaton, [
      { key: VirtualKeys.B, type: "keydown" }, // 「あ」に対して B はミス
      { key: VirtualKeys.B, type: "keyup" },
      { key: VirtualKeys.U, type: "keydown" }, // backspace 発火
      { key: VirtualKeys.U, type: "keyup" },
    ]);
    expect(automaton.failedEventsAtCurrentNode.length).toBe(1);
    expect(automaton.backspaceEventsAtCurrentNode.length).toBe(1);
    expect(automaton.edgeHistories.length).toBe(0);

    // 正規入力 A で「あ」が確定 → 直前のバッファが EdgeHistory に移る
    runInputsOn(automaton, [
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    expect(automaton.edgeHistories.length).toBe(1);
    expect(automaton.edgeHistories[0].failedEvents.length).toBe(1);
    expect(automaton.edgeHistories[0].backspaceEvents.length).toBe(1);
    expect(automaton.failedEventsAtCurrentNode.length).toBe(0);
    expect(automaton.backspaceEventsAtCurrentNode.length).toBe(0);
  });

  test("multiple backspaces before first commit are all recorded in first EdgeHistory", () => {
    const rule = simpleRule();
    const automaton = rule.build("あ");
    runInputsOn(automaton, [
      { key: VirtualKeys.U, type: "keydown" },
      { key: VirtualKeys.U, type: "keyup" },
      { key: VirtualKeys.U, type: "keydown" },
      { key: VirtualKeys.U, type: "keyup" },
      { key: VirtualKeys.U, type: "keydown" },
      { key: VirtualKeys.U, type: "keyup" },
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    expect(automaton.edgeHistories.length).toBe(1);
    expect(automaton.edgeHistories[0].backspaceEvents.length).toBe(3);
  });

  test("back() rewinds EdgeHistory along with its backspaceEvents", () => {
    const rule = simpleRule();
    const automaton = rule.build("あ");
    runInputsOn(automaton, [
      { key: VirtualKeys.U, type: "keydown" },
      { key: VirtualKeys.U, type: "keyup" },
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    expect(automaton.edgeHistories.length).toBe(1);
    expect(automaton.edgeHistories[0].backspaceEvents.length).toBe(1);
    automaton.back();
    expect(automaton.edgeHistories.length).toBe(0);
    expect(automaton.backspaceEventsAtCurrentNode.length).toBe(0);
  });

  test("unrelated key with empty backspaceStrokes keeps existing ignored behavior", () => {
    // backspaces を明示的に空に指定 → backspace 機能無効
    const rule = loadJsonRule({
      entries: [{ input: [{ keys: ["A"] }], output: "あ" }],
      backspaces: [],
    });
    const automaton = rule.build("あ");
    const results = runInputsOn(automaton, [
      { key: VirtualKeys.U, type: "keydown" },
      { key: VirtualKeys.U, type: "keyup" },
    ]);
    expect(results[0]).toBe("ignored");
  });

  test("testInput returns BACK without mutating state", () => {
    const rule = simpleRule();
    const automaton = rule.build("あ");
    const state = new KeyboardState();
    state.keydown(VirtualKeys.U);
    const [result] = automaton.testInput(
      new InputEvent(new InputStroke(VirtualKeys.U, "keydown"), state, new Date()),
    );
    expect(result.isBack).toBe(true);
    // dryRun では状態を動かさない
    expect(automaton.backspaceEventsAtCurrentNode.length).toBe(0);
  });
});

describe("Automaton backspace: naginata 回帰", () => {
  const rule = loadPresetRuleNaginatashikiV15(loadPresetKeyboardLayoutQwertyJis());

  test("Space+U → さ (通常経路優先: backspace 定義があっても既存 entry が優先)", () => {
    const automaton = rule.build("さ");
    const results = runInputsOn(automaton, [
      { key: VirtualKeys.Space, type: "keydown" },
      { key: VirtualKeys.U, type: "keydown" },
      { key: VirtualKeys.U, type: "keyup" },
      { key: VirtualKeys.Space, type: "keyup" },
    ]);
    // Space+U で さ が確定する (1 打目が U の keydown)
    expect(results[1]).toBe("finished");
    expect(automaton.getFinishedWord()).toBe("さ");
  });

  test("Space+U+F → ざ (同時押し sim が通常経路で確定)", () => {
    const automaton = rule.build("ざ");
    runInputsOn(automaton, [
      { key: VirtualKeys.Space, type: "keydown" },
      { key: VirtualKeys.U, type: "keydown" },
      { key: VirtualKeys.F, type: "keydown" },
      { key: VirtualKeys.U, type: "keyup" },
      { key: VirtualKeys.F, type: "keyup" },
      { key: VirtualKeys.Space, type: "keyup" },
    ]);
    expect(automaton.isFinished()).toBe(true);
    expect(automaton.getFinishedWord()).toBe("ざ");
  });

  test("Space 非押下で U 単独 → BACK 発火", () => {
    // word は「き」(W 単独) にしておき、U 単独押下が現在ノードの候補に無い状態を作る
    const automaton = rule.build("き");
    const results = runInputsOn(automaton, [
      { key: VirtualKeys.U, type: "keydown" },
      { key: VirtualKeys.U, type: "keyup" },
    ]);
    expect(results[0]).toBe("back");
    // 状態は進まない
    expect(automaton.currentNode).toBe(automaton.startNode);
    // backspace イベントはバッファに記録される
    expect(automaton.backspaceEventsAtCurrentNode.length).toBe(1);
  });
});
