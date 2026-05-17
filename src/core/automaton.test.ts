import { describe, expect, it, test } from "vitest";
import { createDirectInputRule } from "../impl/directInputRule";
import { loadJsonRule } from "../impl/jsonRuleLoader";
import {
  loadPresetKeyboardLayoutQwertyJis,
  loadPresetRuleAsuka290,
  loadPresetRuleNaginatashikiV15,
  loadPresetRuleRoman,
} from "../impl/presets";
import { build, type Automaton } from "../impl/buildAutomaton";
import type { AutomatonState, HistoryEntry, InputHistoryEntry } from "./automatonState";
import { InputEvent, InputStroke } from "./inputEvent";
import { KeyboardState } from "./keyboardState";
import type { Rule } from "./rule";
import { VirtualKeys } from "./virtualKey";

describe("Automaton with extensions", () => {
  const layout = loadPresetKeyboardLayoutQwertyJis();
  const rule = loadPresetRuleRoman(layout).merge(createDirectInputRule(layout));

  it("should work with default extension after build", () => {
    const automaton = build(rule, "こんにちは");

    // デフォルト拡張のメソッドが使える（rule.build はデフォルト拡張を含む）
    expect(automaton.currentView().finishedWord).toBe("");
    expect(automaton.currentView().pendingWord).toBe("こんにちは");
    expect(automaton.currentNode.isFinished).toBe(false);
  });

  it("should add extension methods with correct types", () => {
    const automaton = build(rule, "こんにちは");

    // 型推論が正しく動作する
    const view = automaton.currentView();
    const finishedWord: string = view.finishedWord;
    const pendingWord: string = view.pendingWord;
    const isFinished: boolean = automaton.currentNode.isFinished;

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
    expect(automaton.currentView().finishedWord).toBe("");
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
      new InputEvent(new InputStroke(ev.key, ev.type), state, performance.now()),
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
    expect(automaton.eventsView().succeededCount).toBe(0);
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
    expect(automaton.eventsView().succeededCount).toBe(0);

    // 正規入力 A で「あ」が確定
    runInputsOn(automaton, [
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
    ]);
    const allEntries = inputEntries(automaton);
    expect(automaton.eventsView().succeededCount).toBe(1);
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
    expect(automaton.eventsView().succeededCount).toBe(1);
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
    expect(automaton.eventsView().succeededCount).toBe(1);
    automaton.back();
    expect(automaton.eventsView().succeededCount).toBe(0);
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
      new InputEvent(new InputStroke(VirtualKeys.U, "keydown"), state, performance.now()),
    );
    expect(result.isBack).toBe(true);
    // dryRun では状態を動かさない
    expect(automaton.inputHistory.length).toBe(0);
  });
});

