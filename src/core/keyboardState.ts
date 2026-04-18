import type { VirtualKey } from "./virtualKey";

/**
 * キーボードの押下状態を読み取るための read-only なインターフェース。
 * InputEvent.keyboardState として渡される値がこの型。
 */
export interface KeyboardStateReader {
  /** 現在押下中のキー一覧 */
  get downedKeys(): readonly VirtualKey[];
  /** 指定キーが押下中か */
  isKeyDowned(key: VirtualKey): boolean;
  /** 渡したキーが「すべて」押下中か */
  isAllKeyDowned(...keys: VirtualKey[]): boolean;
  /** 渡したキーのうち「いずれか」が押下中か */
  isAnyKeyDowned(...keys: VirtualKey[]): boolean;
  /** 渡したキーのうち、実際に押下中であるものだけを返す */
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
  /** 現在押下中のキー一覧（順序は押下順） */
  get downedKeys(): readonly VirtualKey[] {
    return this._downedKeys;
  }
  /** 指定キーを押下状態として記録する */
  keydown(key: VirtualKey) {
    this._downedKeys.push(key);
  }
  /** 指定キーを押下状態から外す */
  keyup(key: VirtualKey) {
    this._downedKeys = this._downedKeys.filter((v) => v !== key);
  }
  /** 指定キーが押下中か */
  isKeyDowned(key: VirtualKey) {
    return this._downedKeys.indexOf(key) >= 0;
  }
  /** 渡したキーが「すべて」押下中か */
  isAllKeyDowned(...keys: VirtualKey[]) {
    return keys.every((key) => this.isKeyDowned(key));
  }
  /** 渡したキーのうち「いずれか」が押下中か */
  isAnyKeyDowned(...keys: VirtualKey[]) {
    return keys.some((key) => this.isKeyDowned(key));
  }
  /** 渡したキーのうち、実際に押下中であるものだけを返す */
  findDownedKeys(...keys: VirtualKey[]): VirtualKey[] {
    return keys.filter((key) => this.isKeyDowned(key));
  }
}
