import { KeyboardStateReader } from "./keyboard_state";
import { extendCommonPrefixOverlappedEntriesDeeply } from "./rule_extender";
import { RuleStroke } from "./stroke";

/**
 * 比較可能な型を表すインターフェース
 */
export interface Comparable<T> {
  // 2つのオブジェクトが同値であるときに true を返す
  equals(other: Comparable<T>): boolean;
  // 2つのオブジェクトが同値であるときに同じ値を返し、そうでないときに異なる値を返す
  toString(): string;
}

/**
 * 1つの入力定義を表す。T 型は
 * @param U キー入力イベントを表す型
 * @param T 受け入れ可能な入力を表す型、U 型の入力を受け入れるかどうかを判定する
 * @property input 受け入れ可能なキー入力列
 * @property output 出力文字列
 * @property nextInput 次の入力として自動入力されるキー入力列
 */
export class RuleEntry<T extends Comparable<T>> {
  constructor(
    readonly input: RuleStroke<T>[],
    readonly output: string,
    readonly nextInput: RuleStroke<T>[],
    // 英数字を入力するためのルールかどうか
    readonly isAlphaNumeric: boolean
  ) {}
  get hasNextInput(): boolean {
    return this.nextInput.length > 0;
  }
  equals(other: RuleEntry<T>): boolean {
    return (
      this.input.length === other.input.length &&
      this.input.every((v, i) => v.equals(other.input[i])) &&
      this.output === other.output &&
      this.nextInput.length === other.nextInput.length &&
      this.nextInput.every((v, i) => v.equals(other.nextInput[i])) &&
      this.isAlphaNumeric === other.isAlphaNumeric
    );
  }
  isConnetableAfter(nextInputs: RuleStroke<T>[]): boolean {
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
export class Rule<T extends Comparable<T>> {
  constructor(
    readonly name: string,
    readonly entries: RuleEntry<T>[],
    // このルールの中で使われうる Modifier のリスト
    readonly modifierGroups: ModifierGroup<T>[]
  ) {
    this.entries = extendCommonPrefixOverlappedEntriesDeeply(entries);
  }
}

export type Modifier<T extends Comparable<T>> =
  | ModifierGroup<T>
  | AndModifier<T>
  | NullModifier<T>;

export class NullModifier<T extends Comparable<T>> {
  readonly type: "null" = "null";
  readonly modifiers: T[] = [];
  accept(_: KeyboardStateReader<T>): boolean {
    return true;
  }
  equals(other: Modifier<T>): boolean {
    return other.type === this.type;
  }
  has(_: T): boolean {
    return false;
  }
  get groups(): ModifierGroup<T>[] {
    return [];
  }
  toString(): string {
    return "";
  }
}

export class ModifierGroup<T extends Comparable<T>> {
  readonly type: "or" = "or";
  constructor(readonly modifiers: T[]) {}
  accept(state: KeyboardStateReader<T>): boolean {
    return state.isAnyKeyDowned(this.modifiers);
  }
  equals(other: Modifier<T>): boolean {
    return (
      other.type === this.type &&
      this.modifiers.length === other.modifiers.length &&
      this.modifiers.every((v, i) => v.equals(other.modifiers[i]))
    );
  }
  has(key: T): boolean {
    return this.modifiers.some((v) => v.equals(key));
  }
  get groups(): ModifierGroup<T>[] {
    return [this];
  }
  toString(): string {
    return `${this.modifiers.map((v) => v.toString()).join("|")}`;
  }
}

export class AndModifier<T extends Comparable<T>> {
  readonly type: "and" = "and";
  constructor(readonly groups: ModifierGroup<T>[]) {}
  accept(state: KeyboardStateReader<T>): boolean {
    return this.groups.every((group) => group.accept(state));
  }
  equals(other: Modifier<T>): boolean {
    return (
      other.type === this.type &&
      this.groups.length === other.groups.length &&
      this.groups.every((v, i) => v.equals(other.groups[i]))
    );
  }
  toString(): string {
    return `${this.groups.map((v) => v.toString()).join("&")}`;
  }
}
