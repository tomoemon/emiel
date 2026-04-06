import type { StrokeEdge, StrokeNode } from "./builderStrokeGraph";
import type { InputEvent } from "./inputEvent";
import type { Rule } from "./rule";
import type { RuleStroke, SimultaneousStroke } from "./ruleStroke";
import type { VirtualKey } from "./virtualKey";

/**
 * Committer が 1 打鍵として確定したストローク。Automaton に渡されて状態遷移を起こす。
 */
export type CommittedStroke = {
  /** この確定に対応するエッジ (Automaton 側の nextEdges のいずれか) */
  readonly edge: StrokeEdge;
  /** 確定のトリガーとなった入力イベント。履歴に残す */
  readonly triggerEvent: InputEvent;
};

/**
 * Committer.feed / dryRun の結果。
 * - committed: 1 打鍵として確定。Automaton は状態遷移すべき
 * - pending: 確定待ち。次の入力または keyup で決着する
 * - ignored: modifier 単独押下など、無視してよいイベント
 * - failed: ルールに違反した入力
 */
export type CommitResult =
  | { readonly type: "committed"; readonly stroke: CommittedStroke }
  | { readonly type: "pending" }
  | { readonly type: "ignored" }
  | { readonly type: "failed"; readonly event: InputEvent };

/**
 * keyup で救済コミットを発火させるためのテンタティブ状態。
 * - edge: キーダウンで候補エッジが確定しかかっているが、他との曖昧さ解消 (同時押し候補の継続 or
 *   別 modifier エッジが拾う可能性) のため keyup を待っている。
 * - failure: キーダウンがいずれのルートとも合わず keyup 時点で失敗を確定させる。
 */
type TentativeCommit =
  | { readonly kind: "edge"; readonly edge: StrokeEdge }
  | { readonly kind: "failure"; readonly event: InputEvent };

/**
 * Committer の内部状態。
 */
type CommitterState = {
  /**
   * 現在押下されていて、まだ打鍵として確定していないキーの集合。
   * 確定 (committed) のたびに、確定に使ったキーが取り除かれる。
   * keyup のたびに、離されたキーが取り除かれる (ただし直前の値で一度マッチングを試みる)。
   */
  readonly pendingDown: readonly VirtualKey[];
  /**
   * keyup 時に発火させたい救済コミット (なければ undefined)。
   */
  readonly tentative: TentativeCommit | undefined;
};

const EMPTY_STATE: CommitterState = { pendingDown: [], tentative: undefined };

/**
 * Raw な keydown/keyup イベントを受け取り、ルールに基づいて「確定 / 保留 / 無視 / 失敗」を判断する層。
 *
 * Automaton が時間方向の判断 (staged 状態, keyup 待ち, 同時押しの確定) を持たないで済むように
 * 切り出した責務の塊。SimultaneousStroke と ModifierStroke の両方に対応する。
 *
 * Committer 自身は `pendingDown` と `tentative` だけを状態として持ち、評価に必要な
 * currentNode / rule は呼び出し時に引数で受け取る (Automaton への逆参照を避けるため)。
 */
export class StrokeCommitter {
  private state: CommitterState = EMPTY_STATE;

  /**
   * 入力を受け取り、確定結果を返すと同時に内部状態を更新する。
   */
  feed(event: InputEvent, currentNode: StrokeNode, rule: Rule): CommitResult {
    const { result, nextState } = this.evaluate(event, this.state, currentNode, rule);
    this.state = nextState;
    return result;
  }

  /**
   * 副作用なしで、入力を受け取ったらどういう結果になるかだけを返す。
   * 既存の Automaton.testInput の [result, apply] 契約を維持するために使う。
   */
  dryRun(event: InputEvent, currentNode: StrokeNode, rule: Rule): CommitResult {
    const { result } = this.evaluate(event, this.state, currentNode, rule);
    return result;
  }

  /**
   * 内部の pending 状態を完全にリセットする。Automaton の reset/back 時に呼ぶ。
   */
  reset(): void {
    this.state = EMPTY_STATE;
  }

  /**
   * 現在 pending 中のキー集合を取得する (可視化用の公開 API)。
   */
  get pendingKeys(): readonly VirtualKey[] {
    return this.state.pendingDown;
  }

