import { KeyboardLayout } from "../core/keyboardLayout";
import { AndModifier, ModifierGroup } from "../core/modifier";
import { RuleStroke } from "../core/ruleStroke";
import { VirtualKey, VirtualKeys } from "../core/virtualKey";

type jsonSchema = {
  name: string;
  entries: { output: string; input: { key: string; shift: boolean } }[];
};

export function loadJsonKeyboardLayout(jsonLayout: jsonSchema | string): KeyboardLayout {
  if (jsonLayout instanceof String || typeof jsonLayout === "string") {
    const schema = JSON.parse(jsonLayout as string) as jsonSchema;
    return loadJsonKeyboardLayout(schema);
  }
  const strokes: [string, RuleStroke][] = jsonLayout.entries.map((v) => [
    v.output,
    new RuleStroke(
      VirtualKey.getFromString(v.input.key),
      v.input.shift ? shiftModifier : AndModifier.empty,
      v.output,
    ),
  ]);
  return new KeyboardLayout(jsonLayout.name, strokes, shiftModifier.groups[0].modifiers);
}

const shiftModifier = new AndModifier(
  new ModifierGroup([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight]),
);
