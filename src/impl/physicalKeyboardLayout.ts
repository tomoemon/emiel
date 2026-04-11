import * as v from "valibot";
import { virtualKeySchema } from "../core/virtualKey";

const jsonPhysicalKeyboardLayoutSchema = v.object({
  // 段と列に対応する仮想キー (keys[row][col])
  keys: v.array(v.array(virtualKeySchema)),
  // 段ごとの左余白 (単位: keyWidthUnit)
  leftMargins: v.array(v.number()),
  // 特殊幅キー (Shift, Space 等) の幅 (単位: keyWidthUnit)。未指定のキーは 1
  keyWidth: v.record(virtualKeySchema, v.number()),
});

/**
 * 物理キーボード上のキー配置を記述するデータ型。
 * placeKeyboardGuide の描画領域計算で参照される。
 */
export type PhysicalKeyboardLayout = v.InferOutput<typeof jsonPhysicalKeyboardLayoutSchema>;

export function loadJsonPhysicalKeyboardLayout(jsonLayout: unknown): PhysicalKeyboardLayout {
  if (typeof jsonLayout === "string") {
    return loadJsonPhysicalKeyboardLayout(JSON.parse(jsonLayout));
  }
  return v.parse(jsonPhysicalKeyboardLayoutSchema, jsonLayout);
}
