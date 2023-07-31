import { Automaton } from "./automaton";
import { Comparable } from "./rule";
import { InputEvent } from "./stroke";

export class Selector<T extends Comparable<T>, U extends Automaton<T>> {
  // 現在入力試行対象になっている automaton
  private _activeAutomatons: readonly U[];
  /**
   * @param _automatons 一時的に入力試行対象外になったものも含めたすべての automaton
   */
  constructor(private _automatons: readonly U[]) {
    this._activeAutomatons = _automatons;
  }
  get automatons(): readonly U[] {
    return this._automatons;
  }
  get activeAutomatons(): readonly U[] {
    return this._activeAutomatons;
  }
  input(
    stroke: InputEvent<T>,
    callback?: {
      succeeded?: (automaton: U) => void;
      failed?: (automaton: U) => void;
      finished?: (automaton: U) => void;
      ignored?: (automaton: U) => void;
    }
  ) {
    const finished: U[] = [];
    const succeeded: U[] = [];
    const failed: U[] = [];
    const ignored: U[] = [];
    const newActive: U[] = [];
    for (const automaton of this._activeAutomatons) {
      const result = automaton.input(stroke);
      if (result.isSucceeded) {
        succeeded.push(automaton);
        if (result.isFinished) {
          finished.push(automaton);
        } else {
          // succeeded の中でも finish したものは次のアクティブとしては残さない
          newActive.push(automaton);
        }
      } else if (result.isFailed) {
        failed.push(automaton);
      } else if (result.isIgnored) {
        ignored.push(automaton);
      }
    }
    if (callback?.succeeded) {
      succeeded.forEach((v) => callback.succeeded!(v));
    }
    if (callback?.finished) {
      finished.forEach((v) => callback.finished!(v));
    }
    if (callback?.failed) {
      failed.forEach((v) => callback.failed!(v));
    }
    if (callback?.ignored) {
      ignored.forEach((v) => callback.ignored!(v));
    }
    if (succeeded.length > 0) {
      this._activeAutomatons = newActive;
      // 1つでも成功したものがあるとき、それ以外の automaton はすべて reset する
      failed.forEach((v) => v.reset());
      ignored.forEach((v) => v.reset());
    }
  }
  /**
   * 現在 active な automaton をすべてリセットして、すべてを active な状態に戻す
   */
  reset() {
    this._activeAutomatons.forEach((v) => v.reset());
    this._activeAutomatons = this._automatons.filter((v) => !v.isFinished);
  }
  /**
   * 指定した automaton を取り除く
   * ※現在 active な automaton であっても取り除かれる
   */
  remove(automaton: U): void {
    this._automatons = this._automatons.filter((v) => v !== automaton);
    this._activeAutomatons = this._activeAutomatons.filter(
      (v) => v !== automaton
    );
  }
  /**
   * 指定した automaton を取り除き、新規の AutomatonSelector を返す
   * 現在のインスタンスには影響を与えない
   */
  removed(automaton: U): Selector<T, U> {
    const newAutomatons = this._automatons.filter((v) => v !== automaton);
    return new Selector(newAutomatons);
  }
  /**
   * 指定した automaton を取り除き、新しい automaton を追加する
   * activated が true の場合、新しい automaton は即座に active な状態になる
   */
  replace(automaton: U, newAutomaton: U, activated: boolean = false): void {
    this.remove(automaton);
    if (activated) {
      this._activeAutomatons = this._activeAutomatons.concat(newAutomaton);
    }
  }
  /**
   * 指定した automaton を取り除き、新しい automaton を追加して、新規の AutomatonSelector を返す
   * 現在のインスタンスには影響を与えない
   */
  replaced(automaton: U, newAutomaton: U): Selector<T, U> {
    const newAutomatons = this._automatons.filter((v) => v !== automaton);
    return new Selector(newAutomatons.concat(newAutomaton));
  }
  /**
   * 新しい automaton を追加する
   * activated が true の場合、新しい automaton は即座に active な状態になる
   */
  push(newAutomaton: U, activated: boolean = false): void {
    this._automatons = this._automatons.concat(newAutomaton);
    if (activated) {
      this._activeAutomatons = this._activeAutomatons.concat(newAutomaton);
    }
  }
  /**
   * 新しい automaton を追加した新規の AutomatonSelector を返す
   * 現在のインスタンスには影響を与えない
   */
  pushed(newAutomaton: U): Selector<T, U> {
    return new Selector(this._automatons.concat(newAutomaton));
  }
}
