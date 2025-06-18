import { AutomatonImpl } from "./automaton";
import * as AutomatonGetters from "./automatonGetters";
import { AutomatonState } from "./automatonState";
import { buildKanaNode } from "./builderKanaGraph";
import { buildStrokeNode } from "./builderStrokeGraph";
import { Rule } from "./rule";
import { RuleStroke } from "./ruleStroke";

export type Automaton = AutomatonImpl & DefaultExtensionType;

export function build(rule: Rule, kanaText: string): Automaton {
  const [_, endKanaNode] = buildKanaNode(rule, kanaText);
  const automaton = new AutomatonImpl(kanaText, buildStrokeNode(endKanaNode), rule);
  return automaton.with(defaultExtension);
}

/**
 * デフォルトの拡張
 */
const defaultExtension = {
  /**
   * 入力が完了したかな文字列
   */
  getFinishedWord(state: AutomatonState): string {
    return AutomatonGetters.getFinishedWord(state);
  },

  /**
   * 入力が完了していないかな文字列
   */
  getPendingWord(state: AutomatonState): string {
    return AutomatonGetters.getPendingWord(state);
  },

  /**
   * 入力が完了したローマ字列（ローマ字系の Rule の場合のみ）
   */
  getFinishedRoman(state: AutomatonState): string {
    return AutomatonGetters.getFinishedRoman(state);
  },

  /**
   * 入力が完了していないローマ字列（ローマ字系の Rule の場合のみ）
   */
  getPendingRoman(state: AutomatonState): string {
    return AutomatonGetters.getPendingRoman(state);
  },

  /**
   * 入力が完了したキーストローク列
   */
  getFinishedStroke(state: AutomatonState): RuleStroke[] {
    return AutomatonGetters.getFinishedStroke(state);
  },

  /**
   * 現在の入力状態から最短ストローク数で打ち切れるストローク列を返す
   */
  getPendingStroke(state: AutomatonState): RuleStroke[] {
    return AutomatonGetters.getPendingStroke(state);
  },

  /**
   * 1打目の入力時刻
   */
  getFirstInputTime(state: AutomatonState): Date {
    return AutomatonGetters.getFirstInputTime(state);
  },

  /**
   * 最後の入力時刻
   */
  getLastInputTime(state: AutomatonState): Date {
    return AutomatonGetters.getLastInputTime(state);
  },

  /**
   * ミス入力数の合計
   */
  getFailedInputCount(state: AutomatonState): number {
    return AutomatonGetters.getFailedInputCount(state);
  },

  /**
   * ミス入力も含めた打鍵数の合計
   */
  getTotalInputCount(state: AutomatonState): number {
    return AutomatonGetters.getTotalInputCount(state);
  },

  /**
   * 入力が完了しているかどうか
   */
  isFinished(state: AutomatonState): boolean {
    return AutomatonGetters.isFinished(state);
  },
} as const;

// デフォルト拡張の型（引数なしバージョン）
export type DefaultExtensionType = {
  getFinishedWord(): string;
  getPendingWord(): string;
  getFinishedRoman(): string;
  getPendingRoman(): string;
  getFinishedStroke(): RuleStroke[];
  getPendingStroke(): RuleStroke[];
  getFirstInputTime(): Date;
  getLastInputTime(): Date;
  getFailedInputCount(): number;
  getTotalInputCount(): number;
  isFinished(): boolean;
};
