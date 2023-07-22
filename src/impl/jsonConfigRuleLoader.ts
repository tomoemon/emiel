import { AndModifier, ModifierGroup } from "../core/modifier";
import { Rule, RuleEntry } from "../core/rule";
import { RuleStroke } from "../core/stroke";
import { product } from "../utils/itertools";
import { defaultKanaNormalize } from "./charNormalizer";
import { VirtualKey, getVirtualKeyFromString } from "./virtualKey";

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
type entry = {
  input: stroke[];
  output: string;
  nextInput: stroke[];
  extendCommonPrefixEntry?: boolean;
};
type modifierGroup = {
  name: string;
  keys: string[];
};
type options = {
  aliasKeys?: { [key: string]: string };
};
type jsonSchema = {
  options?: options;
  extendCommonPrefixEntry: boolean;
  modifierGroups: modifierGroup[];
  entries: entry[];
};

function getKeyFromStringWithAliasKeysMap(
  key: string,
  aliasKeysMap: Map<string, VirtualKey>
): VirtualKey {
  if (aliasKeysMap.has(key)) {
    return aliasKeysMap.get(key)!;
  }
  return getVirtualKeyFromString(key);
}

function loadModifierGroups(
  jsonModifierGroups: modifierGroup[],
  aliasKeysMap: Map<string, VirtualKey>
): Map<string, ModifierGroup<VirtualKey>> {
  const modifierGroups = new Map<string, ModifierGroup<VirtualKey>>();
  jsonModifierGroups.forEach((v) => {
    const modifiers: VirtualKey[] = [];
    v.keys.forEach((key) => {
      modifiers.push(getKeyFromStringWithAliasKeysMap(key, aliasKeysMap));
    });
    modifierGroups.set(v.name, new ModifierGroup(modifiers));
  });
  return modifierGroups;
}

function loadStroke(
  json: stroke,
  modifierGroupMap: Map<string, ModifierGroup<VirtualKey>>,
  aliasKeysMap: Map<string, VirtualKey>
): RuleStroke<VirtualKey>[] {
  const keys: VirtualKey[] = [];
  json.keys.forEach((key) => {
    keys.push(getKeyFromStringWithAliasKeysMap(key, aliasKeysMap));
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
  modifierGroupMap: Map<string, ModifierGroup<VirtualKey>>,
  aliasKeysMap: Map<string, VirtualKey>
): RuleStroke<VirtualKey>[][] {
  /**
   * aとbの同時打鍵の後に、cとdの同時打鍵が必要な場合
   * input: [[a,b], [c,d]]
   * strokeGroups: [[a+mod(b),b+mod(a)], [c+mod(d),d+mod(c)]]
   */
  const strokeGroups = input.map((v) =>
    loadStroke(v, modifierGroupMap, aliasKeysMap)
  );
  // strokeGroups の直積を作って返す
  return Array.from(product(strokeGroups));
}

function loadEntries(
  jsonEntries: entry[],
  jsonExtendablePrefixCommon: boolean,
  modifierGroupMap: Map<string, ModifierGroup<VirtualKey>>,
  aliasKeysMap: Map<string, VirtualKey>
): RuleEntry<VirtualKey>[] {
  const entries: RuleEntry<VirtualKey>[] = [];
  jsonEntries.forEach((v) => {
    const inputExtended = loadInput(v.input, modifierGroupMap, aliasKeysMap);
    const output = v.output;
    // 次の入力として使用するものは具体化されたもの1つだけなので、配列の先頭を取得する
    const nextInput = loadInput(v.nextInput, modifierGroupMap, aliasKeysMap)[0];
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

function loadAliasKeys(jsonOptions?: options): Map<string, VirtualKey> {
  const aliasKeys = jsonOptions?.aliasKeys;
  if (!aliasKeys) {
    return new Map();
  }
  const aliasMap = new Map<string, VirtualKey>();
  Object.entries(aliasKeys).forEach(([aliasName, key]) => {
    const vKey = getVirtualKeyFromString(key);
    aliasMap.set(aliasName, vKey);
  });
  return aliasMap;
}

export function loadFromJsonConfig(
  name: string,
  jsonConfig: jsonSchema
): Rule<VirtualKey> {
  const aliasKeysMap = loadAliasKeys(jsonConfig.options);
  const modifierGroupMap = loadModifierGroups(
    jsonConfig.modifierGroups,
    aliasKeysMap
  );
  const entries = loadEntries(
    jsonConfig.entries,
    jsonConfig.extendCommonPrefixEntry,
    modifierGroupMap,
    aliasKeysMap
  );
  return new Rule(
    name,
    entries,
    Array.from(modifierGroupMap.values()),
    defaultKanaNormalize
  );
}

export function loadFromJsonConfigText(
  name: string,
  jsonText: string
): Rule<VirtualKey> {
  const jsonConfig = JSON.parse(jsonText) as jsonSchema;
  return loadFromJsonConfig(name, jsonConfig);
}
