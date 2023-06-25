/**
 * 比較可能な型を表すインターフェース
 */
export interface Comparable<T> {
  equals(other: Comparable<T>): boolean;
}
/**
 * U 型の値を受け取って、受け入れられるかどうかを判定するインターフェース
 * @param U キー入力イベントを表す型
 */
export interface Acceptable<U> {
  accept(input: U): boolean;
}

/**
 * 1つの入力定義を表す。T 型は
 * @param U キー入力イベントを表す型
 * @param T 受け入れ可能な入力を表す型、U 型の入力を受け入れるかどうかを判定する
 * @property input 受け入れ可能なキー入力列
 * @property output 出力文字列
 * @property nextInput 次の入力として自動入力されるキー入力列
 */
export class RuleEntry<U, T extends Comparable<T> & Acceptable<U>> {
  constructor(
    readonly input: T[],
    readonly output: string,
    readonly nextInput: T[]
  ) {}
  get hasNextInput(): boolean {
    return this.nextInput.length > 0;
  }
  isConnetableAfter(nextInputs: T[]): boolean {
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
「入力」が n 以外の文字で始まるエントリ（common prefix を持たないエントリ）が次に来る場合のみ
それらのエントリとの連結エントリを事前に作成することで、
nka んか
※nk ん k というルールでも良さそう
オートマトン生成時に最長一致規則を気にしなくて良くなる
こういったことを考慮しないといけないのは、自身の「入力」を prefix として持つエントリが存在する場合のみ

n/ん のように最長一致規則を考慮しなければいけないエントリは次の入力を持つことができない、というルールが必要そう

次の入力に関しても同様に事前にルールを展開することができないか検討したが、
tt/っ/t のような次の入力を持つエントリを定義すると
っっっっっっっっっっっっった
のように無限に連なる文字列を t の連続で打てるようになるので、事前にルールを展開することはできなさそう
*/
export class Rule<U, T extends Comparable<T> & Acceptable<U>> {
  constructor(readonly entries: RuleEntry<U, T>[]) {}
}
