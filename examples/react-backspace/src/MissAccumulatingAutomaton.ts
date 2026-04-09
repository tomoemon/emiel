import type { Automaton, BackspaceExtensionType, InputEvent } from "emiel";
import { InputResult } from "emiel";

/**
 * ミスした回数分 backspace を押さないと正常な入力に戻れないゲームルールを実装した Automaton ラッパー。
 *
 * - ミス入力は蓄積され、backspace で1つずつ取り消す
 * - 蓄積中のミスがなくなると、backspace で成功ストロークを巻き戻す
 * - ミス蓄積中は正解キーでも automaton を遷移させない
 */
export class MissAccumulatingAutomaton {
  private _failedInputs: InputEvent[] = [];
  private readonly automaton: Automaton & BackspaceExtensionType;

  constructor(automaton: Automaton & BackspaceExtensionType) {
    this.automaton = automaton;
  }

  get failedInputs(): readonly InputEvent[] {
    return this._failedInputs;
  }

  input(stroke: InputEvent): InputResult {
    const [result, apply] = this.automaton.testInput(stroke);
    if (result.isBack) {
      apply();
      if (this._failedInputs.length > 0) {
        this._failedInputs = this._failedInputs.slice(0, -1);
      } else {
        this.automaton.back();
      }
      return result;
    }
    if (result.isIgnored) {
      return result;
    }
    if (result.isFailed) {
      apply();
      this._failedInputs = [...this._failedInputs, stroke];
      return result;
    }
    if (this._failedInputs.length > 0) {
      this._failedInputs = [...this._failedInputs, stroke];
      return InputResult.FAILED;
    }
    apply();
    return result;
  }

  reset(): void {
    this.automaton.reset();
    this._failedInputs = [];
  }

  getFinishedWord(): string {
    return this.automaton.getFinishedWord();
  }

  getPendingWord(): string {
    return this.automaton.getPendingWord();
  }

  getFinishedRoman(): string {
    return this.automaton.getFinishedRoman();
  }

  getPendingRoman(): string {
    return this.automaton.getPendingRoman();
  }

  getEffectiveEdgesCount(): number {
    return this.automaton.getEffectiveEdges().length;
  }

  getFailedInputCount(): number {
    return this.automaton.getFailedInputCount();
  }

  getEffectiveFailedInputCount(): number {
    return this.automaton.getEffectiveFailedInputCount();
  }
}
