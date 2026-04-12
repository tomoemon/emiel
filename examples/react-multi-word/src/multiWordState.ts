import type { Automaton, InputEvent } from "emiel";

// この example 固有の「複数 word を並列に入力試行する」ステート。
// Automaton を mutable に保ったまま、ラッパーだけ immutable にすることで
// React の useState パターンに合わせている。
export class MultiWordState<T extends Automaton> {
  private readonly _items: readonly T[];
  private readonly _actives: readonly T[];

  constructor(items: readonly T[], actives?: readonly T[]) {
    this._items = items;
    this._actives = actives ?? items;
  }

  get items(): readonly T[] {
    return this._items;
  }

  input(stroke: InputEvent): {
    next: MultiWordState<T>;
    succeeded: T[];
    finished: T[];
    failed: T[];
    ignored: T[];
  } {
    const succeeded: T[] = [];
    const finished: T[] = [];
    const failed: T[] = [];
    const ignored: T[] = [];
    const newActive: T[] = [];
    for (const item of this._actives) {
      const result = item.input(stroke);
      if (result.isSucceeded) {
        succeeded.push(item);
        if (result.isFinished) {
          finished.push(item);
        } else {
          newActive.push(item);
        }
      } else if (result.isFailed) {
        failed.push(item);
      } else if (result.isIgnored) {
        ignored.push(item);
      }
    }
    let nextActives: readonly T[] = this._actives;
    if (succeeded.length > 0) {
      nextActives = newActive;
      failed.forEach((v) => v.reset());
      ignored.forEach((v) => v.reset());
    }
    return {
      next: new MultiWordState(this._items, nextActives),
      succeeded,
      finished,
      failed,
      ignored,
    };
  }

  reset(): MultiWordState<T> {
    this._items.forEach((v) => v.reset());
    return new MultiWordState(this._items);
  }

  replaced(item: T, newItem: T): MultiWordState<T> {
    const newItems = this._items.filter((v) => v !== item).concat(newItem);
    return new MultiWordState(newItems);
  }
}
