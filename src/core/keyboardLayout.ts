import { setDefault } from "../utils/map";
import { AndModifier, ModifierGroup } from "./modifier";
import { Comparable } from "./rule";
import { RuleStroke } from "./ruleStroke";

export class KeyboardLayout<T extends Comparable<T>> {
  readonly strokesByChar: Map<string, RuleStroke<T>[]>;
  private readonly charByStroke: Map<string, string>;
  private readonly charByStrokeWithoutShift: Map<string, string>;
  constructor(
    readonly name: string,
    readonly mapping: [string, RuleStroke<T>][],
    readonly modifiers: ModifierGroup<T>[],
    readonly shiftKeys: T[]
  ) {
    this.strokesByChar = new Map();
    this.charByStroke = new Map();
    this.charByStrokeWithoutShift = new Map();
    mapping.forEach(([char, stroke]) => {
      setDefault(this.strokesByChar, char, []).push(stroke);
      setDefault(
        this.charByStroke,
        strokeToString(stroke, false, this.shiftKeys),
        char
      );
      setDefault(
        this.charByStrokeWithoutShift,
        strokeToString(stroke, true, this.shiftKeys),
        char
      );
    });
  }
  getStrokesByChar(char: string): RuleStroke<T>[] {
    const strokes = this.strokesByChar.get(char);
    if (!strokes) {
      throw new Error("invalid char: " + char);
    }
    return strokes;
  }
  getCharByKey(key: T, shifted: boolean): string {
    const stroke = new RuleStroke(
      key,
      shifted
        ? new AndModifier(new ModifierGroup(this.shiftKeys))
        : new AndModifier(),
      []
    );
    return this.getCharByStroke(stroke);
  }
  getCharByStroke(stroke: RuleStroke<T>): string {
    const char = this.charByStroke.get(
      strokeToString(stroke, false, this.shiftKeys)
    );
    if (char) {
      return char;
    }
    throw new Error(`invalid stroke: ${stroke.key.toString()}, mod: ${stroke.requiredModifier.toString()}`);
  }
  hasChar(char: string): boolean {
    return this.strokesByChar.has(char);
  }
}

function strokeToString<T extends Comparable<T>>(
  stroke: RuleStroke<T>,
  ignoreShift: boolean,
  shiftKeys: T[]
): string {
  if (ignoreShift) {
    return stroke.key.toString();
  }
  const mod = stroke.requiredModifier;
  return stroke.key.toString() + "\0" + shiftKeys.some((k) => mod.has(k));
}
