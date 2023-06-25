import { Acceptable, Comparable, RuleEntry } from "./rule";

export const InputResultTypes = {
  // 現在入力可能ないずれの Entry にもマッチしない
  Failed: 1, // 1 << 0
  // 1つ以上の入力可能な Entry にマッチして1打鍵分入力を進めた
  KeySucceeded: 2, // 1 << 1
  // 1つ以上の入力可能な Entry にマッチして1Entry分入力を進めた
  EntrySucceeded: 6, // 1 << 1 | 1 << 2
  // 1つ以上の入力可能な Entry にマッチして1Edge分入力を進めた
  EdgeSucceeded: 14, // 1 << 1 | 1 << 2 | 1 << 3
  // 入力全体を完了した
  Finished: 30, // 1 << 1 | 1 << 2 | 1 << 3 | 1 << 4
} as const;

export type InputResultType =
  (typeof InputResultTypes)[keyof typeof InputResultTypes];

export class InputResult {
  // - 入力の成否
  // - ここまでに入力したかな
  // - ここまでに入力した打鍵列
  // - これから入力すべきかな
  // - これから入力すべき打鍵列
  // あたりを返したい
  constructor(readonly type: InputResultType) {}
}

/**
 * KanaEdge の入力状態を管理する
 */
export class KanaEdgeState<U, T extends Comparable<T> & Acceptable<U>> {
  constructor(
    readonly edge: KanaEdge<U, T>,
    // edge に含まれる複数の entries を何個打ち終わったか
    readonly entryIndex: number = 0,
    // 現在の entryIndex 内の inputs を何個打ち終わったか
    readonly inputIndex: number = 0
  ) {}
  input(stroke: U): [KanaEdgeState<U, T>, InputResultType] {
    if (
      this.edge.entries[this.entryIndex].input[this.inputIndex].accept(stroke)
    ) {
      let inputIndex = this.inputIndex + 1;
      let entryIndex = this.entryIndex;
      let result: InputResultType = InputResultTypes.KeySucceeded;
      if (this.inputIndex === this.edge.entries[this.entryIndex].input.length) {
        inputIndex = 0;
        entryIndex++;
        if (this.entryIndex === this.edge.entries.length) {
          entryIndex = 0;
          result = InputResultTypes.EdgeSucceeded;
        } else {
          result = InputResultTypes.EntrySucceeded;
        }
      }
      return [new KanaEdgeState(this.edge, entryIndex, inputIndex), result];
    } else {
      return [
        new KanaEdgeState(this.edge, this.entryIndex, this.inputIndex),
        InputResultTypes.Failed,
      ];
    }
  }
  /**
   * 残りの打つべき strokes を返す
   */
  get strokesToBeDone(): T[] {
    const firstEntryStrokes = this.edge.entries[this.entryIndex].input.slice(
      this.inputIndex
    );
    const restEntryStrokes = this.edge.entries
      .slice(this.entryIndex + 1)
      .reduce((acc: T[], v) => acc.concat(v.input), []);
    return firstEntryStrokes.concat(restEntryStrokes);
  }
}

export class Metadata {
  constructor(readonly data: { [index: string]: any } = {}) {}
  get length(): number {
    return Object.keys(this.data).length;
  }
  get(key: string): any {
    return this.data[key];
  }
}

