import { AndModifier } from "./modifier";
import type { VirtualKey } from "./virtualKey";

/**
 * 入力ルールの1打鍵を表す型。「モディファイア型（単キー）」と「同時押し型（複数キー順不同）」の
 * discriminated union。
 *
 * - ModifierStroke: 主キー 1 つ + 事前押下必須のモディファイア (Shift+A など、順序あり)。
 * - SimultaneousStroke: 複数キーの順不同同時押し (A+B など)。追加で requiredModifier を持てるため、
 *   「Space を先押ししながら A+J を同時押し」 (naginata の濁音等) も表現できる。
 */
export type RuleStroke = ModifierStroke | SimultaneousStroke;

/**
 * 順序ありの入力打鍵を表すクラス。
 * requiredModifier は key を押下する前に事前に押下されている必要がある修飾キー群。
 */
export class ModifierStroke {
  readonly kind = "modifier" as const;
  /**
   * @param key 入力が必要なキー
   * @param requiredModifier key を押下する前に事前に押下しておく必要がある修飾キー
   * @param romanChar ローマ字入力系（mozcRule）のルールで作られた RuleStroke の場合、ローマ字を表す文字を持つ
   */
  constructor(
    readonly key: VirtualKey,
    readonly requiredModifier: AndModifier,
    readonly romanChar: string = "",
  ) {}
  equals(other: RuleStroke): boolean {
    if (other.kind !== "modifier") {
      return false;
    }
    return this.key === other.key && this.requiredModifier.equals(other.requiredModifier);
  }
}

/**
 * 順不同の同時押し入力打鍵を表すクラス。
 * keys に含まれるキーがすべて同時に押下されていれば確定する（押下順序は問わない）。
 * 追加で requiredModifier を持ち、「Space を先押し + A+J を同時押し」のように
 * モディファイア (順序あり) と同時押し (順不同) を同一ストロークで併用できる。
 */
export class SimultaneousStroke {
  readonly kind = "simultaneous" as const;
  readonly keys: readonly VirtualKey[];
  /**
   * @param keys 同時に押下されている必要があるキー群（2個以上）。順序は保持するが集合意味論で評価する
   * @param requiredModifier keys を同時押しする前に事前押下されている必要がある修飾キー (順序あり)
   * @param romanChar 将来の拡張用。現状 SimultaneousStroke では未使用
   */
  constructor(
    keys: readonly VirtualKey[],
    readonly requiredModifier: AndModifier = AndModifier.empty,
    readonly romanChar: string = "",
  ) {
    if (keys.length < 2) {
      throw new Error(
        `SimultaneousStroke requires at least 2 keys, but got ${keys.length}. Use ModifierStroke for single-key strokes.`,
      );
    }
    // 重複除去（集合意味論）
    const dedup: VirtualKey[] = [];
    for (const k of keys) {
      if (!dedup.includes(k)) {
        dedup.push(k);
      }
    }
    this.keys = dedup;
  }
  equals(other: RuleStroke): boolean {
    if (other.kind !== "simultaneous") {
      return false;
    }
    if (this.keys.length !== other.keys.length) {
      return false;
    }
    if (!this.requiredModifier.equals(other.requiredModifier)) {
      return false;
    }
    // 順不同で一致判定
    return this.keys.every((k) => other.keys.includes(k));
  }
}

export function isModifierStroke(stroke: RuleStroke): stroke is ModifierStroke {
  return stroke.kind === "modifier";
}

export function isSimultaneousStroke(stroke: RuleStroke): stroke is SimultaneousStroke {
  return stroke.kind === "simultaneous";
}

/** RuleStroke の種別を問わず、ルートとなるキー群（modifier: 主キー1つ / simultaneous: 全キー）を返す。 */
export function ruleStrokeKeys(stroke: RuleStroke): readonly VirtualKey[] {
  if (stroke.kind === "modifier") {
    return [stroke.key];
  }
  return stroke.keys;
}

/** RuleStroke の romanChar を取得する。 */
export function ruleStrokeRomanChar(stroke: RuleStroke): string {
  return stroke.romanChar;
}
