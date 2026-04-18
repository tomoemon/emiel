import type { KeyboardStateReader } from "./keyboardState";
import type { VirtualKey } from "./virtualKey";

/**
 * 同じ修飾キーを表す1つのグループ
 * 与えられたキーのうち、少なくとも1つが押されていればそのグループが accept される
 * 例：modifiers: [ShiftLeft, ShiftRight]
 */
export class ModifierGroup {
  constructor(
    /** このグループを構成する修飾キー候補（いずれか 1 つ以上の押下で accept される） */
    readonly modifiers: VirtualKey[],
  ) {}
  /** modifiers のいずれか 1 つが押下中なら true */
  accept(state: KeyboardStateReader): boolean {
    return state.isAnyKeyDowned(...this.modifiers);
  }
  /** 同じ modifiers 構成であれば true（要素の順序も含めて比較） */
  equals(other: ModifierGroup): boolean {
    return (
      this.modifiers.length === other.modifiers.length &&
      this.modifiers.every((v, i) => v === other.modifiers[i])
    );
  }
  /** 重複を除外してマージし、新しい ModifierGroup を返す */
  merge(other: ModifierGroup): ModifierGroup {
    return new ModifierGroup([
      ...this.modifiers,
      ...other.modifiers.filter((v) => !this.modifiers.includes(v)),
    ]);
  }
  /** 指定キーがこのグループに含まれているか */
  has(key: VirtualKey): boolean {
    return this.modifiers.some((v) => v === key);
  }
  /** AndModifier と同形に扱うための便宜 getter。自身を 1 要素配列で返す。 */
  get groups(): ModifierGroup[] {
    return [this];
  }
  /** デバッグ表示用文字列（`ShiftLeft|ShiftRight` のように `|` 区切り） */
  toString(): string {
    return `${this.modifiers.map((v) => v.toString()).join("|")}`;
  }
  /** 空グループのシングルトン */
  static readonly empty = new ModifierGroup([]);
}

/**
 * 満たすべき修飾キーグループの集合
 * 与えられたグループがすべて accept されるときに accept される
 */
export class AndModifier {
  /** この AndModifier を構成する修飾キーグループ（空グループは除外済み） */
  readonly groups: ModifierGroup[];
  constructor(...groups: ModifierGroup[]) {
    this.groups = groups.filter((v) => v.modifiers.length > 0);
  }
  /** 修飾キーの指定が 1 つもないか */
  get isEmpty(): boolean {
    return this.groups.length === 0;
  }
  /** 指定キーが、いずれかのグループに含まれているか */
  has(key: VirtualKey): boolean {
    return this.groups.some((v) => v.has(key));
  }
  /** すべてのグループが accept されるときに true */
  accept(state: KeyboardStateReader): boolean {
    return this.groups.every((group) => group.accept(state));
  }
  /** グループ構成と順序が一致すれば true */
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
    return (
      state.downedKeys.length > 0 &&
      state.downedKeys.every((key) =>
        this.groups.some((v) => {
          return v.has(key);
        }),
      )
    );
  }
  /** デバッグ表示用文字列（グループを `&` で連結） */
  toString(): string {
    return `${this.groups.map((v) => v.toString()).join("&")}`;
  }
  /** 修飾キーなしを表すシングルトン */
  static readonly empty = new AndModifier();
}
