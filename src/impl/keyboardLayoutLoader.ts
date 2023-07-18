import { AndModifier, ModifierGroup } from "../core/modifier";
import { RuleStroke } from "../core/stroke";
import { VirtualKey, VirtualKeys, getKeyFromString } from "./virtualKey";
import { KeyboardLayout } from "../core/keyboardLayout";

type jsonSchema = {
  name: string;
  entries: { output: string; input: { key: string; shift: boolean } }[];
};

export function loadLayoutFromJsonConfig(
  jsonConfig: jsonSchema
): KeyboardLayout<VirtualKey> {
  const strokes: [string, RuleStroke<VirtualKey>][] = jsonConfig.entries.map(
    (v) => [
      v.output,
      new RuleStroke<VirtualKey>(
        getKeyFromString(v.input.key),
        v.input.shift ? modifierGroupSet.shift : nullModifier,
        v.input.shift ? modifiersExceptShift : allAvailableModifiers,
        true
      ),
    ]
  );
  return new KeyboardLayout(
    jsonConfig.name,
    strokes,
    allAvailableModifiers,
    modifierGroupSet.shift.groups[0].modifiers
  );
}

export function loadLayoutFromJsonConfigText(
  jsonText: string
): KeyboardLayout<VirtualKey> {
  const jsonConfig = JSON.parse(jsonText) as jsonSchema;
  return loadLayoutFromJsonConfig(jsonConfig);
}

const nullModifier = new AndModifier<VirtualKey>();
const modifierGroupSet = {
  shift: new AndModifier(
    new ModifierGroup<VirtualKey>([
      VirtualKeys.ShiftLeft,
      VirtualKeys.ShiftRight,
    ])
  ),
  control: new AndModifier(
    new ModifierGroup<VirtualKey>([
      VirtualKeys.ControlLeft,
      VirtualKeys.ControlRight,
    ])
  ),
  alt: new AndModifier(
    new ModifierGroup<VirtualKey>([VirtualKeys.AltLeft, VirtualKeys.AltRight])
  ),
  meta: new AndModifier(
    new ModifierGroup<VirtualKey>([VirtualKeys.MetaLeft, VirtualKeys.MetaRight])
  ),
};
const allAvailableModifiers = Object.values(modifierGroupSet).flatMap(
  (v) => v.groups
);
const modifiersExceptShift = allAvailableModifiers.filter(
  (v) => !v.equals(modifierGroupSet.shift.groups[0])
);
