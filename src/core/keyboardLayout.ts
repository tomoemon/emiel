import { setDefault } from "../utils/map";
import type { Metadata } from "./metadata";
import { emptyMetadata } from "./metadata";
import { AndModifier, ModifierGroup } from "./modifier";
import { SingleStroke } from "./ruleStroke";
import type { VirtualKey } from "./virtualKey";

/**
 * 論理キーボードレイアウト。
 * 「文字 ⇄ 物理キー」の対応関係を保持し、レイアウトに依存した文字／ストロークの相互変換を提供する。
 * QWERTY US, QWERTY JIS, Dvorak, Colemak などの物理レイアウトの違いを表現する。
 */
export class KeyboardLayout {
  /** 文字から、その文字を入力しうる SingleStroke 候補の一覧を引くインデックス */
  readonly strokesByChar: Map<string, SingleStroke[]>;
  private readonly charByStroke: Map<string, string>;
  private readonly charByStrokeWithoutShift: Map<string, string>;
  constructor(
    /** レイアウトの名前や URL 等の付随情報 */
    readonly metadata: Metadata = emptyMetadata(),
    /** [文字, 対応する SingleStroke] のペア列。同一文字に複数打鍵が存在してもよい */
    readonly mapping: [string, SingleStroke][] = [],
    /** このレイアウトで Shift として扱う仮想キー集合（例: [ShiftLeft, ShiftRight]） */
    readonly shiftKeys: VirtualKey[] = [],
  ) {
    this.strokesByChar = new Map();
    this.charByStroke = new Map();
    this.charByStrokeWithoutShift = new Map();
    mapping.forEach(([char, stroke]) => {
      setDefault(this.strokesByChar, char, []).push(stroke);
      setDefault(this.charByStroke, strokeToString(stroke, false, this.shiftKeys), char);
      setDefault(this.charByStrokeWithoutShift, strokeToString(stroke, true, this.shiftKeys), char);
    });
  }
  /**
   * 指定文字を入力しうる SingleStroke 候補を返す。該当する打鍵が無い場合は例外を投げる。
   */
  getStrokesByChar(char: string): SingleStroke[] {
    const strokes = this.strokesByChar.get(char);
    if (!strokes) {
      throw new Error("invalid char: " + char);
    }
    return strokes;
  }
  /**
   * 物理キー + Shift 押下状態の組み合わせから、このレイアウトで入力される文字を返す。
   * 定義がない組み合わせを渡した場合は例外を投げる。
   */
  getCharByKey(key: VirtualKey, shifted: boolean): string {
    const stroke = new SingleStroke(
      key,
      shifted ? new AndModifier(new ModifierGroup(this.shiftKeys)) : new AndModifier(),
    );
    return this.getCharByStroke(stroke);
  }
  /**
   * SingleStroke に対応する文字を返す。定義がない場合は例外を投げる。
   */
  getCharByStroke(stroke: SingleStroke): string {
    const char = this.charByStroke.get(strokeToString(stroke, false, this.shiftKeys));
    if (char) {
      return char;
    }
    throw new Error(
      `invalid stroke: ${stroke.key.toString()}, mod: ${stroke.requiredModifier.toString()}`,
    );
  }
  /** この KeyboardLayout 上で、指定文字を入力する打鍵が 1 つでも定義されているか */
  hasChar(char: string): boolean {
    return this.strokesByChar.has(char);
  }
}

function strokeToString(
  stroke: SingleStroke,
  ignoreShift: boolean,
  shiftKeys: VirtualKey[],
): string {
  if (ignoreShift) {
    return stroke.key.toString();
  }
  const mod = stroke.requiredModifier;
  return stroke.key.toString() + "\0" + shiftKeys.some((k) => mod.has(k));
}