  /**
   * 純粋関数的に評価する。dryRun と feed の共通実装。
   */
  private evaluate(
    event: InputEvent,
    currentState: CommitterState,
    currentNode: StrokeNode,
    rule: Rule,
  ): { result: CommitResult; nextState: CommitterState } {
    if (event.input.type === "keyup") {
      return this.evaluateKeyup(event, currentState, currentNode);
    }
    return this.evaluateKeydown(event, currentState, currentNode, rule);
  }

  private evaluateKeydown(
    event: InputEvent,
    currentState: CommitterState,
    currentNode: StrokeNode,
    rule: Rule,
  ): { result: CommitResult; nextState: CommitterState } {
    const key = event.input.key;
    const pendingDown: VirtualKey[] = currentState.pendingDown.includes(key)
      ? [...currentState.pendingDown]
      : [...currentState.pendingDown, key];

    const edges = currentNode.nextEdges;

    // ---- SimultaneousStroke の評価 ----
    // sim の keys と pendingDown を比較する際、sim.requiredModifier に含まれるキーは
    // 比較対象から除外する (例: naginata の [A,J] + Space modifier の場合、
    // pendingDown が [Space, A, J] なら Space を除いた [A, J] と [A, J] を比較する)。
    const simFull: StrokeEdge[] = [];
    const simPartial: StrokeEdge[] = [];
    for (const edge of edges) {
      if (edge.input.kind !== "simultaneous") {
        continue;
      }
      // modifier が先押しされていなければこの sim は候補外
      if (!edge.input.requiredModifier.accept(event.keyboardState)) {
        continue;
      }
      const simKeys = edge.input.keys;
      const nonModifierPending = pendingDown.filter(
        (k) => !(edge.input as SimultaneousStroke).requiredModifier.has(k),
      );
      if (simKeys.length === nonModifierPending.length && isSubset(nonModifierPending, simKeys)) {
        simFull.push(edge);
      } else if (
        nonModifierPending.length < simKeys.length &&
        isSubset(nonModifierPending, simKeys)
      ) {
        simPartial.push(edge);
      }
    }

    // ---- ModifierStroke の評価 ----
    const modResults = edges
      .filter((e) => e.input.kind === "modifier")
      .map((edge) => ({ edge, result: matchCandidateEdge(event, edge) }));
    const modMatched = modResults
      .filter((m) => m.result.type === "matched")
      .map((m) => ({ edge: m.edge, keyCount: m.result.keyCount }));
    const modHasModified = modResults.some((m) => m.result.type === "modified");

    const otherMatched = matchOtherEdge(event, rule, edges);

    // (1) 同時押しの候補がまだ延長されうる (partial) 場合は pending
    //     同時 mod commit の候補があれば、keyup で救済するため tentative としてステージする
    if (simPartial.length > 0) {
      const tentative: TentativeCommit | undefined =
        modMatched.length > 0 ? { kind: "edge", edge: modMatched[0].edge } : undefined;
      return {
        result: { type: "pending" },
        nextState: { pendingDown, tentative },
      };
    }

    // (2) 同時押しが完全一致 → 即確定
    if (simFull.length > 0) {
      const edge = simFull[0];
      return this.commit(edge, event, pendingDown);
    }

    // (3) 以降は同時押しが関わらないケース。ModifierStroke の旧ロジックを踏襲する
    if (modMatched.length > 0) {
      const top = modMatched[0];
      // 他ルートがより強くマッチする場合は失敗
      if (otherMatched.type === "matched" && otherMatched.keyCount >= top.keyCount) {
        return {
          result: { type: "failed", event },
          nextState: { pendingDown, tentative: undefined },
        };
      }
      // 曖昧さがある場合はステージして keyup を待つ
      if (modHasModified || otherMatched.type === "modified") {
        return {
          result: { type: "pending" },
          nextState: { pendingDown, tentative: { kind: "edge", edge: top.edge } },
        };
      }
      // 曖昧さなし → 即確定
      return this.commit(top.edge, event, pendingDown);
    }

    // (4) 候補 mod エッジは accept しないが、どれかを修飾する可能性がある
    if (modHasModified) {
      if (otherMatched.type === "matched") {
        return {
          result: { type: "pending" },
          nextState: { pendingDown, tentative: { kind: "failure", event } },
        };
      }
      return {
        result: { type: "ignored" },
        nextState: { pendingDown, tentative: currentState.tentative },
      };
    }

    // (5) 候補エッジのいずれとも関係ない入力
    if (otherMatched.type === "matched") {
      return {
        result: { type: "failed", event },
        nextState: { pendingDown, tentative: currentState.tentative },
      };
    }
    return {
      result: { type: "ignored" },
      nextState: { pendingDown, tentative: currentState.tentative },
    };
  }

