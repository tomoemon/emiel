import { AndModifier } from "./modifier";
import { VirtualKey } from "./virtualKey";

export class RuleStroke {
  /**
   * @param key 入力が必要なキー
   * @param requiredModifier key を押下する前に事前に押下しておく必要がある修飾キー
   * @param romanChar ローマ字入力系（mozcRule）のルールで作られたRuleStrokeの場合、ローマ字を表す文字を持つ
   */
  constructor(
    readonly key: VirtualKey,
    readonly requiredModifier: AndModifier,
    readonly romanChar: string = "",
  ) {}
  equals(other: RuleStroke): boolean {
    return this.key === other.key && this.requiredModifier.equals(other.requiredModifier);
  }
}
