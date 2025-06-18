import { describe, expect, it } from "vitest";
import { loadPresetKeyboardLayoutQwertyJis } from "../impl/presetKeyboardLayout";
import { loadPresetRuleRoman } from "../impl/presetRules";
import { Automaton } from "./automatonBuilder";
import { AutomatonState } from "./automatonState";

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
