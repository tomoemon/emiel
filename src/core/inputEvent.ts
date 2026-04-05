import type { KeyboardStateReader } from "./keyboardState";
import type { VirtualKey } from "./virtualKey";

export type KeyEventType = "keyup" | "keydown";
export class InputStroke {
  constructor(
    readonly key: VirtualKey,
    readonly type: KeyEventType,
  ) {}
}

export class InputEvent {
  constructor(
    readonly input: InputStroke,
    readonly keyboardState: KeyboardStateReader,
    readonly timestamp: Date,
  ) {}
}
