import { VirtualKey } from "./virtualKey";

export interface KeyboardStateReader {
  get downedKeys(): readonly VirtualKey[];
  isKeyDowned(key: VirtualKey): boolean;
  isAllKeyDowned(...keys: VirtualKey[]): boolean;
  isAnyKeyDowned(...keys: VirtualKey[]): boolean;
  findDownedKeys(...keys: VirtualKey[]): VirtualKey[];
}

/**
 * キーボードの入力状態を管理する
 * @param T キーボード上の1つのキーを表す型
 */
export class KeyboardState implements KeyboardStateReader {
  // 理想的には押下されているキーを Set<T> として持ちたいが、
  // Javascript の仕様で、Set<T> にオブジェクトをセットする場合は、
  // オブジェクトの同値性ではなく（その方法がない）、同一性で比較されるため、重複した値がセットされてしまう恐れがある
  // そのため、ここでは配列として持った上で equals で明示的に同値チェックを行っている
  constructor(private _downedKeys: VirtualKey[] = []) {}
  get downedKeys(): readonly VirtualKey[] {
    return this._downedKeys;
  }
  keydown(key: VirtualKey) {
    this._downedKeys.push(key);
  }
  keyup(key: VirtualKey) {
    this._downedKeys = this._downedKeys.filter((v) => v !== key);
  }
  isKeyDowned(key: VirtualKey) {
    return this._downedKeys.indexOf(key) >= 0;
  }
  isAllKeyDowned(...keys: VirtualKey[]) {
    return keys.every((key) => this.isKeyDowned(key));
  }
  isAnyKeyDowned(...keys: VirtualKey[]) {
    return keys.some((key) => this.isKeyDowned(key));
  }
  findDownedKeys(...keys: VirtualKey[]): VirtualKey[] {
    return keys.filter((key) => this.isKeyDowned(key));
  }
}
