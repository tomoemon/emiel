import type { Automaton, CurrentView, InputEvent } from "emiel";
import { InputResult } from "emiel";

export class MissClearingAutomaton {
  private _failedInputs: InputEvent[] = [];

  constructor(private readonly automaton: Automaton) {}

  get failedInputs(): readonly InputEvent[] {
    return this._failedInputs;
  }

  input(stroke: InputEvent): InputResult {
    const [result, apply] = this.automaton.testInput(stroke);
    if (result.isBack) {
      if (this._failedInputs.length > 0) {
        apply();
        this._failedInputs = [];
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

  currentView(): CurrentView {
    return this.automaton.currentView();
  }

  get succeededCount(): number {
    return this.automaton.eventsView().succeededCount;
  }

  get failedCount(): number {
    return this.automaton.eventsView().failedCount;
  }
}
