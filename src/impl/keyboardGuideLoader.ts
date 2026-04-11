import * as v from "valibot";
import { KeyboardGuide } from "../core/keyboardGuide";
import { virtualKeySchema } from "../core/virtualKey";

export const jsonKeyboardGuideEntriesSchema = v.array(
  v.object({
    // 物理キー
    key: virtualKeySchema,
    // キートップに表示するラベル
    labels: v.array(
      v.object({
        // ラベルの表示位置
        position: v.picklist([
          "topLeft",
          "top",
          "topRight",
          "left",
          "center",
          "right",
          "bottomLeft",
          "bottom",
          "bottomRight",
        ]),
        // 表示文字列
        label: v.string(),
      }),
    ),
  }),
);

export const jsonKeyboardGuideSchema = v.object({
  entries: jsonKeyboardGuideEntriesSchema,
});

export type JsonKeyboardGuideSchema = v.InferOutput<typeof jsonKeyboardGuideSchema>;

export function loadJsonKeyboardGuide(jsonGuide: unknown): KeyboardGuide {
  if (typeof jsonGuide === "string") {
    return loadJsonKeyboardGuide(JSON.parse(jsonGuide));
  }
  const validated = v.parse(jsonKeyboardGuideSchema, jsonGuide);
  return new KeyboardGuide({ entries: validated.entries });
}
