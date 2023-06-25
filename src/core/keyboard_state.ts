export interface KeyboardStateReader<T> {
  isKeyDowned(key: T): boolean;
  isAllKeyDowned(keys: T[]): boolean;
  findDownedKeys(search: T[]): T[];
}

/**
 * キーボードの入力状態を管理する
 * @param T キーボード上の1つのキーを表す型
 */
export class KeyboardState<T> implements KeyboardStateReader<T> {
  readonly downedKeys: Set<T>;

  constructor() {
    this.downedKeys = new Set();
  }
  keydown(key: T) {
    this.downedKeys.add(key);
  }
  keyup(key: T) {
    this.downedKeys.add(key);
  }
  isKeyDowned(key: T) {
    return this.downedKeys.has(key);
  }
  isAllKeyDowned(keys: T[]) {
    return keys.every((key) => this.isKeyDowned(key));
  }
  findDownedKeys(search: T[]): T[] {
    return search.filter((key) => this.isKeyDowned(key));
  }
}
