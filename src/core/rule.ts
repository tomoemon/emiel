import { setDefault } from "../utils/map";
import type { Metadata } from "./metadata";
import { emptyMetadata } from "./metadata";
import { AndModifier } from "./modifier";
import { expandPrefixRules } from "./ruleExtender";
import { SingleStroke, ruleStrokeKeys, type RuleStroke } from "./ruleStroke";
import { VirtualKeys, type VirtualKey } from "./virtualKey";

/**
 * ワード文字列を内部比較用に正規化する関数のシグネチャ。
 * build 時に入力テキストと各エントリの output 双方に適用される。
 */
export type normalizerFunc = (value: string) => string;

/**
 * 1つの入力定義を表す。
 * @property input 受け入れ可能なキー入力列
 * @property output 出力文字列
 * @property nextInput 次の入力として自動入力されるキー入力列
 */
export class RuleEntry {
  constructor(
    /** 受け入れ可能なキー入力列 */
    readonly input: RuleStroke[],
    /** 出力文字列 */
    readonly output: string,
    /** 次の入力として自動入力されるキー入力列 */
    readonly nextInput: RuleStroke[],
    /** 共通プレフィックスエントリを展開するかどうか */
    readonly extendCommonPrefixCommonEntry: boolean,
    /**
     * このエントリの構成に寄与した RulePrimitive 群。
     * RulePrimitive コンストラクタ内で自動的にタグ付けされる。
     * `merge` による結合エントリでは結合元 2 entries の sources を union して保持する。
     */
    readonly sources: readonly RulePrimitive[] = [],
  ) {}
  /** nextInput が空でない（＝確定後に次のエントリへ打ち継ぐ） */
  get hasNextInput(): boolean {
    return this.nextInput.length > 0;
  }
  /** 全フィールドが同値なら true */
  equals(other: RuleEntry): boolean {
    return (
      this.input.length === other.input.length &&
      this.input.every((v, i) => v.equals(other.input[i])) &&
      this.output === other.output &&
      this.nextInput.length === other.nextInput.length &&
      this.nextInput.every((v, i) => v.equals(other.nextInput[i])) &&
      this.extendCommonPrefixCommonEntry === other.extendCommonPrefixCommonEntry
    );
  }
  /** 渡された nextInputs をこのエントリの input の先頭として連結できるかを判定する */
  isConnetableAfter(nextInputs: RuleStroke[]): boolean {
    // 同じ長さの「入力」は「次の入力」経由では使えない
    if (nextInputs.length >= this.input.length) {
      return false;
    }
    for (let i = 0; i < nextInputs.length; i++) {
      if (!nextInputs[i].equals(this.input[i])) {
        return false;
      }
    }
    return true;
  }
}

/*
最長一致規則に関するルール
n   ん
ka  か
nn  ん
xn  ん
na  な
ni  に
nu  ぬ
nna ほげ
最長一致規則に従うと、「ん」を n 1打で入力できるのは、
「入力」が n 以外の文字で始まるエントリが次に来る場合のみ
それらのエントリとの連結エントリを事前に作成することで、
オートマトン生成時に最長一致規則を気にしなくて良くなる
こういったことを考慮しないといけないのは、自身の「入力」を prefix として持つエントリが存在する場合のみ

n/ん のように最長一致規則を考慮しなければいけないエントリは次の入力を持つことができない、というルールが必要そう

次の入力に関しても同様に事前にルールを展開することができないか検討したが、
tt/っ/t のような次の入力を持つエントリを定義すると
っっっっっっっっっっっっった
のように無限に連なる文字列を t の連続で打てるようになるので、事前にルールを展開することはできなさそう

nka んか
※nk/ん/k というルールでも良さそう。これだと nk まで打った時点で「ん」が確定できる。
ただ、どこまでを input にしてどこからを nextInput とすべきか？
n/ん
kha/か
ki/き
というルールがある場合
nk/ん/k で良いが、
n/ん
kha/か
khi/き
というルールが有る場合でも、やはりこれで良い。（nk まで打った時点で n/ん は確定できるので）
nk/ん/k
*/

/**
 * 入力ルールを表す公開 interface。唯一の実装クラスは `RulePrimitive`。
 * `merge` は両辺の生エントリ (`rawEntries`) を統合した単一 `RulePrimitive` を返す。
 */
export interface Rule {
  /** ルール名称や参照 URL 等 */
  readonly metadata: Metadata;
  /** backspace として扱うストローク群 */
  readonly backspaceStrokes: readonly RuleStroke[];
  /** 共通プレフィックス展開後のエントリ一覧 */
  readonly entries: readonly RuleEntry[];
  /**
   * 展開前の生エントリ（sources タグ付け済み）。
   * `merge` 時に他 Rule の rawEntries と union されて新しい RulePrimitive の入力になる。
   */
  readonly rawEntries: readonly RuleEntry[];
  /** 入力キーを先頭とするエントリ一覧 */
  entriesByKey(key: VirtualKey): readonly RuleEntry[];
  /** 先頭ストロークの修飾キーにマッチするエントリ一覧 */
  entriesByModifier(key: VirtualKey): readonly RuleEntry[];
  /**
   * このルールと other を統合した新しい RulePrimitive を返す。
   * 両 Rule の rawEntries を union してプレフィックス展開を 1 回走らせるため、
   * primitive をまたいだ結合エントリ（例: ローマ字の `n/ん` ＋ direct input の `space/ `）
   * も自動生成される。metadata と backspaceStrokes は this のものを採用する。
   */
  merge(other: Rule): RulePrimitive;
}