  private evaluateKeyup(
    event: InputEvent,
    currentState: CommitterState,
    currentNode: StrokeNode,
  ): { result: CommitResult; nextState: CommitterState } {
    const key = event.input.key;
    const preReleasePending = currentState.pendingDown;

    // (A) 同時押しの完全一致判定 (リリース直前の状態で)
    //     requiredModifier を考慮して pendingDown から modifier キーを除いた集合で比較する
    for (const edge of currentNode.nextEdges) {
      if (edge.input.kind !== "simultaneous") {
        continue;
      }
      const sim = edge.input;
      if (!sim.requiredModifier.accept(event.keyboardState)) {
        continue;
      }
      const nonModifierPending = preReleasePending.filter((k) => !sim.requiredModifier.has(k));
      if (sim.keys.length === nonModifierPending.length && isSubset(nonModifierPending, sim.keys)) {
        return this.commit(edge, event, preReleasePending);
      }
    }

    // (B) ModifierStroke の曖昧さ解消用 tentative を keyup で確定
    if (currentState.tentative?.kind === "edge") {
      return this.commit(currentState.tentative.edge, event, preReleasePending);
    }
    if (currentState.tentative?.kind === "failure") {
      const newPending = removeFirstOccurrence(preReleasePending, key);
      // tentative failure はステージ元のキーが release されたときのみ発火する。
      // 無関係なキーの keyup では tentative を維持し pendingDown だけ更新する。
      if (key === currentState.tentative.event.input.key) {
        return {
          result: { type: "failed", event: currentState.tentative.event },
          nextState: { pendingDown: newPending, tentative: undefined },
        };
      }
      return {
        result: { type: "ignored" },
        nextState: { pendingDown: newPending, tentative: currentState.tentative },
      };
    }

    // (C) 何もステージされていない keyup。単にキーを pendingDown から外す
    const newPending = removeFirstOccurrence(preReleasePending, key);
    return {
      result: { type: "ignored" },
      nextState: { pendingDown: newPending, tentative: undefined },
    };
  }

  /**
   * エッジを確定として返す。pendingDown からは確定に使ったキーだけを除去する。
   */
  private commit(
    edge: StrokeEdge,
    event: InputEvent,
    pendingDown: readonly VirtualKey[],
  ): { result: CommitResult; nextState: CommitterState } {
    let remaining: readonly VirtualKey[];
    if (edge.input.kind === "simultaneous") {
      remaining = pendingDown.filter((k) => !(edge.input as SimultaneousStroke).keys.includes(k));
    } else {
      remaining = removeFirstOccurrence(pendingDown, edge.input.key);
    }
    return {
      result: {
        type: "committed",
        stroke: { edge, triggerEvent: event },
      },
      nextState: { pendingDown: remaining, tentative: undefined },
    };
  }
}

/**
 * Rule.backspaceStrokes に対するマッチ結果。
 * - matched: 確定 (コミット相当)。Automaton は InputResult.BACK を返す
 * - partial: 同時押し backspace の部分一致。次の入力 (または keyup) まで pending
 * - none: どの backspace ストロークにも該当しない
 */
export type BackspaceMatchResult =
  | { readonly type: "matched" }
  | { readonly type: "partial" }
  | { readonly type: "none" };

/**
 * Rule.backspaceStrokes を評価するための独立マッチャ。
 *
 * StrokeCommitter と同じく同時押し・modifier 付きストロークの両方を扱うが、
 * StrokeEdge / StrokeNode には依存せず「RuleStroke[] のうちどれか」にマッチするかだけを見る。
 * currentNode の遷移候補とは独立に評価される (現在の状態に関係なく常に受理される特殊ストローク)。
 *
 * 通常 committer と同時に同じ keydown を受け取るのは望ましくない (pendingDown が重複するため)。
 * Automaton 側で「通常 committer が ignored を返す場合のみ BackspaceMatcher に feed する」
 * という順序制御を行うことで衝突を避ける。
 */
