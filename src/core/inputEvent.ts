import type { KeyboardStateReader } from "./keyboardState";
import type { VirtualKey } from "./virtualKey";

/** キーイベントの種別。keydown はキー押下、keyup はキー解放。 */
export type KeyEventType = "keyup" | "keydown";

/**
 * 1 つのキーの押下／解放イベントを表す最小単位。
 * InputEvent のコンストラクタに渡す値として利用する。
 */
export class InputStroke {
  constructor(
    /** 対象の仮想キー */
    readonly key: VirtualKey,
    /** keydown か keyup か */
    readonly type: KeyEventType,
  ) {}
}

/**
 * Automaton.input() / testInput() に渡す 1 回の入力イベント。
 * 打鍵そのもの (input) と発生時点のキーボード状態 (keyboardState) 、発生時刻を保持する。
 */
export class InputEvent {
  constructor(
    /** 今回の入力打鍵 */
    readonly input: InputStroke,
    /** 入力発生時点のキーボード押下状態 (モディファイア判定等に使用) */
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