/**
 * 1 つの primitive な入力定義。エントリと自身のメタデータを持つ。
 *
 * コンストラクタは引数 entries のうち `sources` が未設定 (空配列) のものに自身をタグ付けし、
 * 展開済みエントリ (`entries`) とキー引きインデックスを事前構築する。
 * 2 つの Rule を統合する場合は `a.merge(b)` を使う。戻り値は統合済みの新 `RulePrimitive`。
 */
export class RulePrimitive implements Rule {
  /** 展開前の生エントリ（sources タグ付け済み）。merge の入力に使う */
  readonly rawEntries: readonly RuleEntry[];
  /** 共通プレフィックス展開後のエントリ一覧 */
  readonly entries: readonly RuleEntry[];
  /**
   * RulePrimitive.backspaceStrokes: 入力方式が「特定のキーストロークを backspace として扱う」
   * ケース (例: naginata 式の U 単独打鍵) を表現するための、現在ノードに依存せず
   * 常に受理される特殊ストローク群。expandPrefixRules や entriesByKey 等の通常入力
   * 経路のキャッシュには含まれない。
   *
   * 省略時のデフォルトは VirtualKeys.Backspace 単独打鍵のみ。明示的に指定された場合は
   * その指定がそのまま使われる (Backspace キーを含めるかどうかは呼び出し側の判断)。
   */
  readonly backspaceStrokes: readonly RuleStroke[];
  readonly metadata: Metadata;

  private readonly ownByKey: ReadonlyMap<VirtualKey, readonly RuleEntry[]>;
  private readonly ownByModifier: ReadonlyMap<VirtualKey, readonly RuleEntry[]>;

  constructor(
    entries: RuleEntry[],
    metadata: Metadata = emptyMetadata(),
    backspaceStrokes?: readonly RuleStroke[],
  ) {
    this.metadata = metadata;
    this.backspaceStrokes = backspaceStrokes ?? [
      new SingleStroke(VirtualKeys.Backspace, AndModifier.empty),
    ];
    // sources が未設定のエントリに自身を source としてタグ付けする。
    // merge 経由で既に sources が設定されている entries はそのまま残す。
    this.rawEntries = entries.map((e) =>
      e.sources.length > 0
        ? e
        : new RuleEntry(e.input, e.output, e.nextInput, e.extendCommonPrefixCommonEntry, [this]),
    );
    this.entries = expandPrefixRules([...this.rawEntries]);

    const byKey = new Map<VirtualKey, RuleEntry[]>();
    const byModifier = new Map<VirtualKey, RuleEntry[]>();
    for (const entry of this.entries) {
      const firstStroke = entry.input[0];
      // SimultaneousStroke の場合は keys の全要素を登録キーとする
      for (const firstInputKey of ruleStrokeKeys(firstStroke)) {
        setDefault(byKey, firstInputKey, []).push(entry);
      }
      // SingleStroke のみ byModifier に登録 (SimultaneousStroke も requiredModifier を
      // 持ち得るが、ここで扱う「最初の単打の修飾キーで引ける」という性質を満たすのは SingleStroke だけ)。
      if (firstStroke.kind === "single") {
        for (const g of firstStroke.requiredModifier.groups) {
          for (const modifierKey of g.modifiers) {
            setDefault(byModifier, modifierKey, []).push(entry);
          }
        }
      }
    }
    this.ownByKey = byKey;
    this.ownByModifier = byModifier;
  }

  /** 入力キーを先頭とするエントリ一覧を返す（事前キャッシュ引き） */
  entriesByKey(inputKey: VirtualKey): readonly RuleEntry[] {
    return this.ownByKey.get(inputKey) ?? [];
  }

  /** 先頭ストロークの修飾キーにマッチするエントリ一覧を返す（事前キャッシュ引き） */
  entriesByModifier(modifierKey: VirtualKey): readonly RuleEntry[] {
    return this.ownByModifier.get(modifierKey) ?? [];
  }

  /**
   * このルールと other を統合した新しい RulePrimitive を返す。
   * 両辺の rawEntries を union してプレフィックス展開を 1 回走らせるため、
   * primitive をまたいだ結合エントリも生成される。
   * metadata と backspaceStrokes は this のものを採用する。
   */
  merge(other: Rule): RulePrimitive {
    const union = [...this.rawEntries, ...other.rawEntries];
    return new RulePrimitive(union, this.metadata, this.backspaceStrokes);
  }
}
