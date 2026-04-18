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
    /**
     * 入力イベントの発生時刻 (DOMHighResTimeStamp, ミリ秒・sub-ms 精度)。
     * ブラウザでは KeyboardEvent.timeStamp、それ以外では performance.now() の値を渡す。
     * 単調時計なので差分で経過時間を計算できる。
     */
    readonly timestamp: DOMHighResTimeStamp,
  ) {}
}
