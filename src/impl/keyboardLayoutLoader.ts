import * as v from "valibot";
import { KeyboardLayout } from "../core/keyboardLayout";
import { AndModifier, ModifierGroup } from "../core/modifier";
import { RuleStroke } from "../core/ruleStroke";
import { VirtualKeys, virtualKeySchema } from "../core/virtualKey";

const jsonKeyboardLayoutSchema = v.object({
  // レイアウト名（例: "QWERTY JIS"）
  name: v.string(),
  entries: v.array(
    v.object({
      // キー押下で出力される文字
      output: v.string(),
      input: v.object({
        // 物理キー
        key: virtualKeySchema,
        // Shift キーが必要か
        shift: v.boolean(),
      }),
    }),
  ),
});

export type JsonKeyboardLayoutSchema = v.InferOutput<typeof jsonKeyboardLayoutSchema>;

export function loadJsonKeyboardLayout(jsonLayout: unknown): KeyboardLayout {
  if (typeof jsonLayout === "string") {
    return loadJsonKeyboardLayout(JSON.parse(jsonLayout));
  }
  const validated = v.parse(jsonKeyboardLayoutSchema, jsonLayout);
  const strokes: [string, RuleStroke][] = validated.entries.map((entry) => [
    entry.output,
    new RuleStroke(
      entry.input.key,
      entry.input.shift ? shiftModifier : AndModifier.empty,
      entry.output,
    ),
  ]);
  return new KeyboardLayout(validated.name, strokes, shiftModifier.groups[0].modifiers);
}

const shiftModifier = new AndModifier(
  new ModifierGroup([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight]),
);
