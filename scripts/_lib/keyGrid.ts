// scripts 配下の変換/可視化ツールで共有する、JIS106 配列上の key grid 関連定数。

// 修飾・機能キー: 配列図・変換グリッドのいずれでも対象外。
export const skipKeys: ReadonlySet<string> = new Set([
  "Backspace",
  "Enter",
  "ShiftLeft",
  "ShiftRight",
  "Space",
  "CapsLock",
  "Tab",
  "LangLeft",
  "LangRight",
]);

// ヘッダ表示用の短縮ラベル。VirtualKey 名は US 基準だが、JIS106 上の
// 刻印位置に合わせて BracketLeft=@, Quote=:, Backslash=], JpnRo=\ 等に差し替える。
export const shortLabel: Record<string, string> = {
  Backquote: "`",
  Digit1: "1", Digit2: "2", Digit3: "3", Digit4: "4", Digit5: "5",
  Digit6: "6", Digit7: "7", Digit8: "8", Digit9: "9", Digit0: "0",
  Minus: "-", Equal: "^", JpnYen: "¥",
  BracketLeft: "@", BracketRight: "[",
  Semicolon: ";", Quote: ":", Backslash: "]",
  Comma: ",", Period: ".", Slash: "/", JpnRo: "\\\\",
};

// yab / DvorakJ の配列定義ファイルの行と対応する、JIS106 の「文字キーのみ」
// 4 段 (13/12/12/11 列)。Backspace/Enter/Shift 等は含まない。
export const JIS_POSITIONS: readonly (readonly string[])[] = [
  ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0", "Minus", "Equal", "JpnYen"],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "BracketLeft", "BracketRight"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Semicolon", "Quote", "Backslash"],
  ["Z", "X", "C", "V", "B", "N", "M", "Comma", "Period", "Slash", "JpnRo"],
];

// 同時押し相方キーの英小文字表記 → VirtualKey 名。
// `Object.fromEntries` だと型が Record<string, string> になって扱いにくいので
// 明示的に書いている。
export const PARTNER_KEY_MAP: Record<string, string> = Object.fromEntries(
  [..."abcdefghijklmnopqrstuvwxyz"].map((c) => [c, c.toUpperCase()]),
);