export class BackspaceMatcher {
  private pendingDown: readonly VirtualKey[] = [];

  /**
   * 入力を受け取り、マッチ結果を返すと同時に内部状態を更新する。
   */
  feed(event: InputEvent, strokes: readonly RuleStroke[]): BackspaceMatchResult {
    const { result, nextPending } = this.evaluate(event, this.pendingDown, strokes);
    this.pendingDown = nextPending;
    return result;
  }

  /**
   * 副作用なしで、入力を受け取ったらどういう結果になるかだけを返す。
   */
  dryRun(event: InputEvent, strokes: readonly RuleStroke[]): BackspaceMatchResult {
    return this.evaluate(event, this.pendingDown, strokes).result;
  }

  /**
   * 内部の pending 状態を完全にリセットする。
   */
  reset(): void {
    this.pendingDown = [];
  }

  /**
   * 現在 pending 中のキー集合 (同時押し backspace の partial 時に使用)。
   */
  get pendingKeys(): readonly VirtualKey[] {
    return this.pendingDown;
  }

  private evaluate(
    event: InputEvent,
    currentPending: readonly VirtualKey[],
    strokes: readonly RuleStroke[],
  ): { result: BackspaceMatchResult; nextPending: readonly VirtualKey[] } {
    if (strokes.length === 0) {
      return { result: { type: "none" }, nextPending: currentPending };
    }
    if (event.input.type === "keyup") {
      return this.evaluateKeyup(event, currentPending, strokes);
    }
    return this.evaluateKeydown(event, currentPending, strokes);
  }

  private evaluateKeydown(
    event: InputEvent,
    currentPending: readonly VirtualKey[],
    strokes: readonly RuleStroke[],
  ): { result: BackspaceMatchResult; nextPending: readonly VirtualKey[] } {
    const key = event.input.key;
    const pendingDown: VirtualKey[] = currentPending.includes(key)
      ? [...currentPending]
      : [...currentPending, key];

    // ---- ModifierStroke (単キー + modifier) の完全一致を優先評価 ----
    for (const stroke of strokes) {
      if (stroke.kind !== "modifier") {
        continue;
      }
      if (stroke.key !== key) {
        continue;
      }
      if (!stroke.requiredModifier.accept(event.keyboardState)) {
        continue;
      }
      // マッチ: pendingDown からこのキーを除いて確定
      const remaining = removeFirstOccurrence(pendingDown, stroke.key);
      return { result: { type: "matched" }, nextPending: remaining };
    }

    // ---- SimultaneousStroke の完全一致 / 部分一致評価 ----
    let hasPartial = false;
    for (const stroke of strokes) {
      if (stroke.kind !== "simultaneous") {
        continue;
      }
      if (!stroke.requiredModifier.accept(event.keyboardState)) {
        continue;
      }
      const nonModifierPending = pendingDown.filter(
        (k) => !(stroke as SimultaneousStroke).requiredModifier.has(k),
      );
      if (
        stroke.keys.length === nonModifierPending.length &&
        isSubset(nonModifierPending, stroke.keys)
      ) {
        // full match: 確定に使ったキーを除去
        const remaining = pendingDown.filter((k) => !stroke.keys.includes(k));
        return { result: { type: "matched" }, nextPending: remaining };
      }
      if (
        nonModifierPending.length < stroke.keys.length &&
        isSubset(nonModifierPending, stroke.keys)
      ) {
        hasPartial = true;
      }
    }

    if (hasPartial) {
      return { result: { type: "partial" }, nextPending: pendingDown };
    }

    // どの backspace ストロークにも一致しない。pendingDown には加えない
    // (backspace と無関係のキーを pending に溜めない)
    return { result: { type: "none" }, nextPending: currentPending };
  }

