import { AndModifier, ModifierGroup } from "../core/modifier";
import { RuleStroke } from "../core/ruleStroke";
import { VirtualKey, VirtualKeys, getVirtualKeyFromString } from "./virtualKey";
import { KeyboardLayout } from "../core/keyboardLayout";

type jsonSchema = {
  name: string;
  entries: { output: string; input: { key: string; shift: boolean } }[];
};

export function loadJsonKeyboardLayout(
  jsonLayout: jsonSchema | string
): KeyboardLayout<VirtualKey> {
  if (jsonLayout instanceof String || typeof jsonLayout === "string") {
    const schema = JSON.parse(jsonLayout as string) as jsonSchema;
    return loadJsonKeyboardLayout(schema);
  }
  const strokes: [string, RuleStroke<VirtualKey>][] = jsonLayout.entries.map(
    (v) => [
      v.output,
      new RuleStroke<VirtualKey>(
        getVirtualKeyFromString(v.input.key),
        v.input.shift ? modifierGroupSet.shift : nullModifier,
        v.input.shift ? modifiersExceptShift : allAvailableModifiers,
        v.output
      ),
    ]
  );
  return new KeyboardLayout(
    jsonLayout.name,
    strokes,
    allAvailableModifiers,
    modifierGroupSet.shift.groups[0].modifiers
  );
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
