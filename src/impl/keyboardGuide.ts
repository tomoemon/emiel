import type { KeyboardGuide, KeyboardGuideLabel } from "../core/keyboardGuide";
import type { KeyboardLayout } from "../core/keyboardLayout";
import type { VirtualKey } from "../core/virtualKey";
import type { PhysicalKeyboardLayout } from "./physicalKeyboardLayout";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * 描画用に配置・ラベル解決済みの1キーの情報。UI フレームワークに依存しない純粋な論理データ。
 */
export type KeyPlacement = {
  key: VirtualKey;
  rect: Rect;
  topLeft?: string;
  top?: string;
  topRight?: string;
  left?: string;
  center?: string;
  right?: string;
  bottomLeft?: string;
  bottom?: string;
  bottomRight?: string;
};

/**
 * KeyboardGuide を物理/論理レイアウトに適用し、各キーの配置情報 (座標と解決済みラベル) を
 * 計算する。実際の描画 (HTML/DOM/Canvas 等) は呼び出し側の責務で、この関数はそのための
 * 論理データだけを返す。
 *
 * label が `{layout.*}` テンプレートだった場合は KeyboardLayout から動的に解決される。
 */
export function placeKeyboardGuide(
  guide: KeyboardGuide,
  physicalLayout: PhysicalKeyboardLayout,
  layout: KeyboardLayout,
  size: {
    keyWidth: number;
    keyHeight: number;
    gapX: number;
    gapY: number;
  },
): KeyPlacement[] {
  const placements = arrangeKeyPositions(
    physicalLayout,
    size.keyWidth,
    size.keyHeight,
    size.gapX,
    size.gapY,
  );
  const mapKeyToLabels = new Map<VirtualKey, KeyboardGuideLabel[]>(
    guide.guideData.entries.map((entry) => [entry.key, entry.labels]),
  );
  for (const placement of placements) {
    const labels = mapKeyToLabels.get(placement.key);
    if (!labels) continue;
    for (const label of labels) {
      placement[label.position] = resolveLabel(label.label, placement.key, layout);
    }
  }
  return placements;
}

function resolveLabel(label: string, key: VirtualKey, layout: KeyboardLayout): string {
  if (!label.startsWith("{")) {
    return label;
  }
  // 論理レイアウトに定義のないキーは空文字列を返す
  // (例: QwertyJIS で US101 の Backquote キーのガイドを表示するケース)
  switch (label) {
    case "{layout.shift.true}":
      return tryGetChar(layout, key, true);
    case "{layout.shift.false}":
      return tryGetChar(layout, key, false);
    case "{layout.alpha_or_sign}":
      return toUpperIfAlpha(tryGetChar(layout, key, false));
    case "{layout.shifted_alpha_or_sign}":
      return toUpperIfAlpha(tryGetChar(layout, key, true));
    case "{layout.sign}":
      return stripIfAlpha(tryGetChar(layout, key, false));
    case "{layout.shifted_sign}":
      return stripIfAlpha(tryGetChar(layout, key, true));
    default:
      throw new Error(`Unknown label: ${label}`);
  }
}

function tryGetChar(layout: KeyboardLayout, key: VirtualKey, shifted: boolean): string {
  try {
    return layout.getCharByKey(key, shifted);
  } catch {
    return "";
  }
}

function isAlpha(c: string): boolean {
  return ("a" <= c && c <= "z") || ("A" <= c && c <= "Z");
}

function toUpperIfAlpha(c: string): string {
  return isAlpha(c) ? c.toUpperCase() : c;
}

function stripIfAlpha(c: string): string {
  return isAlpha(c) ? "" : c;
}

function arrangeKeyPositions(
  physicalLayout: PhysicalKeyboardLayout,
  keyWidthUnit: number,
  keyHeightUnit: number,
  keyGapX: number,
  keyGapY: number,
): KeyPlacement[] {
  const { keys, leftMargins, keyWidth } = physicalLayout;
  const placements: KeyPlacement[] = [];
  keys.forEach((row, i) => {
    let x = leftMargins[i] * keyWidthUnit;
    const y = i * (keyHeightUnit + keyGapY);
    for (const key of row) {
      const width = (keyWidth[key] ?? 1) * keyWidthUnit;
      placements.push({ key, rect: { x, y, width, height: keyHeightUnit } });
      x += width + keyGapX;
    }
  });
  return placements;
}
