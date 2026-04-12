import { setDefault } from "../utils/map";
import type { KeyboardGuide } from "./keyboardGuide";
import { AndModifier } from "./modifier";
import { expandPrefixRules } from "./ruleExtender";
import { ModifierStroke, ruleStrokeKeys, type RuleStroke } from "./ruleStroke";
import { type VirtualKey, VirtualKeys } from "./virtualKey";

export type normalizerFunc = (value: string) => string;

/**
 * 1つの入力定義を表す。
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

/**
 * 入力ルールを表す公開 interface。1 つの primitive な定義 (RulePrimitive) か、
 * 複数の primitive を合成したもの (内部 RuleSet) のいずれかが実装する。
 *
 * entriesByKey / entriesByModifier は `primitives` 全体を事前マージした結果を返す契約。
 * RulePrimitive 実装は自身の entries のみ、合成実装は全 parts の union を返す。
 */
export interface Rule {
  readonly name: string;
  readonly guide?: KeyboardGuide;
  readonly backspaceStrokes: readonly RuleStroke[];
  readonly primitives: readonly RulePrimitive[];
  entriesByKey(key: VirtualKey): readonly RuleEntry[];
  entriesByModifier(key: VirtualKey): readonly RuleEntry[];
  compose(other: Rule): Rule;
}

/**
 * 1 つの primitive な入力定義。entries と自身のメタデータ (name, guide,
 * backspaceStrokes) を持ち、自身の entries に対するキー引きインデックスを
 * 事前構築する。位置に依存しない再利用可能な定義。
 *
 * 2 つの Rule を合成する場合は `a.compose(b)` を使うと内部で RuleSet が生成される。
 */
export class RulePrimitive implements Rule {
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
  readonly name: string;
  readonly guide?: KeyboardGuide;

  /** @internal 同ファイル内の RuleSet が合成時に直接マージするため公開している */
  readonly ownByKey: ReadonlyMap<VirtualKey, readonly RuleEntry[]>;
  /** @internal */
  readonly ownByModifier: ReadonlyMap<VirtualKey, readonly RuleEntry[]>;

  /**
   * @param entries 入力ルールのエントリ
   * @param name 入力ルールの名前
   * @param backspaceStrokes backspace として扱う RuleStroke 群。
   *                         undefined の場合は VirtualKeys.Backspace 単独打鍵のみが
   *                         デフォルトとして設定される。空配列を渡すと backspace 無効
   * @param guide この Rule に紐づく KeyboardGuide。未指定なら undefined
   */
  constructor(
    entries: RuleEntry[],
    name = "",
    backspaceStrokes?: readonly RuleStroke[],
    guide?: KeyboardGuide,
  ) {
    this.entries = expandPrefixRules(entries);
    this.name = name;
    this.guide = guide;
    this.backspaceStrokes = backspaceStrokes ?? [
      new ModifierStroke(VirtualKeys.Backspace, AndModifier.empty),
    ];

    const byKey = new Map<VirtualKey, RuleEntry[]>();
    const byModifier = new Map<VirtualKey, RuleEntry[]>();
    for (const entry of this.entries) {
      const firstStroke = entry.input[0];
      // SimultaneousStroke の場合は keys の全要素を登録キーとする
      for (const firstInputKey of ruleStrokeKeys(firstStroke)) {
        setDefault(byKey, firstInputKey, []).push(entry);
      }
      // ModifierStroke のみ requiredModifier を持つ。SimultaneousStroke は対象外。
      if (firstStroke.kind === "modifier") {
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

  get primitives(): readonly RulePrimitive[] {
    return [this];
  }

  entriesByKey(inputKey: VirtualKey): readonly RuleEntry[] {
    return this.ownByKey.get(inputKey) ?? [];
  }

  entriesByModifier(modifierKey: VirtualKey): readonly RuleEntry[] {
    return this.ownByModifier.get(modifierKey) ?? [];
  }

  compose(other: Rule): Rule {
    return composeRules(this, other);
  }
}

/**
 * 複数の RulePrimitive を合成したルール。head/tail 採用ポリシー (最初の primitive を
 * 合成全体の代表とする) はここの getter dispatch に閉じ、RulePrimitive 側には非対称性を
 * 持ち込まない。
 *
 * 外部からは直接 `new RuleSet(...)` せず `a.compose(b)` 経由で生成する。
 */
class RuleSet implements Rule {
  private readonly parts: readonly RulePrimitive[];
  private readonly mergedByKey: ReadonlyMap<VirtualKey, readonly RuleEntry[]>;
  private readonly mergedByModifier: ReadonlyMap<VirtualKey, readonly RuleEntry[]>;

  constructor(parts: readonly RulePrimitive[]) {
    if (parts.length === 0) {
      throw new Error("RuleSet requires at least one primitive");
    }
    this.parts = parts;
    const byKey = new Map<VirtualKey, RuleEntry[]>();
    const byModifier = new Map<VirtualKey, RuleEntry[]>();
    for (const p of parts) {
      for (const [key, entries] of p.ownByKey) {
        setDefault(byKey, key, []).push(...entries);
      }
      for (const [modKey, entries] of p.ownByModifier) {
        setDefault(byModifier, modKey, []).push(...entries);
      }
    }
    this.mergedByKey = byKey;
    this.mergedByModifier = byModifier;
  }

  get name(): string {
    return this.parts[0].name;
  }
  get guide(): KeyboardGuide | undefined {
    return this.parts[0].guide;
  }
  get backspaceStrokes(): readonly RuleStroke[] {
    return this.parts[0].backspaceStrokes;
  }
  get primitives(): readonly RulePrimitive[] {
    return this.parts;
  }

  entriesByKey(inputKey: VirtualKey): readonly RuleEntry[] {
    return this.mergedByKey.get(inputKey) ?? [];
  }

  entriesByModifier(modifierKey: VirtualKey): readonly RuleEntry[] {
    return this.mergedByModifier.get(modifierKey) ?? [];
  }

  compose(other: Rule): Rule {
    return composeRules(this, other);
  }
}

/**
 * 2 つの Rule を合成して新しい Rule を返す。
 *
 * - 入力の primitives を linear 化して並べるだけで、入れ子は発生しない
 *   (RulePrimitive.primitives は [this]、RuleSet.primitives は parts を返すため)。
 * - 同じ RulePrimitive インスタンスを 2 度合成した場合は重複が並ぶ。重複排除は行わない
 *   (利用者責任)。
 */
function composeRules(a: Rule, b: Rule): Rule {
  const flattened: RulePrimitive[] = [...a.primitives, ...b.primitives];
  return new RuleSet(flattened);
}
