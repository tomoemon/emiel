import { KeyboardStateReader } from "../core/keyboard_state";
import { Acceptable, Comparable } from "../core/rule";
import { VirtualKey } from "./virtual_key";

export type KeyEventType = "keyup" | "keydown";

export class InputKeyStroke {
  constructor(
    readonly key: VirtualKey,
    readonly type: KeyEventType,
    readonly timestamp: Date
  ) {}
}

export class InputKeyEvent {
  constructor(
    readonly input: InputKeyStroke,
    readonly keyboardState: KeyboardStateReader<VirtualKey>
  ) {}
}

type Modifier = OrModifier | AndModifier | NullModifier;

export class NullModifier {
  constructor(readonly type: "null" = "null") {}
}

export class OrModifier {
  constructor(readonly modifiers: VirtualKey[], readonly type: "or" = "or") {}
}

export class AndModifier {
  constructor(readonly modifiers: VirtualKey[], readonly type: "and" = "and") {}
}

export class AcceptableCodeStroke
  implements Comparable<AcceptableCodeStroke>, Acceptable<InputKeyEvent>
{
  constructor(readonly keys: VirtualKey[], readonly modifier: Modifier) {}
  accept(_: InputKeyEvent): boolean {
    return true;
  }
  equals(other: AcceptableCodeStroke): boolean {
    return (
      this.keys.length === other.keys.length &&
      this.keys.every((v, i) => v === other.keys[i]) &&
      this.modifier === other.modifier
    );
  }
}
