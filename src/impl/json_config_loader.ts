import { AndModifier, ModifierGroup } from "../core/modifier";
import { Rule, RuleEntry } from "../core/rule";
import { RuleStroke } from "../core/stroke";
import { product } from "../utils/iter";
import { VirtualKey, getKeyFromString } from "./virtual_key";

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
  modifiers?: string[];
};
type jsonSchema = {
  options?: { extendablePrefixCommon?: boolean };
  modifierGroups: { name: string; keys: string[] }[];
  entries: {
    input: stroke[];
    output: string;
    nextInput: stroke[];
    extendablePrefixCommon?: boolean;
  }[];
};

function loadModifierGroups(
  json: jsonSchema
): Map<string, ModifierGroup<VirtualKey>> {
  const modifierGroups = new Map<string, ModifierGroup<VirtualKey>>();
  json.modifierGroups.forEach((v) => {
    const modifiers: VirtualKey[] = [];
    v.keys.forEach((key) => {
      modifiers.push(getKeyFromString(key));
    });
    modifierGroups.set(v.name, new ModifierGroup(modifiers));
  });
  return modifierGroups;
}

function loadStroke(
  json: stroke,
  modifierGroupMap: Map<string, ModifierGroup<VirtualKey>>
): RuleStroke<VirtualKey>[] {
  const keys: VirtualKey[] = [];
  json.keys.forEach((key) => {
    keys.push(getKeyFromString(key));
  });
  if (keys.length === 0) {
    throw new Error("empty keys: " + json.toString());
  }
  return keys.map((key) => {
    const multipleStrokeModifier = new ModifierGroup<VirtualKey>(
      keys.filter((v) => v !== key)
    );
    const modifiers: ModifierGroup<VirtualKey>[] = [];
    json.modifiers?.forEach((modifierName) => {
      const modifier = modifierGroupMap.get(modifierName);
      if (!modifier) {
        throw new Error("undefined modifier: " + modifierName);
      }
      modifiers.push(modifier);
    });
    const unnecesaryModifiers = Array.from(modifierGroupMap.values()).filter(
      (v) => !modifiers.includes(v)
    );
    return new RuleStroke<VirtualKey>(
      key,
      new AndModifier(...modifiers, multipleStrokeModifier),
      unnecesaryModifiers
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
  modifierGroupMap: Map<string, ModifierGroup<VirtualKey>>
): RuleStroke<VirtualKey>[][] {
  /**
   * aとbの同時打鍵の後に、cとdの同時打鍵が必要な場合
   * input: [[a,b], [c,d]]
   * strokeGroups: [[a+mod(b),b+mod(a)], [c+mod(d),d+mod(c)]]
   */
  const strokeGroups = input.map((v) => loadStroke(v, modifierGroupMap));
  // strokeGroups の直積を作って返す
  return Array.from(product(strokeGroups));
}

function loadEntries(
  jsonConfig: jsonSchema,
  modifierGroupMap: Map<string, ModifierGroup<VirtualKey>>
): RuleEntry<VirtualKey>[] {
  const entries: RuleEntry<VirtualKey>[] = [];
  jsonConfig.entries.forEach((v) => {
    const inputExtended = loadInput(v.input, modifierGroupMap);
    const output = v.output;
    // 次の入力として使用するものは具体化されたもの1つだけなので、配列の先頭を取得する
    const nextInput = loadInput(v.nextInput, modifierGroupMap)[0];
    inputExtended.forEach((input) => {
      entries.push(
        new RuleEntry(
          input,
          output,
          nextInput,
          v.extendablePrefixCommon ??
            jsonConfig.options?.extendablePrefixCommon ??
            false
        )
      );
    });
  });
  return entries;
}

export function loadFromJsonConfigText(
  name: string,
  jsonText: string
): Rule<VirtualKey> {
  const jsonConfig = JSON.parse(jsonText);
  const modifierGroupMap = loadModifierGroups(jsonConfig);
  const entries = loadEntries(jsonConfig, modifierGroupMap);
  return new Rule(name, entries, Array.from(modifierGroupMap.values()));
}

export function loadFromJsonConfig(
  name: string,
  jsonConfig: jsonSchema
): Rule<VirtualKey> {
  const modifierGroupMap = loadModifierGroups(jsonConfig);
  const entries = loadEntries(jsonConfig, modifierGroupMap);
  return new Rule(name, entries, Array.from(modifierGroupMap.values()));
}
