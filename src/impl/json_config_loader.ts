import { AndModifier, ModifierGroup, Rule, RuleEntry } from "../core/rule";
import { RuleStroke } from "../core/stroke";
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

type input = {
  keys: string[];
  modifiers: string[];
};
type jsonSchema = {
  options: { extendablePrefixCommon?: boolean };
  modifierGroups: { name: string; keys: string[] }[];
  entries: {
    input: input[];
    output: string;
    nextInput: input[];
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

function loadInput(
  json: input,
  modifierGroupMap: Map<string, ModifierGroup<VirtualKey>>
): RuleStroke<VirtualKey> {
  const keys: VirtualKey[] = [];
  json.keys.forEach((key) => {
    keys.push(getKeyFromString(key));
  });
  if (keys.length === 0) {
    throw new Error("empty keys: " + json.toString());
  }
  const modifiers: ModifierGroup<VirtualKey>[] = [];
  json.modifiers.forEach((modifierName) => {
    const modifier = modifierGroupMap.get(modifierName);
    if (!modifier) {
      throw new Error("undefined modifier: " + modifierName);
    }
    modifiers.push(modifier);
  });
  const unnecesaryModifiers = Array.from(modifierGroupMap.values()).filter(
    (v) => !modifiers.includes(v)
  );
  // 同時打ちをサポートするタイミングでここを変更する
  return new RuleStroke<VirtualKey>(
    keys[0],
    new AndModifier(modifiers),
    unnecesaryModifiers
  );
}

function loadEntries(
  jsonConfig: jsonSchema,
  modifierGroupMap: Map<string, ModifierGroup<VirtualKey>>
): RuleEntry<VirtualKey>[] {
  const entries: RuleEntry<VirtualKey>[] = [];
  jsonConfig.entries.forEach((v) => {
    const input = v.input.map((i) => loadInput(i, modifierGroupMap));
    const output = v.output;
    const nextInput = v.nextInput.map((i) => loadInput(i, modifierGroupMap));
    entries.push(
      new RuleEntry(
        input,
        output,
        nextInput,
        v.extendablePrefixCommon ??
          jsonConfig.options.extendablePrefixCommon ??
          false
      )
    );
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
