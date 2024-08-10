import { KeyboardStateReader } from "./keyboardState";
import { VirtualKey } from "./virtualKey";

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
  toString(): string {
    return `${this.groups.map((v) => v.toString()).join("&")}`;
  }
}
