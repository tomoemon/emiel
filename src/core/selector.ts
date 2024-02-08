import { InputResult } from "./automaton";
import { Comparable } from "./rule";
import { InputEvent } from "./ruleStroke";

export interface Inputtable<T extends Comparable<T>> {
  input(stroke: InputEvent<T>): InputResult;
  reset(): void;
}

/**
 * 複数の automaton をまとめて、入力を受け付ける
 */
export class Selector<T extends Comparable<T>, U extends Inputtable<T>> {
  // 現在入力試行対象になっている automaton
  private _actives: readonly U[];

  constructor(private _items: readonly U[]) {
    this._actives = _items;
  }
  // Selectorに含まれるすべてのアイテム
  get items(): readonly U[] {
    return this._items;
  }
  // 現在入力試行対象になっているアイテム
  get activeItems(): readonly U[] {
    return this._actives;
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
    for (const inputtable of this._actives) {
      const result = inputtable.input(stroke);
      if (result.isSucceeded) {
        succeeded.push(inputtable);
        if (result.isFinished) {
          finished.push(inputtable);
        } else {
          // succeeded の中でも finish したものは次のアクティブとしては残さない
          newActive.push(inputtable);
        }
      } else if (result.isFailed) {
        failed.push(inputtable);
      } else if (result.isIgnored) {
        ignored.push(inputtable);
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
      this._actives = newActive;
      // 1つでも成功したものがあるとき、それ以外の item はすべて reset する
      failed.forEach((v) => v.reset());
      ignored.forEach((v) => v.reset());
    }
  }
  /**
   * すべての item をリセットして、すべてを active な状態に戻す
   * すでに finish しているものも active な状態に戻す
   */
  reset() {
    this._items.forEach((v) => v.reset());
    this._actives = this._items;
  }
  /**
   * 指定した item を取り除く
   * ※現在 active な inputtable であっても取り除かれる
   */
  remove(item: U): void {
    this._items = this._items.filter((v) => v !== item);
    this._actives = this._actives.filter(
      (v) => v !== item
    );
  }
  /**
   * 指定した inputtable を取り除き、新規の Selector を返す
   * 現在のインスタンスには影響を与えない
   */
  removed(item: U): Selector<T, U> {
    const newItems = this._items.filter((v) => v !== item);
    return new Selector(newItems);
  }
  /**
   * 指定した item を取り除き、新しい item を追加する
   * activated が true の場合、新しい item は即座に active な状態になる
   */
  replace(item: U, newItem: U, activated: boolean = false): void {
    this.remove(item);
    if (activated) {
      this._actives = this._actives.concat(newItem);
    }
  }
  /**
   * 指定した item を取り除き、新しい item を追加して、新規の Selector を返す
   * 現在のインスタンスには影響を与えない
   */
  replaced(item: U, newItem: U): Selector<T, U> {
    const newAutomatons = this._items.filter((v) => v !== item);
    return new Selector(newAutomatons.concat(newItem));
  }
  /**
   * 新しい item を追加する
   * activated が true の場合、新しい item は即座に active な状態になる
   */
  push(newItem: U, activated: boolean = false): void {
    this._items = this._items.concat(newItem);
    if (activated) {
      this._actives = this._actives.concat(newItem);
    }
  }
  /**
   * 新しい item を追加した新規の Selector を返す
   * 現在のインスタンスには影響を与えない
   */
  pushed(newItem: U): Selector<T, U> {
    return new Selector(this._items.concat(newItem));
  }
}
