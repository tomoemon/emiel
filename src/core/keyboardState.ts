import { Comparable } from "./rule";

export interface KeyboardStateReader<T extends Comparable<T>> {
  get downedKeys(): readonly T[];
  isKeyDowned(key: T): boolean;
  isAllKeyDowned(...keys: T[]): boolean;
  isAnyKeyDowned(...keys: T[]): boolean;
  findDownedKeys(...keys: T[]): T[];
}

/**
 * キーボードの入力状態を管理する
 * @param T キーボード上の1つのキーを表す型
 */
export class KeyboardState<T extends Comparable<T>>
  implements KeyboardStateReader<T>
{
  // 理想的には押下されているキーを Set<T> として持ちたいが、
  // Javascript の仕様で、Set<T> にオブジェクトをセットする場合は、
  // オブジェクトの同値性ではなく（その方法がない）、同一性で比較されるため、重複した値がセットされてしまう恐れがある
  // そのため、ここでは配列として持った上で equals で明示的に同値チェックを行っている
  constructor(private _downedKeys: T[] = []) {}
  get downedKeys(): readonly T[] {
    return this._downedKeys;
  }
  keydown(key: T) {
    this._downedKeys.push(key);
  }
  keyup(key: T) {
    this._downedKeys = this._downedKeys.filter((v) => !v.equals(key));
  }
  isKeyDowned(key: T) {
    return this._downedKeys.indexOf(key) >= 0;
  }
  isAllKeyDowned(...keys: T[]) {
    return keys.every((key) => this.isKeyDowned(key));
  }
  isAnyKeyDowned(...keys: T[]) {
    return keys.some((key) => this.isKeyDowned(key));
  }
  findDownedKeys(...keys: T[]): T[] {
    return keys.filter((key) => this.isKeyDowned(key));
  }
}