describe("Automaton backspace: naginata 回帰", () => {
  const rule = loadPresetRuleNaginatashikiV15();

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
    expect(automaton.currentView().finishedWord).toBe("さ");
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
    expect(automaton.currentNode.isFinished).toBe(true);
    expect(automaton.currentView().finishedWord).toBe("ざ");
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
    expect(automaton.currentView().finishedWord).toBe("う");
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

describe("Automaton currentRules with chained rule", () => {
  // ローマ字 rule と directInput rule を合成することで、"ABCあ" のような
  // 混在ワードを build すると位置ごとの rule が切り替わる。
  const layout = loadPresetKeyboardLayoutQwertyJis();
  const romanRule = loadPresetRuleRoman(layout).merge(createDirectInputRule(layout));

  test("returns origin rules that match the character type at each position", () => {
    const automaton = build(romanRule, "ABCあ");
    // 先頭 ("A") は directInput rule の edge だけがある
    const atStart = automaton.currentRules;
    expect(atStart).toHaveLength(1);
    expect(atStart[0].metadata.name).toBe("directInput");
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
    const atKana = automaton.currentRules;
    // 次は "あ" の位置: ローマ字 rule (head) の edge が使われる
    expect(atKana).toHaveLength(1);
    // head rule (ローマ字) は name が空の可能性があるため、directInput でないことで確認
    expect(atKana[0].metadata.name).not.toBe("directInput");
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
    expect(automaton.currentNode.isFinished).toBe(true);
    // ワード終端以降は候補なし
    expect(automaton.currentRules).toEqual([]);
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

describe("RuleEntry.sources tagging on RulePrimitive", () => {
  const layout = loadPresetKeyboardLayoutQwertyJis();

  test("roman 単独の rule で build した automaton の全エッジの entry.sources は roman primitive のみ", () => {
    const romanRule = loadPresetRuleRoman(layout);
    const automaton = build(romanRule, "な");
    const sourcesSet = new Set<unknown>();
    const queue = [automaton.currentNode];
    const visited = new Set();
    while (queue.length > 0) {
      const node = queue.shift();
      if (!node || visited.has(node)) continue;
      visited.add(node);
      for (const edge of node.nextEdges) {
        if (!edge.entry) continue;
        for (const src of edge.entry.sources) sourcesSet.add(src);
        queue.push(edge.next);
      }
    }
    expect(sourcesSet.size).toBe(1);
    expect(sourcesSet.has(romanRule)).toBe(true);
  });

  test("direct input 単独の rule で build した automaton の全エッジの entry.sources は direct input primitive のみ", () => {
    const directRule = createDirectInputRule(layout);
    const automaton = build(directRule, "A");
    for (const edge of automaton.currentNode.nextEdges) {
      expect(edge.entry?.sources).toEqual([directRule]);
    }
  });
});

describe("merge produces n+space merged edge across primitives", () => {
  const layout = loadPresetKeyboardLayoutQwertyJis();
  const romanRule = loadPresetRuleRoman(layout);
  const directRule = createDirectInputRule(layout);
  const composed = romanRule.merge(directRule);

  test("'キャンペーン ' が N→Space の 2 打で完了する (n+space 結合エッジ)", () => {
    const automaton = build(composed, "キャンペーン ");
    const results = runInputsOn(automaton, [
      { key: VirtualKeys.K, type: "keydown" },
      { key: VirtualKeys.K, type: "keyup" },
      { key: VirtualKeys.Y, type: "keydown" },
      { key: VirtualKeys.Y, type: "keyup" },
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
      { key: VirtualKeys.N, type: "keydown" },
      { key: VirtualKeys.N, type: "keyup" },
      { key: VirtualKeys.P, type: "keydown" },
      { key: VirtualKeys.P, type: "keyup" },
      { key: VirtualKeys.E, type: "keydown" },
      { key: VirtualKeys.E, type: "keyup" },
      { key: VirtualKeys.Minus, type: "keydown" },
      { key: VirtualKeys.Minus, type: "keyup" },
      // ここから末尾「ン 」を N + Space の 2 打で消化
      { key: VirtualKeys.N, type: "keydown" },
      { key: VirtualKeys.N, type: "keyup" },
      { key: VirtualKeys.Space, type: "keydown" },
      { key: VirtualKeys.Space, type: "keyup" },
    ]);
    expect(automaton.currentNode.isFinished).toBe(true);
    // 最後の打鍵 (Space keyup) の直前 (Space keydown) で finished
    expect(results[results.length - 2]).toBe("finished");
  });

  test("'キャンペーン ' は nn→Space の 3 打経路でも完了する (既存経路の維持)", () => {
    const automaton = build(composed, "キャンペーン ");
    runInputsOn(automaton, [
      { key: VirtualKeys.K, type: "keydown" },
      { key: VirtualKeys.K, type: "keyup" },
      { key: VirtualKeys.Y, type: "keydown" },
      { key: VirtualKeys.Y, type: "keyup" },
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
      { key: VirtualKeys.N, type: "keydown" },
      { key: VirtualKeys.N, type: "keyup" },
      { key: VirtualKeys.P, type: "keydown" },
      { key: VirtualKeys.P, type: "keyup" },
      { key: VirtualKeys.E, type: "keydown" },
      { key: VirtualKeys.E, type: "keyup" },
      { key: VirtualKeys.Minus, type: "keydown" },
      { key: VirtualKeys.Minus, type: "keyup" },
      // 末尾「ン 」を nn + space の 3 打で消化
      { key: VirtualKeys.N, type: "keydown" },
      { key: VirtualKeys.N, type: "keyup" },
      { key: VirtualKeys.N, type: "keydown" },
      { key: VirtualKeys.N, type: "keyup" },
      { key: VirtualKeys.Space, type: "keydown" },
      { key: VirtualKeys.Space, type: "keyup" },
    ]);
    expect(automaton.currentNode.isFinished).toBe(true);
  });

  test("n+space 結合エッジの entry.sources は roman と direct input の両 primitive を含む", () => {
    const automaton = build(composed, "ン ");
    // 先頭ノードから出るエッジの中に「N+Space で ン  を1 entry で消化する」edge があるはず
    const firstEdge = automaton.currentNode.nextEdges.find(
      (e) => e.input.kind === "single" && e.input.key === VirtualKeys.N,
    );
    expect(firstEdge).toBeDefined();
    if (!firstEdge) return;
    // その先のエッジ (Space) の entry が合成エッジ (ん ) であることを確認
    const spaceEdge = firstEdge.next.nextEdges.find(
      (e) => e.input.kind === "single" && e.input.key === VirtualKeys.Space,
    );
    expect(spaceEdge).toBeDefined();
    if (!spaceEdge) return;
    // sources に両 primitive 含まれる
    const sources = new Set<Rule>(spaceEdge.entry?.sources ?? []);
    expect(sources.has(romanRule)).toBe(true);
    expect(sources.has(directRule)).toBe(true);
  });

  test("automaton.inputHistory の完了打鍵の edge.entry.sources で由来を追跡できる", () => {
    const automaton = build(composed, "ン ");
    runInputsOn(automaton, [
      { key: VirtualKeys.N, type: "keydown" },
      { key: VirtualKeys.N, type: "keyup" },
      { key: VirtualKeys.Space, type: "keydown" },
      { key: VirtualKeys.Space, type: "keyup" },
    ]);
    expect(automaton.currentNode.isFinished).toBe(true);
    const edgeEntries = inputEntries(automaton).filter((e) => e.edge);
    expect(edgeEntries.length).toBeGreaterThan(0);
    const lastEdge = edgeEntries[edgeEntries.length - 1].edge;
    const sources = new Set<Rule>(lastEdge?.entry?.sources ?? []);
    expect(sources.has(romanRule)).toBe(true);
    expect(sources.has(directRule)).toBe(true);
  });
});

/**
 * テストヘルパ: runInputsOn と同じだが、各 InputEvent に「その打鍵時点の
 * KeyboardState のスナップショット」を渡す。browser/eventHandler.ts が
 * `new KeyboardState([...keyboardState.downedKeys])` でコピーを渡しているのと
 * 同じ挙動を再現する。
 */
function runInputsWithSnapshotOn(
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
      new InputEvent(
        new InputStroke(ev.key, ev.type),
        new KeyboardState([...state.downedKeys]),
        performance.now(),
      ),
    );
    results.push(result.toString());
  }
  return results;
}

describe("Automaton modifier 押しっぱなしでの連続入力 (飛鳥290 回帰)", () => {
  const rule = loadPresetRuleAsuka290();

  test("LangRight を押しっぱなしで S を 1 回打鍵すると 'お' が入力できる", () => {
    const automaton = build(rule, "お");
    const results = runInputsWithSnapshotOn(automaton, [
      { key: VirtualKeys.LangRight, type: "keydown" },
      { key: VirtualKeys.S, type: "keydown" },
      { key: VirtualKeys.S, type: "keyup" },
      { key: VirtualKeys.LangRight, type: "keyup" },
    ]);
    // LangRight を modifier として S 打鍵で「お」が確定する
    expect(results[1]).toBe("finished");
    expect(automaton.currentView().finishedWord).toBe("お");
  });

  test("LangRight を押しっぱなしで S を 2 回打鍵すると 'おお' が入力できる", () => {
    const automaton = build(rule, "おお");
    const results = runInputsWithSnapshotOn(automaton, [
      { key: VirtualKeys.LangRight, type: "keydown" },
      { key: VirtualKeys.S, type: "keydown" }, // 1 文字目の「お」
      { key: VirtualKeys.S, type: "keyup" },
      { key: VirtualKeys.S, type: "keydown" }, // 2 文字目の「お」
      { key: VirtualKeys.S, type: "keyup" },
      { key: VirtualKeys.LangRight, type: "keyup" },
    ]);
    // 1 回目の S keydown で 1 文字目の「お」が確定
    expect(results[1]).toBe("kana_succeeded");
    // 2 回目の S keydown で 2 文字目の「お」が確定し、ワードが完了する。
    // LangRight を押しっぱなしのまま 2 回目の S を打鍵しても pending にならず
    // 「お」が入力できることを確認する。
    expect(results[3]).toBe("finished");
    expect(automaton.currentNode.isFinished).toBe(true);
    expect(automaton.currentView().finishedWord).toBe("おお");
  });
});

describe("merge: ん の直後が literal 'n' のときは 1 打短縮されない", () => {
  // ruleExtender が n/ん を展開する際、takenStrokes に n 自身が含まれるため
  // 先頭ストロークが n である direct input 'n' は結合候補にならない。
  // よって「ん + literal n」は n 1 打では消化できず、nn/xn + n の計 3 打が必要。
  const layout = loadPresetKeyboardLayoutQwertyJis();
  const romanRule = loadPresetRuleRoman(layout);
  const directRule = createDirectInputRule(layout);
  const composed = romanRule.merge(directRule);

  test("'ぱんn' は pa + nn + n の 5 打で完了する", () => {
    const automaton = build(composed, "ぱんn");
    const results = runInputsOn(automaton, [
      { key: VirtualKeys.P, type: "keydown" },
      { key: VirtualKeys.P, type: "keyup" },
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
      { key: VirtualKeys.N, type: "keydown" },
      { key: VirtualKeys.N, type: "keyup" },
      { key: VirtualKeys.N, type: "keydown" },
      { key: VirtualKeys.N, type: "keyup" },
      { key: VirtualKeys.N, type: "keydown" },
      { key: VirtualKeys.N, type: "keyup" },
    ]);
    expect(automaton.currentNode.isFinished).toBe(true);
    expect(results.filter((r) => r === "failed").length).toBe(0);
  });

  test("'ぱんn' は pa + xn + n の 5 打でも完了する", () => {
    const automaton = build(composed, "ぱんn");
    const results = runInputsOn(automaton, [
      { key: VirtualKeys.P, type: "keydown" },
      { key: VirtualKeys.P, type: "keyup" },
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
      { key: VirtualKeys.X, type: "keydown" },
      { key: VirtualKeys.X, type: "keyup" },
      { key: VirtualKeys.N, type: "keydown" },
      { key: VirtualKeys.N, type: "keyup" },
      { key: VirtualKeys.N, type: "keydown" },
      { key: VirtualKeys.N, type: "keyup" },
    ]);
    expect(automaton.currentNode.isFinished).toBe(true);
    expect(results.filter((r) => r === "failed").length).toBe(0);
  });

  test("'ぱんn' は pa + n + n の 4 打では完了しない (ん を 1 打では消化できない)", () => {
    const automaton = build(composed, "ぱんn");
    runInputsOn(automaton, [
      { key: VirtualKeys.P, type: "keydown" },
      { key: VirtualKeys.P, type: "keyup" },
      { key: VirtualKeys.A, type: "keydown" },
      { key: VirtualKeys.A, type: "keyup" },
      { key: VirtualKeys.N, type: "keydown" },
      { key: VirtualKeys.N, type: "keyup" },
      { key: VirtualKeys.N, type: "keydown" },
      { key: VirtualKeys.N, type: "keyup" },
    ]);
    expect(automaton.currentNode.isFinished).toBe(false);
  });
});
