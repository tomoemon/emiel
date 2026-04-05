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

  static readonly IGNORED = new InputResult("ignored");
  static readonly FAILED = new InputResult("failed");
  static readonly KEY_SUCCEEDED = new InputResult("key_succeeded");
  static readonly KANA_SUCCEEDED = new InputResult("kana_succeeded");
  static readonly FINISHED = new InputResult("finished");
  static readonly PENDING = new InputResult("pending");
  static readonly BACK = new InputResult("back");

  toString(): string {
    return this.type;
  }
  // 今回の打鍵が無視されたかどうか（シフトキー等のモディファイアキーの単独入力の場合）
  get isIgnored(): boolean {
    return this.type === "ignored";
  }
  get isPending(): boolean {
    return this.type === "pending";
  }
  // 今回の1打鍵が入力ミスだったかどうか
  get isFailed(): boolean {
    return this.type === "failed";
  }
  // 今回の入力に成功したかどうか
  get isSucceeded(): boolean {
    return (
      this.type === "key_succeeded" || this.type === "kana_succeeded" || this.type === "finished"
    );
  }
  // isSucceeded:true の場合の詳細な情報: 今回の1打鍵でかな1文字分の遷移はしていない
  get isKeySucceeded(): boolean {
    return this.type === "key_succeeded";
  }
  // isSucceeded:true の場合の詳細な情報: 今回の1打鍵でかな1文字分以上の遷移をした
  get isKanaSucceeded(): boolean {
    return this.type === "kana_succeeded";
  }
  // isSucceeded:true の場合の詳細な情報: 今回の1打鍵でワードの入力が完了した
  get isFinished(): boolean {
    return this.type === "finished";
  }
  // 今回の入力が Rule.backspaceStrokes にマッチして backspace として処理された
  // isSucceeded / isFailed / isIgnored のいずれにも属さない独立カテゴリ
  get isBack(): boolean {
    return this.type === "back";
  }
}
