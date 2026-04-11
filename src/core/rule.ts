import { setDefault } from "../utils/map";
import type { KeyboardGuide } from "./keyboardGuide";
import { AndModifier } from "./modifier";
import { expandPrefixRules } from "./ruleExtender";
import { ModifierStroke, ruleStrokeKeys, type RuleStroke } from "./ruleStroke";
import { type VirtualKey, VirtualKeys } from "./virtualKey";

export type normalizerFunc = (value: string) => string;

/**
 * 1つの入力定義を表す。T 型は
 * @property input 受け入れ可能なキー入力列
 * @property output 出力文字列
 * @property nextInput 次の入力として自動入力されるキー入力列
 */
export class RuleEntry {
  constructor(
    readonly input: RuleStroke[],
    readonly output: string,
    readonly nextInput: RuleStroke[],
    // 共通プレフィックスエントリを展開するかどうか
    readonly extendCommonPrefixCommonEntry: boolean,
  ) {}
  get hasNextInput(): boolean {
    return this.nextInput.length > 0;
  }
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
export class Rule {
  /**
   * Rule.backspaceStrokes: 入力方式が「特定のキーストロークを backspace として扱う」
   * ケース (例: naginata 式の U 単独打鍵) を表現するための、現在ノードに依存せず
   * 常に受理される特殊ストローク群。expandPrefixRules や entriesByKey 等の通常入力
   * 経路のキャッシュには含まれない。
   *
   * 省略時のデフォルトは VirtualKeys.Backspace 単独打鍵のみ。明示的に指定された場合は
   * その指定がそのまま使われる (Backspace キーを含めるかどうかは呼び出し側の判断)。
   *
   * チェーン化された Rule (next が指定された Rule) では、チェーン先頭 (head) の Rule
   * の backspaceStrokes が採用される。チェーン末尾側の Rule の backspaceStrokes は無視される。
   */
  readonly backspaceStrokes: readonly RuleStroke[];

  // 入力ワードと RuleEntry.output の表記ゆれを吸収する関数 (例: ひらがな⇔カタカナ,
  // 全角英数⇔半角英数)。これにより "カタカナ" という word が "かたかな" を対象とする
  // entry にマッチできる。
  private readonly ownNormalize: normalizerFunc;
  // この Rule 自身の entries に対するキー引きインデックス。チェーン先の検索に使うため
  // private だが、同クラス内なら別インスタンスのものも参照できる。
  private readonly ownEntriesByKey: Map<VirtualKey, RuleEntry[]> = new Map();
  private readonly ownEntriesByModifier: Map<VirtualKey, RuleEntry[]> = new Map();
  // チェーン全体を事前マージしたキー引きインデックス。constructor 内で eager に構築され、
  // 以降変更されない。head 単独の場合は ownEntriesBy* をそのまま参照する。
  // 入力ホットパス (committer の entriesByKey / entriesByModifier) で毎回走査しないため。
  private readonly effectiveByKey: Map<VirtualKey, RuleEntry[]>;
  private readonly effectiveByModifier: Map<VirtualKey, RuleEntry[]>;

  /**
   * @param entries 入力ルールのエントリ
   * @param normalize 入力ワードのかな文字を正規化する関数
   * @param name 入力ルールの名前
   * @param backspaceStrokes backspace として扱う RuleStroke 群。
   *                         undefined の場合は VirtualKeys.Backspace 単独打鍵のみが
   *                         デフォルトとして設定される。空配列を渡すと backspace 無効
   * @param guide この Rule に紐づく KeyboardGuide。未指定なら undefined
   * @param next チェーン上の次の Rule
   */
  constructor(
    readonly entries: RuleEntry[],
    normalize: normalizerFunc,
    readonly name: string = "",
    backspaceStrokes?: readonly RuleStroke[],
    readonly guide?: KeyboardGuide,
    readonly next?: Rule,
  ) {
    this.ownNormalize = normalize;
    this.entries = expandPrefixRules(entries);
    this.backspaceStrokes = backspaceStrokes ?? [
      new ModifierStroke(VirtualKeys.Backspace, AndModifier.empty),
    ];

    // SimultaneousStroke の場合は keys の全要素を登録キーとする
    for (const entry of this.entries) {
      const firstStroke = entry.input[0];
      for (const firstInputKey of ruleStrokeKeys(firstStroke)) {
        setDefault(this.ownEntriesByKey, firstInputKey, []).push(entry);
      }
    }
    // ModifierStroke のみ requiredModifier を持つ。SimultaneousStroke は対象外。
    for (const entry of this.entries) {
      const firstStroke = entry.input[0];
      if (firstStroke.kind !== "modifier") continue;
      for (const g of firstStroke.requiredModifier.groups) {
        for (const modifierKey of g.modifiers) {
          setDefault(this.ownEntriesByModifier, modifierKey, []).push(entry);
        }
      }
    }

    if (next) {
      this.effectiveByKey = mergeChainMaps(this, (r) => r.ownEntriesByKey);
      this.effectiveByModifier = mergeChainMaps(this, (r) => r.ownEntriesByModifier);
    } else {
      this.effectiveByKey = this.ownEntriesByKey;
      this.effectiveByModifier = this.ownEntriesByModifier;
    }
  }

  /**
   * チェーンに含まれる Rule を head から順に返すイテレータ。
   */
  *chain(): Iterable<Rule> {
    yield this;
    if (this.next !== undefined) {
      yield* this.next.chain();
    }
  }

  /**
   * 入力ワードを正規化する。チェーン化された Rule では head から順に合成する。
   */
  normalize(v: string): string {
    const result = this.ownNormalize(v);
    return this.next ? this.next.normalize(result) : result;
  }

  entriesByKey(inputKey: VirtualKey): RuleEntry[] {
    return this.effectiveByKey.get(inputKey) ?? [];
  }

  entriesByModifier(modifierKey: VirtualKey): RuleEntry[] {
    return this.effectiveByModifier.get(modifierKey) ?? [];
  }
}

function mergeChainMaps(
  head: Rule,
  // 同クラス内なのでチェーン先の private フィールドにもアクセスできる
  getMap: (r: Rule) => Map<VirtualKey, RuleEntry[]>,
): Map<VirtualKey, RuleEntry[]> {
  const merged = new Map<VirtualKey, RuleEntry[]>();
  for (const r of head.chain()) {
    for (const [key, entries] of getMap(r)) {
      setDefault(merged, key, []).push(...entries);
    }
  }
  return merged;
}
