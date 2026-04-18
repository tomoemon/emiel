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
     *
     * `activate()` 経由で受け取る場合は `KeyboardEvent.timeStamp` が自動でセットされる。
     * 自前で InputEvent を生成する場合は高精度タイマー `performance.now()` の値を渡すこと。
     * `Date.now()` や `new Date().getTime()` は時間軸が異なるため使用不可。
     *
     * 単調時計なので、同じく `performance.now()` で取得した他の時刻との差分で経過時間を計算できる。
     */
    readonly timestamp: DOMHighResTimeStamp,
  ) {}
}
