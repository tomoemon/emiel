import { AndModifier, ModifierGroup } from "../core/modifier";
import { Rule, RuleEntry } from "../core/rule";
import { RuleStroke } from "../core/ruleStroke";
import { VirtualKey } from "../core/virtualKey";
import { product } from "../utils/itertools";
import { defaultKanaNormalize } from "./charNormalizer";

/*
    {
      "input": [
        {
          "keys": ["Digit1"],
          "modifiers": []
        }
      ],
      "output": "ぬ",
      "nextInput": []
    },
*/

type stroke = {
  keys: string[];
  modifiers?: string[][];
};
type entry =
  | {
      // コメントだけの行も許可するため、undefinedを許容する
      input: stroke[];
      output: string;
      nextInput?: stroke[];
      extendCommonPrefixEntry?: boolean;
      comment?: string;
    }
  | { comment?: string };

export type jsonSchema = {
  extendCommonPrefixEntry?: boolean;
  entries: entry[];
};

function loadModifiers(modifiers: string[]): ModifierGroup {
  return new ModifierGroup(modifiers.map((key) => VirtualKey.getFromString(key)));
}

function loadStroke(jsonStroke: stroke): RuleStroke[] {
  const keys: VirtualKey[] = jsonStroke.keys.map((key) => VirtualKey.getFromString(key));
  if (keys.length === 0) {
    throw new Error("empty keys: " + jsonStroke.toString());
  }
  const modifierGroups: ModifierGroup[] =
    jsonStroke.modifiers?.map((modifierKeys) => {
      return loadModifiers(modifierKeys);
    }) || [];
  return keys.map((key) => {
    // 同時押しの場合は、他のキーをモディファイアとして扱う
    // keys: [A,B] の場合、key=A のとき、A+mod(B)
    const multipleStrokeModifier = keys.filter((v) => v !== key).map((v) => new ModifierGroup([v]));
    return new RuleStroke(key, new AndModifier(...modifierGroups, ...multipleStrokeModifier));
  });
}

/**
 * input の配列を読み込み、RuleStroke の配列の配列を返す。
 *
 * eg. 単打の連続の場合は1要素の配列を返す
 *    input: [{keys: ["A"]},{keys: ["B"]}]
 *    output: [[RuleStroke(A),RuleStroke(B)]]
 * eg. 同時打ちの場合は相互にモディファイアとするRuleStrokeを生成し複数要素の配列を返す
 *    input: [{keys: ["A","B"]}]
 *    output: [
 *              [RuleStroke(A+mod(B))],
 *              [RuleStroke(B+mod(A))],
 *            ]
 * eg. 3つ同時打ちの場合は相互にモディファイアとするRuleStrokeを生成し複数要素の配列を返す
 *    input: [{keys: ["A","B","C"]}]
 *    output: [
 *              [RuleStroke(A+mod(B)+mod(C))],
 *              [RuleStroke(B+mod(A)+mod(C))],
 *              [RuleStroke(C+mod(A)+mod(B))],
 *            ]
 * eg. 同時打ちの打鍵列の全組み合わせで相互にモディファイアとするRuleStrokeを生成し複数要素の配列を返す
 *    input: [{keys: ["A","B"]}, {keys: ["C","D"]}]
 *    output: [
 *              [RuleStroke(A+mod(B)),RuleStroke(C+mod(D))],
 *              [RuleStroke(B+mod(A)),RuleStroke(C+mod(D))],
 *              [RuleStroke(A+mod(B)),RuleStroke(D+mod(C))],
 *              [RuleStroke(B+mod(A)),RuleStroke(D+mod(C))],
 *            ]
 */
function loadInput(input: stroke[]): RuleStroke[][] {
  /**
   * aとbの同時打鍵の後に、cとdの同時打鍵が必要な場合
   * input: [[a,b], [c,d]]
   * strokeGroups: [[a+mod(b),b+mod(a)], [c+mod(d),d+mod(c)]]
   */
  const strokeGroups = input.map((v) => loadStroke(v));
  // strokeGroups の直積を作って返す
  return Array.from(product(strokeGroups));
}

function loadEntries(jsonEntries: entry[], jsonExtendablePrefixCommon: boolean): RuleEntry[] {
  const entries: RuleEntry[] = [];
  jsonEntries.forEach((v) => {
    if (!("input" in v)) {
      return;
    }
    const inputExtended = loadInput(v.input);
    const output = v.output;
    // 次の入力として使用するものは具体化されたもの1つだけなので、配列の先頭を取得する
    const nextInput = v.nextInput ? loadInput(v.nextInput)[0] : [];
    inputExtended.forEach((input) => {
      entries.push(
        new RuleEntry(
          input,
          output,
          nextInput,
          v.extendCommonPrefixEntry ?? jsonExtendablePrefixCommon ?? false,
        ),
      );
    });
  });
  return entries;
}

export function loadJsonRule(jsonRule: jsonSchema | string, name?: string): Rule {
  if (jsonRule instanceof String || typeof jsonRule === "string") {
    const schema = JSON.parse(jsonRule as string) as jsonSchema;
    return loadJsonRule(schema, name);
  }
  const entries = loadEntries(jsonRule.entries, jsonRule.extendCommonPrefixEntry ?? false);
  return new Rule(entries, defaultKanaNormalize, name);
}
