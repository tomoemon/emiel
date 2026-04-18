import * as v from "valibot";
import { KeyboardLayout } from "../core/keyboardLayout";
import { AndModifier, ModifierGroup } from "../core/modifier";
import { SingleStroke } from "../core/ruleStroke";
import { VirtualKeys, virtualKeySchema } from "../core/virtualKey";

const metadataSchema = v.optional(
  v.object({
    name: v.optional(v.string()),
    url: v.optional(v.string()),
  }),
);

const jsonKeyboardLayoutSchema = v.object({
  metadata: metadataSchema,
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

/** `loadJsonKeyboardLayout` が受け付ける JSON のスキーマ推論型。 */
export type JsonKeyboardLayoutSchema = v.InferOutput<typeof jsonKeyboardLayoutSchema>;

/**
 * JSON 文字列またはパース済みオブジェクトから `KeyboardLayout` を読み込む。
 * 物理キーと出力文字の対応、および Shift 有無を定義した JSON を解釈する。
 */
export function loadJsonKeyboardLayout(jsonLayout: unknown): KeyboardLayout {
  if (typeof jsonLayout === "string") {
    return loadJsonKeyboardLayout(JSON.parse(jsonLayout));
  }
  const validated = v.parse(jsonKeyboardLayoutSchema, jsonLayout);
  const strokes: [string, SingleStroke][] = validated.entries.map((entry) => [
    entry.output,
    new SingleStroke(
      entry.input.key,
      entry.input.shift ? shiftModifier : AndModifier.empty,
      entry.output,
    ),
  ]);
  const metadata = {
    name: validated.metadata?.name ?? "",
    url: validated.metadata?.url ?? "",
  };
  return new KeyboardLayout(metadata, strokes, shiftModifier.groups[0].modifiers);
}

const shiftModifier = new AndModifier(
  new ModifierGroup([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight]),
);
