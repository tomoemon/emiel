import { KeyboardStateReader } from "./keyboard_state";
import { Comparable } from "./rule";

export class ModifierGroup<T extends Comparable<T>> {
  constructor(readonly modifiers: T[]) {}
  accept(state: KeyboardStateReader<T>): boolean {
    return state.isAnyKeyDowned(...this.modifiers);
  }
  equals(other: ModifierGroup<T>): boolean {
    return (
      this.modifiers.length === other.modifiers.length &&
      this.modifiers.every((v, i) => v.equals(other.modifiers[i]))
    );
  }
  has(key: T): boolean {
    return this.modifiers.some((v) => v.equals(key));
  }
  get groups(): ModifierGroup<T>[] {
    return [this];
  }
  toString(): string {
    return `${this.modifiers.map((v) => v.toString()).join("|")}`;
  }
}

export class AndModifier<T extends Comparable<T>> {
  readonly groups: ModifierGroup<T>[];
  constructor(...groups: ModifierGroup<T>[]) {
    this.groups = groups.filter((v) => v.modifiers.length > 0);
  }
  get isEmpty(): boolean {
    return this.groups.length === 0;
  }
  has(key: T): boolean {
    return this.groups.some((v) => v.has(key));
  }
  accept(state: KeyboardStateReader<T>): boolean {
    return this.groups.every((group) => group.accept(state));
  }
  equals(other: AndModifier<T>): boolean {
    return (
      this.groups.length === other.groups.length &&
      this.groups.every((v, i) => v.equals(other.groups[i]))
    );
  }
  toString(): string {
    return `${this.groups.map((v) => v.toString()).join("&")}`;
  }
}