  private evaluateKeyup(
    event: InputEvent,
    currentPending: readonly VirtualKey[],
    strokes: readonly RuleStroke[],
  ): { result: BackspaceMatchResult; nextPending: readonly VirtualKey[] } {
    const key = event.input.key;
    // リリース直前の状態で同時押しの完全一致を再判定 (救済コミット)
    for (const stroke of strokes) {
      if (stroke.kind !== "simultaneous") {
        continue;
      }
      if (!stroke.requiredModifier.accept(event.keyboardState)) {
        continue;
      }
      const nonModifierPending = currentPending.filter(
        (k) => !(stroke as SimultaneousStroke).requiredModifier.has(k),
      );
      if (
        stroke.keys.length === nonModifierPending.length &&
        isSubset(nonModifierPending, stroke.keys)
      ) {
        const remaining = currentPending.filter((k) => !stroke.keys.includes(k));
        return { result: { type: "matched" }, nextPending: remaining };
      }
    }
    // 通常の keyup: キーを pendingDown から除く
    const newPending = removeFirstOccurrence(currentPending, key);
    return { result: { type: "none" }, nextPending: newPending };
  }
}

function isSubset(smaller: readonly VirtualKey[], larger: readonly VirtualKey[]): boolean {
  for (const k of smaller) {
    if (!larger.includes(k)) {
      return false;
    }
  }
  return true;
}

function removeFirstOccurrence(
  keys: readonly VirtualKey[],
  target: VirtualKey,
): readonly VirtualKey[] {
  const idx = keys.indexOf(target);
  if (idx < 0) {
    return keys;
  }
  return [...keys.slice(0, idx), ...keys.slice(idx + 1)];
}

// ModifierStroke 専用の照合ヘルパ
type MatchResult = {
  type: "matched" | "modified" | "none" | "failed";
  keyCount: number;
};

function matchCandidateEdge(event: InputEvent, edge: StrokeEdge): MatchResult {
  const stroke = edge.input;
  if (stroke.kind !== "modifier") {
    return { type: "none", keyCount: 0 };
  }
  // 入力されたキーがマッチし、
  if (event.input.key === stroke.key) {
    // 必要な modifier がすべて押されていたら成功
    if (stroke.requiredModifier.accept(event.keyboardState)) {
      return {
        type: "matched",
        keyCount: stroke.requiredModifier.groups.length + 1,
      };
    }
    return { type: "failed", keyCount: 0 };
  }
  if (stroke.requiredModifier.onlyModifierDowned(event.keyboardState)) {
    return { type: "modified", keyCount: 0 };
  }
  return { type: "none", keyCount: 0 };
}

function matchOtherEdge(event: InputEvent, rule: Rule, candidateEdges: StrokeEdge[]): MatchResult {
  if (candidateEdges.length === 0) {
    return { type: "none", keyCount: 0 };
  }
  // 今回の入力が Rule 内のいずれかの entry の最初の入力に match する
  const otherMatched = rule.entriesByKey(event.input.key).filter((entry) => {
    const firstStroke = entry.input[0];
    if (firstStroke.kind !== "modifier") {
      return false;
    }
    // いずれかの候補エッジと同じ input を持つ entry は除く
    // 結果的に同じ input で異なる output を持つ entry も除かれる
    // 例えば [t: か] という候補エッジがあるとき、[t: t] という entry は除かれる
    return (
      !candidateEdges.some((edge) => {
        return edge.input.equals(firstStroke);
      }) && firstStroke.requiredModifier.accept(event.keyboardState)
    );
  });
  // マッチしたもののうちもっとも modifier が多い entry の modifier の数を返す
  if (otherMatched.length > 0) {
    const keyCount =
      Math.max(
        ...otherMatched.map((e) => {
          const s = e.input[0];
          return s.kind === "modifier" ? s.requiredModifier.groups.length : 0;
        }),
      ) + 1;
    return { type: "matched", keyCount: keyCount };
  }
  // 今回の入力が Rule 内のいずれかの entry の最初の入力の modifier に match する
  const existsModifiedEntries = rule.entriesByModifier(event.input.key).some((entry) => {
    // 候補エッジは除く
    return !candidateEdges.some((edge) => {
      return edge.input.equals(entry.input[0]);
    });
  });
  if (existsModifiedEntries) {
    return { type: "modified", keyCount: 0 };
  }
  return { type: "none", keyCount: 0 };
}