export class Automaton<U, T extends Comparable<T> & Acceptable<U>> {
  private activeEdgeStates: KanaEdgeState<U, T>[];
  constructor(
    readonly startNode: KanaNode<U, T>,
    readonly endNode: KanaNode<U, T>
  ) {
    this.activeEdgeStates = this.makeEdgeStateFromNode(startNode);
  }
  private makeEdgeStateFromNode(node: KanaNode<U, T>): KanaEdgeState<U, T>[] {
    return node.nextEdges.map((v) => new KanaEdgeState(v));
  }
  get isFinished(): boolean {
    return this.activeEdgeStates.length === 0;
  }
  getActiveEdgeStates(): KanaEdgeState<U, T>[] {
    return this.activeEdgeStates;
  }
  /**
   * 入力状態をリセットする
   */
  cancel(): void {
    this.activeEdgeStates = this.makeEdgeStateFromNode(this.startNode);
  }
  /**
   * 1stroke 分の入力を戻す
   */
  backspace(): void {}
  input(stroke: U): InputResultType {
    let resultType: InputResultType = InputResultTypes.Failed;
    let newEdgeStates: KanaEdgeState<U, T>[] = [];
    forLoop: for (let edge of this.activeEdgeStates) {
      // 遷移可能な複数の Edge に対して、入力を試行する
      // 1打鍵分の入力によって複数の Edge に同時に進むことはありえるか。
      // cn: ちゃん
      // cha: ちゃ
      // のような定義がある場合、c と打った時点で cn と cha の両方に進むことができる
      const [newEdgeState, result] = edge.input(stroke);
      switch (result) {
        case InputResultTypes.Failed:
          break;
        case InputResultTypes.KeySucceeded:
          resultType = InputResultTypes.KeySucceeded;
          newEdgeStates.push(newEdgeState);
          break;
        case InputResultTypes.EntrySucceeded:
          resultType = InputResultTypes.EntrySucceeded;
          newEdgeStates.push(newEdgeState);
          break;
        case InputResultTypes.EdgeSucceeded:
          resultType = InputResultTypes.EdgeSucceeded;
          // 1つの Edge 遷移が完了したら、必ずそこへ進む
          // 1回の入力で複数の Edge Succeeded が同時に成立して、異なる Node に遷移することがありえるか？
          // tt（っ） -> s（す） ->
          // tts（っす） ->
          // みたいなルールが定義されていたら？
          // 最長一致規則が適用されて tts が使われて tt -> s はそもそも無視される
          const newNode = newEdgeState.edge.next;
          newEdgeStates = this.makeEdgeStateFromNode(newNode);
          break forLoop;
      }
    }
    // すべての試行が失敗した場合は状態を変更せずに、失敗を返す
    if (resultType === InputResultTypes.Failed) {
      return resultType;
    }
    // 1件以上成功した場合のみ、状態を変更する
    this.activeEdgeStates = newEdgeStates;
    if (this.isFinished) {
      return InputResultTypes.Finished;
    }
    return resultType;
  }
}

export interface KanaNode<U, T extends Comparable<T> & Acceptable<U>> {
  readonly startIndex: number;
  readonly nextEdges: KanaEdge<U, T>[];
  readonly previousEdges: KanaEdge<U, T>[];
  isEnd(): boolean;
}

export interface KanaEdge<U, T extends Comparable<T> & Acceptable<U>> {
  readonly entries: RuleEntry<U, T>[];
  readonly next: KanaNode<U, T>;
  readonly previous: KanaNode<U, T>;
}

export class SelectorInputResult<T> {
  constructor(readonly type: InputResultType, readonly automaton: T) {}
}

export class Selector<U, T extends Comparable<T> & Acceptable<U>> {
  // 現在入力試行対象になっている automaton
  private activeAutomatons: Automaton<U, T>[];
  constructor(private automatons: Automaton<U, T>[]) {
    this.activeAutomatons = automatons;
  }
  input(stroke: U): SelectorInputResult<Automaton<U, T>>[] {
    const result = [];
    const newActiveAutomatons = [];
    let succeeded = false;
    for (let automaton of this.activeAutomatons) {
      const type = automaton.input(stroke);
      result.push(new SelectorInputResult(type, automaton));
      if (type !== InputResultTypes.Failed) {
        succeeded = true;
        if (type != InputResultTypes.Finished) {
          newActiveAutomatons.push(automaton);
        }
      }
    }
    if (!succeeded) {
      return result;
    }
    this.activeAutomatons = newActiveAutomatons;
    return result;
  }
  /**
   * 完了していない automaton をすべてキャンセルして active な状態に戻す
   */
  cancel() {
    this.activeAutomatons.forEach((v) => v.cancel());
    this.activeAutomatons = this.automatons.filter((v) => !v.isFinished);
  }
  append(automaton: Automaton<U, T>) {
    this.automatons.push(automaton);
  }
}
