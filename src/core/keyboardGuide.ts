import type { VirtualKey } from "./virtualKey";

export type KeyboardGuideLabel = {
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
  label: string;
};

export type KeyboardGuideLabelMapping = {
  entries: {
    key: VirtualKey;
    labels: KeyboardGuideLabel[];
  }[];
};

/**
 * 入力方式ごとの「どの物理キーにどのラベルを付けるか」を保持する純粋なデータ構造。
 *
 * label には固定文字列のほか `{layout.alpha_or_sign}` などのテンプレートも入り得るが、
 * テンプレート解決や物理キーボードレイアウトへの配置は描画レイヤ (impl) の keyTops 関数が担う。
 */
export class KeyboardGuide {
  constructor(readonly guideData: KeyboardGuideLabelMapping) {}
}
