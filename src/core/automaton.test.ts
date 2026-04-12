import { describe, expect, it, test } from "vitest";
import { loadJsonRule } from "../impl/jsonRuleLoader";
import {
  loadPresetKeyboardLayoutQwertyJis,
  loadPresetRuleNaginatashikiV15,
  loadPresetRuleRoman,
} from "../impl/presets";
import { build, type Automaton } from "../impl/buildAutomaton";
import type { AutomatonState, HistoryEntry, InputHistoryEntry } from "./automatonState";
import { InputEvent, InputStroke } from "./inputEvent";
import { KeyboardState } from "./keyboardState";
import { VirtualKeys } from "./virtualKey";

describe("Automaton with extensions", () => {
  const rule = loadPresetRuleRoman(loadPresetKeyboardLayoutQwertyJis());

  it("should work with default extension after build", () => {
    const automaton = build(rule, "こんにちは");

    // デフォルト拡張のメソッドが使える（rule.build はデフォルト拡張を含む）
    expect(automaton.getFinishedWord()).toBe("");
    expect(automaton.getPendingWord()).toBe("こんにちは");
    expect(automaton.isFinished()).toBe(false);
  });

  it("should add extension methods with correct types", () => {
    const automaton = build(rule, "こんにちは");

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
    const baseAutomaton = build(rule, "こんにちは");

    // 拡張を段階的に適用
    const withDefault = baseAutomaton;
    const automaton = withDefault.with(customExtension);

    // すべての拡張メソッドが使える
    expect(automaton.getFinishedWord()).toBe("");
    expect(automaton.getWordLength()).toBe(5);
    expect(automaton.getCustomStat()).toBe(0);
  });

  it("should preserve Automaton methods", () => {
    const automaton = build(rule, "こんにちは");

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

    const automaton = build(rule, "test").with(testExtension);

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
    const automaton1 = build(rule, "こんにちは").with({
      getPosition: (_: AutomatonState) => 10,
    });
    const automaton2 = build(rule, "さようなら").with({
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

    const automaton = build(rule, "こんにちは").with(extension);

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
    const automaton1 = counterWrapper(build(rule, "こんにちは"));
    const automaton2 = counterWrapper(build(rule, "さようなら"));

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
  automaton: Automaton,
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

function inputEntries(automaton: {
  inputHistory: ReadonlyArray<HistoryEntry>;
}): InputHistoryEntry[] {
  return automaton.inputHistory.filter((e): e is InputHistoryEntry => !("back" in e));
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
    const automaton = build(rule, "あ");
    const results = runInputsOn(automaton, [
      { key: VirtualKeys.U, type: "keydown" },
      { key: VirtualKeys.U, type: "keyup" },
    ]);
    expect(results[0]).toBe("back");
    // 遷移はしない
    expect(automaton.currentNode).toBe(automaton.startNode);
    expect(automaton.getEffectiveEdges().length).toBe(0);
    // backspace イベントが inputHistory に記録される
    const backEntries = inputEntries(automaton).filter((e) => e.result.isBack);
    expect(backEntries.length).toBe(1);
  });

  test("backspace and failed events are recorded in inputHistory", () => {
    const rule = simpleRule();
    const automaton = build(rule, "あ");
    // 失敗入力 → backspace → 正規入力 の順
    runInputsOn(automaton, [
      { key: VirtualKeys.B, type: "keydown" }, // 「あ」に対して B はミス
      { key: VirtualKeys.B, type: "keyup" },
      { key: VirtualKeys.U, type: "keydown" }, // backspace 発火
      { key: VirtualKeys.U, type: "keyup" },
    ]);
    const entries = inputEntries(automaton);
    expect(entries.filter((e) => e.result.isFailed).length).toBe(1);
    expect(entries.filter((e) => e.result.isBack).length).toBe(1);
    expect(automaton.getEffectiveEdges().length).toBe(0);

    // 正規入力 A で「あ」が確定
    runInputsOn(automaton, [
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    const allEntries = inputEntries(automaton);
    expect(automaton.getEffectiveEdges().length).toBe(1);
    expect(allEntries.filter((e) => e.result.isFailed).length).toBe(1);
    expect(allEntries.filter((e) => e.result.isBack).length).toBe(1);
    expect(allEntries.filter((e) => e.result.isSucceeded).length).toBe(1);
  });

  test("multiple backspaces are all recorded in inputHistory", () => {
    const rule = simpleRule();
    const automaton = build(rule, "あ");
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
    expect(automaton.getEffectiveEdges().length).toBe(1);
    const entries = inputEntries(automaton);
    expect(entries.filter((e) => e.result.isBack).length).toBe(3);
  });

  test("back() records BackHistoryEntry and rewinds currentNode", () => {
    const rule = simpleRule();
    const automaton = build(rule, "あ");
    runInputsOn(automaton, [
      { key: VirtualKeys.U, type: "keydown" },
      { key: VirtualKeys.U, type: "keyup" },
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    expect(automaton.getEffectiveEdges().length).toBe(1);
    automaton.back();
    expect(automaton.getEffectiveEdges().length).toBe(0);
    expect(automaton.currentNode).toBe(automaton.startNode);
    // BackHistoryEntry が記録されている
    const backHistoryEntries = automaton.inputHistory.filter((e) => "back" in e);
    expect(backHistoryEntries.length).toBe(1);
  });

  test("unrelated key with empty backspaceStrokes keeps existing ignored behavior", () => {
    // backspaces を明示的に空に指定 → backspace 機能無効
    const rule = loadJsonRule({
      entries: [{ input: [{ keys: ["A"] }], output: "あ" }],
      backspaces: [],
    });
    const automaton = build(rule, "あ");
    const results = runInputsOn(automaton, [
      { key: VirtualKeys.U, type: "keydown" },
      { key: VirtualKeys.U, type: "keyup" },
    ]);
    expect(results[0]).toBe("ignored");
  });

  test("testInput returns BACK without mutating state", () => {
    const rule = simpleRule();
    const automaton = build(rule, "あ");
    const state = new KeyboardState();
    state.keydown(VirtualKeys.U);
    const [result] = automaton.testInput(
      new InputEvent(new InputStroke(VirtualKeys.U, "keydown"), state, new Date()),
    );
    expect(result.isBack).toBe(true);
    // dryRun では状態を動かさない
    expect(automaton.inputHistory.length).toBe(0);
  });
});

describe("Automaton backspace: naginata 回帰", () => {
  const rule = loadPresetRuleNaginatashikiV15(loadPresetKeyboardLayoutQwertyJis());

  test("Space+U → さ (通常経路優先: backspace 定義があっても既存 entry が優先)", () => {
    const automaton = build(rule, "さ");
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
    const automaton = build(rule, "ざ");
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
    const automaton = build(rule, "き");
    const results = runInputsOn(automaton, [
      { key: VirtualKeys.U, type: "keydown" },
      { key: VirtualKeys.U, type: "keyup" },
    ]);
    expect(results[0]).toBe("back");
    // 状態は進まない
    expect(automaton.currentNode).toBe(automaton.startNode);
    // backspace イベントが inputHistory に記録される
    const backEntries = inputEntries(automaton).filter((e) => e.result.isBack);
    expect(backEntries.length).toBe(1);
  });

  test("Space+U がミス位置で FAILED (backspace U より さ が具体的)", () => {
    // word = "き" (W 単独) → "さ" は期待されない位置
    const automaton = build(rule, "き");
    const results = runInputsOn(automaton, [
      { key: VirtualKeys.Space, type: "keydown" },
      { key: VirtualKeys.U, type: "keydown" },
      { key: VirtualKeys.U, type: "keyup" },
      { key: VirtualKeys.Space, type: "keyup" },
    ]);
    // Space+U = "さ" (keyCount=2) が backspace U (keyCount=1) より具体的 → ミス入力
    expect(results[1]).toBe("failed");
  });
});

describe("Automaton backspace: 逆パターン (modifier 付き backspace + 単独キー通常入力)", () => {
  // backspace = Space+U, 通常入力に U 単独 = "う" を定義
  const rule = loadJsonRule({
    entries: [
      { input: [{ keys: ["U"] }], output: "う" },
      { input: [{ keys: ["A"] }], output: "あ" },
    ],
    backspaces: [{ keys: ["U"], modifiers: [["Space"]] }],
  });

  test("U 単独で 'う' が正しく入力される", () => {
    const automaton = build(rule, "う");
    const results = runInputsOn(automaton, [
      { key: VirtualKeys.U, type: "keydown" },
      { key: VirtualKeys.U, type: "keyup" },
    ]);
    expect(results[0]).toBe("finished");
    expect(automaton.getFinishedWord()).toBe("う");
  });

  test("Space+U で BACK が発火する (backspace が通常入力より具体的)", () => {
    const automaton = build(rule, "あ");
    const results = runInputsOn(automaton, [
      { key: VirtualKeys.Space, type: "keydown" },
      { key: VirtualKeys.U, type: "keydown" },
      { key: VirtualKeys.U, type: "keyup" },
      { key: VirtualKeys.Space, type: "keyup" },
    ]);
    // Space+U backspace (keyCount=2) が "う" (keyCount=1) より具体的 → BACK
    expect(results[1]).toBe("back");
    expect(automaton.currentNode).toBe(automaton.startNode);
    const backEntries = inputEntries(automaton).filter((e) => e.result.isBack);
    expect(backEntries.length).toBe(1);
  });

  test("U 単独がミス位置で FAILED (backspace は Space なしでは発動しない)", () => {
    // word = "あ" → "う" は期待されない位置
    const automaton = build(rule, "あ");
    const results = runInputsOn(automaton, [
      { key: VirtualKeys.U, type: "keydown" },
      { key: VirtualKeys.U, type: "keyup" },
    ]);
    // Space なし → backspace 条件不成立。"う" はルールに存在するがミス位置 → FAILED
    expect(results[0]).toBe("failed");
  });
});

describe("Automaton getCurrentOriginRules with chained rule", () => {
  // ローマ字 rule は内部で alphanumeric rule が append されているため、
  // "ABCあ" のように混在ワードで build すると、位置ごとの rule が切り替わる。
  const layout = loadPresetKeyboardLayoutQwertyJis();
  const romanRule = loadPresetRuleRoman(layout);

  test("returns origin rules that match the character type at each position", () => {
    const automaton = build(romanRule, "ABCあ");
    // 先頭 ("A") は alphanumeric rule の edge だけがある
    const atStart = automaton.getCurrentOriginRules();
    expect(atStart).toHaveLength(1);
    expect(atStart[0].name).toBe("alphanumeric");
  });

  test("origin rule switches after typing through ascii portion", () => {
    const automaton = build(romanRule, "Aあ");
    // "A" を打鍵
    runInputsOn(automaton, [
      { key: VirtualKeys.ShiftLeft, type: "keydown" },
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
      { key: VirtualKeys.ShiftLeft, type: "keyup" },
    ]);
    expect(automaton.currentNode.kanaIndex).toBe(1);
    const atKana = automaton.getCurrentOriginRules();
    // 次は "あ" の位置: ローマ字 rule (head) の edge が使われる
    expect(atKana).toHaveLength(1);
    // head rule (ローマ字) は name が空の可能性があるため、alphanumeric でないことで確認
    expect(atKana[0].name).not.toBe("alphanumeric");
  });

  test("returns empty when past the end of the word", () => {
    const automaton = build(romanRule, "A");
    // word "A" を打ち切る
    runInputsOn(automaton, [
      { key: VirtualKeys.ShiftLeft, type: "keydown" },
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
      { key: VirtualKeys.ShiftLeft, type: "keyup" },
    ]);
    expect(automaton.isFinished()).toBe(true);
    // ワード終端以降は候補なし
    expect(automaton.getCurrentOriginRules()).toEqual([]);
  });
});

describe("Roman rule with append preserves n/ん longest match", () => {
  const layout = loadPresetKeyboardLayoutQwertyJis();
  const romanRule = loadPresetRuleRoman(layout);

  test("'n' alone cannot type 'な' before 'a' is pressed", () => {
    const automaton = build(romanRule, "な");
    const results = runInputsOn(automaton, [
      { key: VirtualKeys.N, type: "keydown" },
      { key: VirtualKeys.N, type: "keyup" },
    ]);
    expect(results[0]).not.toBe("finished");
    const result2 = runInputsOn(automaton, [
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    expect(result2[0]).toBe("finished");
  });
});
