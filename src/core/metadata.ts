/**
 * ルールやキーボードレイアウト等に付与する、名称と参照 URL のメタデータ。
 */
export type Metadata = {
  /** 表示用の名称 (例: "NICOLA", "QWERTY JIS") */
  name: string;
  /** 由来や仕様の参照 URL */
  url: string;
};

/** name, url ともに空文字の Metadata を生成する。省略時のデフォルトとして使用する。 */
export function emptyMetadata(): Metadata {
  return { name: "", url: "" };
}
