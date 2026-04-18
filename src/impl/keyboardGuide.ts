import type { KeyboardLayout } from "../core/keyboardLayout";
import type { VirtualKey } from "../core/virtualKey";
import type { PhysicalKeyboardLayout } from "./physicalKeyboardLayout";

/**
 * キートップの特定位置に表示する 1 つのラベル。
 * label には `{layout.alpha_or_sign}` 等のテンプレート文字列も指定できる
 * (`placeKeyboardGuide` 内で解決される)。
 */
export type KeyboardGuideLabel = {
  /** キー内でラベルを描画する位置 (9 区画) */
  position:
    | "topLeft"
    | "top"
    | "topRight"
    | "left"
    | "center"
    | "right"
    | "bottomLeft"
    | "bottom"
    | "bottomRight";
  /** 表示文字列 (テンプレート `{layout.*}` を含めてもよい) */
  label: string;
};

/**
 * キーボードガイドを構成する「物理キー → ラベル群」のマッピング。
 */
export type KeyboardGuideLabelMapping = {
  /** 各仮想キーに対して描画するラベルの集合 */
  entries: {
    /** 対象の物理キー */
    key: VirtualKey;
    /** そのキーに表示するラベル群 */
    labels: KeyboardGuideLabel[];
  }[];
};

/**
 * 入力方式ごとの「どの物理キーにどのラベルを付けるか」を保持する純粋なデータ構造。
 *
 * label には固定文字列のほか `{layout.alpha_or_sign}` などのテンプレートも入り得るが、
 * テンプレート解決や物理キーボードレイアウトへの配置は placeKeyboardGuide() が担う。
 */
export class KeyboardGuide {
  constructor(
    /** 「どの物理キーにどのラベルを付けるか」の純粋なデータ */
    readonly guideData: KeyboardGuideLabelMapping,
  ) {}
}

/** キートップの矩形領域を表す純粋な論理座標（描画フレームワーク非依存）。 */
export type Rect = {
  /** 左上 X 座標 */
  x: number;
  /** 左上 Y 座標 */
  y: number;
  /** 幅 */
  width: number;
  /** 高さ */
  height: number;
};

/**
 * 描画用に配置・ラベル解決済みの1キーの情報。UI フレームワークに依存しない純粋な論理データ。
 */
export type KeyPlacement = {
  /** 対象の物理キー */
  key: VirtualKey;
  /** キートップの描画矩形 */
  rect: Rect;
  /** 左上ラベル（未指定なら undefined） */
  topLeft?: string;
  /** 上ラベル */
  top?: string;
  /** 右上ラベル */
  topRight?: string;
  /** 左ラベル */
  left?: string;
  /** 中央ラベル */
  center?: string;
  /** 右ラベル */
  right?: string;
  /** 左下ラベル */
  bottomLeft?: string;
  /** 下ラベル */
  bottom?: string;
  /** 右下ラベル */
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
