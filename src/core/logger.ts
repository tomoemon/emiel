import { setDefaultFunc } from "../utils/map";

/**
 * 1 回のログ出力を表すレコード。`LogHandler` の引数として渡される。
 */
export type LogRecord = {
  /** ログ出力箇所を識別するラベル（例: "automaton.input"）。 */
  label: string;
  /** `Logger.log(...args)` に渡された引数列。 */
  args: unknown[];
  /** `Date.now()` で取得した出力時刻のミリ秒。 */
  timestamp: number;
};

/**
 * ログ出力の実処理を担う関数型。`logging.setHandler` で差し替え可能。
 * 既定ハンドラは `console.log` で `[label] HH:MM:SS.mmm - ...args` 形式で出力する。
 */
export type LogHandler = (record: LogRecord) => void;

/**
 * 特定ラベルに紐づくロガー。`logging.getLogger(label)` で取得する。
 *
 * `log(...args)` は `enabled` が true のときのみハンドラを呼び出す。
 * 引数計算コストが高い場合は `if (logger.enabled)` で事前ガードできる。
 */
export type Logger = {
  /** このロガーが紐づくラベル。 */
  readonly label: string;
  /** 現在有効化されているかどうか（`logging.enable` / `logging.disable` で変化する）。 */
  readonly enabled: boolean;
  /** 有効時のみ、登録済みハンドラにレコードを渡す。 */
  log(...args: unknown[]): void;
};

class LoggerImpl implements Logger {
  enabled = false;
  constructor(readonly label: string) {}
  log(...args: unknown[]): void {
    if (!this.enabled) return;
    currentHandler({ label: this.label, args, timestamp: Date.now() });
  }
}

function formatTimestamp(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const mmm = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${mmm}`;
}

const defaultHandler: LogHandler = (record) => {
  console.log(`${formatTimestamp(record.timestamp)} [${record.label}]`, ...record.args);
};

const cache = new Map<string, LoggerImpl>();
let enabledPatterns = new Set<string>();
let enabledRegexes: RegExp[] = [];
let currentHandler: LogHandler = defaultHandler;

function patternToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

function matches(label: string): boolean {
  for (const regex of enabledRegexes) {
    if (regex.test(label)) return true;
  }
  return false;
}

function refresh(): void {
  enabledRegexes = [...enabledPatterns].map(patternToRegex);
  for (const logger of cache.values()) {
    logger.enabled = matches(logger.label);
  }
}

function getLogger(label: string): Logger {
  return setDefaultFunc(cache, label, () => {
    const logger = new LoggerImpl(label);
    logger.enabled = matches(label);
    return logger;
  });
}

function enable(...patterns: string[]): void {
  let changed = false;
  for (const pattern of patterns) {
    if (!enabledPatterns.has(pattern)) {
      enabledPatterns.add(pattern);
      changed = true;
    }
  }
  if (changed) refresh();
}

function disable(...patterns: string[]): void {
  let changed = false;
  for (const pattern of patterns) {
    if (enabledPatterns.delete(pattern)) changed = true;
  }
  if (changed) refresh();
}

function disableAll(): void {
  if (enabledPatterns.size === 0) return;
  enabledPatterns.clear();
  refresh();
}

function setHandler(handler: LogHandler): void {
  currentHandler = handler;
}

function resetHandler(): void {
  currentHandler = defaultHandler;
}

/**
 * emiel のデバッグログ制御 API。Python の `logging` モジュールに近い使い方ができる。
 *
 * @example
 * ```ts
 * import { logging } from "emiel";
 *
 * logging.enable("automaton.*", "builder.build"); // 複数指定可
 * logging.enable("*"); // 全部
 * logging.disable("automaton.input"); // 個別解除
 * logging.disableAll(); // すべて無効化
 *
 * logging.setHandler((record) => {
 *   myAppLogger.debug(`[${record.label}]`, ...record.args);
 * });
 * ```
 */
export const logging = {
  /**
   * ラベルに対応する `Logger` を取得する。同じラベルには同一インスタンスを返す。
   * @param label ドット区切り推奨（例: "automaton.input"）
   */
  getLogger,
  /**
   * 指定したパターンに一致するラベルのログを有効化する。複数指定可。
   * `*` をワイルドカードとして使える（例: "automaton.*", "*"）。
   * 既に登録済みのパターンは無視される。
   */
  enable,
  /**
   * `enable` で有効化したパターンを取り消す。複数指定可。
   * 未登録のパターンは無視される。
   */
  disable,
  /**
   * 有効化中のパターンをすべて取り消して全ロガーを無効化する。
   */
  disableAll,
  /**
   * ログ出力の実処理を差し替える。自社ロガーへの転送などに使用する。
   */
  setHandler,
  /**
   * `setHandler` で差し替えたハンドラを既定（console.log 出力）に戻す。
   */
  resetHandler,
} as const;
