import { KeyboardStateReader } from "./keyboardState";
import { VirtualKey } from "./virtualKey";

export interface Modifier {
  accept(state: KeyboardStateReader): boolean;
}

/**
 * 同じ修飾キーを表す1つのグループ
 * いずれか1つのキーが押されていればそのグループの修飾キーが押されていると扱う
 * 例：modifiers: [ShiftLeft, ShiftRight]
 */
export class ModifierGroup {
  constructor(readonly modifiers: VirtualKey[]) { }
  accept(state: KeyboardStateReader): boolean {
    return state.isAnyKeyDowned(...this.modifiers);
  }
  equals(other: ModifierGroup): boolean {
    return (
      this.modifiers.length === other.modifiers.length &&
      this.modifiers.every((v, i) => v === other.modifiers[i])
    );
  }
  has(key: VirtualKey): boolean {
    return this.modifiers.some((v) => v === key);
  }
  get groups(): ModifierGroup[] {
    return [this];
  }
  toString(): string {
    return `${this.modifiers.map((v) => v.toString()).join("|")}`;
  }
}

/**
 * 満たすべき修飾キーの集合
 * 各グループの修飾キーが全て押されているときに accept される
 */
export class AndModifier {
  readonly groups: ModifierGroup[];
  constructor(...groups: ModifierGroup[]) {
    this.groups = groups.filter((v) => v.modifiers.length > 0);
  }
  get isEmpty(): boolean {
    return this.groups.length === 0;
  }
  has(key: VirtualKey): boolean {
    return this.groups.some((v) => v.has(key));
  }
  accept(state: KeyboardStateReader): boolean {
    return this.groups.every((group) => group.accept(state));
  }
  equals(other: AndModifier): boolean {
    return (
      this.groups.length === other.groups.length &&
      this.groups.every((v, i) => v.equals(other.groups[i]))
    );
  }
  /**
   * state で1つ以上のキーが押されている時、そのキーがすべて修飾キーであるかどうか
   * @param state 
   * @returns 
   */
  onlyModifierDowned(state: KeyboardStateReader): boolean {
    return state.downedKeys.length > 0 &&
      state.downedKeys.every((key) =>
        this.groups.some((v) => {
          return v.has(key);
        })
      );
  }
  toString(): string {
    return `${this.groups.map((v) => v.toString()).join("&")}`;
  }
}
