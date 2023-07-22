import { Automaton, InputResult } from "./automaton";
import { Comparable } from "./rule";
import { InputEvent } from "./stroke";

class SelectorInputResult<T> {
  constructor(readonly type: InputResult, readonly automaton: T) {}
}

type SelectorResult<T extends Comparable<T>> = {
  finished: Automaton<T>[];
  active: Automaton<T>[];
};

export class AutomatonSelector<T extends Comparable<T>> {
  // 現在入力試行対象になっている automaton
  private activeAutomatons: Automaton<T>[];
  /**
   * @param automatons 一時的に入力試行対象外になったものも含めたすべての automaton
   */
  constructor(private automatons: Automaton<T>[]) {
    this.activeAutomatons = automatons;
  }
  input(stroke: InputEvent<T>): SelectorInputResult<Automaton<T>>[] {
    const result = [];
    const newActiveAutomatons = [];
    let succeeded = false;
    for (const automaton of this.activeAutomatons) {
      const type = automaton.input(stroke);
      result.push(new SelectorInputResult(type, automaton));
      if (type.isSucceeded) {
        succeeded = true;
        if (type != inputResultFinished) {
          newActiveAutomatons.push(automaton);
        }
      }
    }
    if (!succeeded) {
      return result;
    }
    this.activeAutomatons = newActiveAutomatons;
    return result;
  }
  /**
   * 完了していない automaton をすべてキャンセルして active な状態に戻す
   */
  reset() {
    this.activeAutomatons.forEach((v) => v.reset());
    this.activeAutomatons = this.automatons.filter((v) => !v.isFinished);
  }
  append(automaton: Automaton<T>) {
    this.automatons.push(automaton);
  }
  /**
   * 完了した automaton を取り除いて返す
   */
  popFinished(): Automaton<T>[] {
    const result = this.activeAutomatons.filter((v) => v.isFinished);
    this.activeAutomatons = this.activeAutomatons.filter((v) => !v.isFinished);
    return result;
  }
}
