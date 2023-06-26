import { KeyboardStateReader } from "../core/keyboard_state";
import { Acceptable, Comparable, Modifier } from "../core/rule";
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

export class AcceptableCodeStroke
  implements Comparable<AcceptableCodeStroke>, Acceptable<InputKeyEvent>
{
  constructor(
    readonly keys: VirtualKey[],
    readonly modifier: Modifier<VirtualKey>
  ) {}
  accept(evt: InputKeyEvent): boolean {
    return evt.input.key === this.keys[0];
  }
  equals(other: AcceptableCodeStroke): boolean {
    return (
      this.keys.length === other.keys.length &&
      this.keys.every((v, i) => v === other.keys[i]) &&
      this.modifier.type === other.modifier.type &&
      this.modifier.modifiers.length === other.modifier.modifiers.length &&
      this.modifier.modifiers.every((v, i) => v === other.modifier.modifiers[i])
    );
  }
}
