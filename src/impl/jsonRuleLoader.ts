import { AndModifier, ModifierGroup } from "../core/modifier";
import { Rule, RuleEntry } from "../core/rule";
import { RuleStroke } from "../core/ruleStroke";
import { product } from "../utils/itertools";
import { defaultKanaNormalize } from "./charNormalizer";
import { VirtualKey } from "../core/virtualKey";

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
type entry = {
  input: stroke[];
  output: string;
  nextInput: stroke[];
  extendCommonPrefixEntry?: boolean;
};
type jsonSchema = {
  extendCommonPrefixEntry: boolean;
  modifiers: string[];
  entries: entry[];
};

function loadModifiers(
  jsonModifiers: string[],
): ModifierGroup {
  return new ModifierGroup(
    jsonModifiers.map((key) => VirtualKey.getFromString(key))
  );
}

function loadStroke(
  jsonStroke: stroke,
  ruleModifierGroup: ModifierGroup,
): RuleStroke[] {
  const keys: VirtualKey[] = jsonStroke.keys.map((key) => VirtualKey.getFromString(key));
  if (keys.length === 0) {
    throw new Error("empty keys: " + jsonStroke.toString());
  }
  const modifierGroups: ModifierGroup[] = jsonStroke.modifiers?.map((modifierKeys) => {
    return loadModifiers(modifierKeys)
  }) || [];
  const necessaryModifierKeys = modifierGroups.flatMap((v) => v.modifiers);
  return keys.map((key) => {
    // 同時押しの場合は、他のキーをモディファイアとして扱う
    // keys: [A,B] の場合、key=A のとき、A+mod(B)
    const multipleStrokeModifier = new ModifierGroup(
      keys.filter((v) => v !== key)
    );
    // この Entry で必要な修飾キー以外の修飾キーは不要な（押してはいけない）修飾キーとして扱う
    const unnecesaryModifiers = ruleModifierGroup.modifiers.filter(
      (v) => !necessaryModifierKeys.includes(v) && !keys.includes(v)
    );
    return new RuleStroke(
      key,
      new AndModifier(...modifierGroups, multipleStrokeModifier),
      new ModifierGroup(unnecesaryModifiers),
    );
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
function loadInput(
  input: stroke[],
  ruleModifierGroup: ModifierGroup,
): RuleStroke[][] {
  /**
   * aとbの同時打鍵の後に、cとdの同時打鍵が必要な場合
   * input: [[a,b], [c,d]]
   * strokeGroups: [[a+mod(b),b+mod(a)], [c+mod(d),d+mod(c)]]
   */
  const strokeGroups = input.map((v) =>
    loadStroke(v, ruleModifierGroup)
  );
  // strokeGroups の直積を作って返す
  return Array.from(product(strokeGroups));
}

function loadEntries(
  jsonEntries: entry[],
  jsonExtendablePrefixCommon: boolean,
  ruleModifierGroup: ModifierGroup,
): RuleEntry[] {
  const entries: RuleEntry[] = [];
  jsonEntries.forEach((v) => {
    const inputExtended = loadInput(v.input, ruleModifierGroup);
    const output = v.output;
    // 次の入力として使用するものは具体化されたもの1つだけなので、配列の先頭を取得する
    const nextInput = loadInput(v.nextInput, ruleModifierGroup)[0];
    inputExtended.forEach((input) => {
      entries.push(
        new RuleEntry(
          input,
          output,
          nextInput,
          v.extendCommonPrefixEntry ?? jsonExtendablePrefixCommon ?? false
        )
      );
    });
  });
  return entries;
}

export function loadJsonRule(
  name: string,
  jsonRule: jsonSchema | string
): Rule {
  if (jsonRule instanceof String || typeof jsonRule === "string") {
    const schema = JSON.parse(jsonRule as string) as jsonSchema;
    return loadJsonRule(name, schema);
  }
  const modifierGroup = loadModifiers(
    jsonRule.modifiers,
  );
  const entries = loadEntries(
    jsonRule.entries,
    jsonRule.extendCommonPrefixEntry,
    modifierGroup,
  );
  return new Rule(
    name,
    entries,
    modifierGroup,
    defaultKanaNormalize
  );
}
