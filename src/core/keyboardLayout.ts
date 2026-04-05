import { setDefault } from "../utils/map";
import { AndModifier, ModifierGroup } from "./modifier";
import { ModifierStroke } from "./ruleStroke";
import type { VirtualKey } from "./virtualKey";

export class KeyboardLayout {
  readonly strokesByChar: Map<string, ModifierStroke[]>;
  private readonly charByStroke: Map<string, string>;
  private readonly charByStrokeWithoutShift: Map<string, string>;
  /**
   *
   * @param name キーボードレイアウトの名前
   * @param mapping [output, stroke] の配列。例：["A", ModifierStroke(VirtualKeys.A, shift, [])]
   * @param shiftKeys
   */
  constructor(
    readonly name: string,
    readonly mapping: [string, ModifierStroke][],
    readonly shiftKeys: VirtualKey[],
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
  getStrokesByChar(char: string): ModifierStroke[] {
    const strokes = this.strokesByChar.get(char);
    if (!strokes) {
      throw new Error("invalid char: " + char);
    }
    return strokes;
  }
  getCharByKey(key: VirtualKey, shifted: boolean): string {
    const stroke = new ModifierStroke(
      key,
      shifted ? new AndModifier(new ModifierGroup(this.shiftKeys)) : new AndModifier(),
    );
    return this.getCharByStroke(stroke);
  }
  getCharByStroke(stroke: ModifierStroke): string {
    const char = this.charByStroke.get(strokeToString(stroke, false, this.shiftKeys));
    if (char) {
      return char;
    }
    throw new Error(
      `invalid stroke: ${stroke.key.toString()}, mod: ${stroke.requiredModifier.toString()}`,
    );
  }
  hasChar(char: string): boolean {
    return this.strokesByChar.has(char);
  }
}

function strokeToString(
  stroke: ModifierStroke,
  ignoreShift: boolean,
  shiftKeys: VirtualKey[],
): string {
  if (ignoreShift) {
    return stroke.key.toString();
  }
  const mod = stroke.requiredModifier;
  return stroke.key.toString() + "\0" + shiftKeys.some((k) => mod.has(k));
}
