/**
 * `Automaton.input()` / `testInput()` の戻り値として、1 打鍵の結果を表すクラス。
 * 内部的には 7 つのシングルトン (静的定数) を返し、`isFailed` 等の getter で分類できる。
 */
export class InputResult {
  constructor(
    private readonly type:
      | "ignored" // modifier キーの単独入力等で無視された
      | "failed" // 入力ミス
      | "key_succeeded" // 1打鍵の成功
      | "kana_succeeded" // かな1文字の成功
      | "finished" // 完了
      | "pending" // 確定待ち（同時押しの追加入力や keyup を待機中）
      | "back", // Rule.backspaceStrokes に一致して backspace 動作が発火した
  ) {}

  /** modifier キーの単独押下など、無視された入力 */
  static readonly IGNORED = new InputResult("ignored");
  /** ルールに違反した入力（ミスタイプ） */
  static readonly FAILED = new InputResult("failed");
  /** 1 打鍵分の進捗に成功したが、かな 1 文字の確定には届いていない */
  static readonly KEY_SUCCEEDED = new InputResult("key_succeeded");
  /** かな 1 文字以上を確定させる打鍵に成功した */
  static readonly KANA_SUCCEEDED = new InputResult("kana_succeeded");
  /** ワード全体の入力が完了する打鍵に成功した */
  static readonly FINISHED = new InputResult("finished");
  /** 確定待ち（同時押しの追加入力や keyup を待機中） */
  static readonly PENDING = new InputResult("pending");
  /** Rule.backspaceStrokes に一致し、backspace として扱われた入力 */
  static readonly BACK = new InputResult("back");

  /** デバッグ用途で内部種別を文字列として返す */
  toString(): string {
    return this.type;
  }
  /** 今回の打鍵が無視されたかどうか（シフトキー等のモディファイアキーの単独入力の場合） */
  get isIgnored(): boolean {
    return this.type === "ignored";
  }
  /** 今回の入力が確定待ち（同時押しの追加入力や keyup を待機中）であるかどうか */
  get isPending(): boolean {
    return this.type === "pending";
  }
  /** 今回の1打鍵が入力ミスだったかどうか */
  get isFailed(): boolean {
    return this.type === "failed";
  }
  /** 今回の入力に成功したかどうか */
  get isSucceeded(): boolean {
    return (
      this.type === "key_succeeded" || this.type === "kana_succeeded" || this.type === "finished"
    );
  }
  /** isSucceeded:true の場合の詳細な情報: 今回の1打鍵でかな1文字分の遷移はしていない */
  get isKeySucceeded(): boolean {
    return this.type === "key_succeeded";
  }
  /** isSucceeded:true の場合の詳細な情報: 今回の1打鍵でかな1文字分以上の遷移をした */
  get isKanaSucceeded(): boolean {
    return this.type === "kana_succeeded";
  }
  /** isSucceeded:true の場合の詳細な情報: 今回の1打鍵でワードの入力が完了した */
  get isFinished(): boolean {
    return this.type === "finished";
  }
  /**
   * 今回の入力が Rule.backspaceStrokes にマッチして backspace として処理された。
   * isSucceeded / isFailed / isIgnored のいずれにも属さない独立カテゴリ。
   */
  get isBack(): boolean {
    return this.type === "back";
  }
}
