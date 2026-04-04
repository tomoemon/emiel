import * as v from "valibot";
import { virtualKeySchema } from "../core/virtualKey";
import { KeyboardGuide } from "./keyboardGuide";

const jsonKeyboardGuideSchema = v.object({
  // ガイド名
  name: v.string(),
  // 物理キーボードレイアウト名（例: "jis_106", "us_101"）
  physicalLayout: v.string(),
  entries: v.array(
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
  ),
});

export type JsonKeyboardGuideSchema = v.InferOutput<typeof jsonKeyboardGuideSchema>;

export function loadJsonKeyboardGuide(jsonGuide: unknown): KeyboardGuide {
  if (typeof jsonGuide === "string") {
    return loadJsonKeyboardGuide(JSON.parse(jsonGuide));
  }
  const validated = v.parse(jsonKeyboardGuideSchema, jsonGuide);
  const entries = validated.entries.map((entry) => ({
    key: entry.key,
    labels: entry.labels,
  }));
  return new KeyboardGuide({
    name: validated.name,
    physicalLayout: validated.physicalLayout,
    entries: entries,
  });
}
