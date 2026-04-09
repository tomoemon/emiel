# Automaton API 設計

## 概要

Automaton の状態参照 API は、用途に応じてビルダーチェーンで必要な機能を追加する設計をとる。

```typescript
import { build } from "emiel";

// 基本
const a = build(rule, "こんにちは");

// backspace 考慮クエリ付き
const a = build(rule, "こんにちは").withBackspace();

// 組み合わせ
const a = build(rule, "こんにちは").withBackspace();

// カスタム拡張
const a = build(rule, "こんにちは").with({
  getProgress: (state) => (state.currentNode.kanaIndex / state.word.length) * 100,
});
```

## 設計の背景

従来の API には以下の問題があった:

1. `automaton.xxx()` と `AutomatonGetters.xxx(automaton)` の2つの参照パターンが混在していた
2. ローマ字専用のクエリ（getFinishedRoman 等）と共通クエリが区別なく同居していた
3. backspace 対応のクエリと非対応のクエリが混在し、挙動の違いが名前から読み取れなかった
4. `rule.build()` が Rule の責務（入力ルール定義）を超えて Automaton 構築の責務を持っていた

## クエリの分類

### 基本クエリ（常に利用可能）

すべての Automaton で使用できるクエリとメソッド。

- `getFinishedWord()` — 入力完了したかな文字列
- `getPendingWord()` — 未入力のかな文字列
- `getFinishedStroke()` — 入力完了したキーストローク列
- `getPendingStroke()` — 最短で完了するキーストローク列
- `getEffectiveEdges()` — 有効な遷移 edge 列（back() で取り消された分は除外）
- `isFinished()` — 入力が完了しているか
- `getFirstInputTime()` — 最初の入力時刻（成功・失敗問わず、back 取り消し区間含む）
- `getLastInputTime()` — 最後の入力時刻（同上）
- `getFirstSucceededInputTime()` — 最初の成功入力時刻（back 取り消し区間含む）
- `getLastSucceededInputTime()` — 最後の成功入力時刻（同上）
- `getFailedInputCount()` — ミス入力数（back 取り消し区間含む）
- `getTotalInputCount()` — getEffectiveEdges.length + getFailedInputCount
- `getFinishedRoman()` — 入力完了したローマ字列（非ローマ字系 Rule では空文字列）
- `getPendingRoman()` — 未入力のローマ字列（同上）
- `back()` — 直前の成功遷移を1つ取り消す

### Backspace 拡張（withBackspace）

back() で取り消された区間を考慮した統計クエリを別名で追加する。基本クエリの挙動は変わらない。

- `getEffectiveFailedInputCount()` — back() で取り消された区間のミスを除外した失敗数
- `getEffectiveTotalInputCount()` — getEffectiveEdges.length + getEffectiveFailedInputCount
- `getEffectiveFirstSucceededInputTime()` — back() で取り消されていない最初の成功入力時刻
- `getEffectiveLastSucceededInputTime()` — back() で取り消されていない最後の成功入力時刻

## カスタム拡張（with）

ユーザーが独自のクエリを追加できる。拡張関数は `AutomatonState` を受け取り、値を返す純粋関数として定義する。

```typescript
const a = build(rule, "こんにちは").with({
  getProgress: (state) => (state.currentNode.kanaIndex / state.word.length) * 100,
  getKPM: (state) => {
    const edges = getEffectiveEdges(state);
    const duration = getLastInputTime(state).getTime() - getFirstInputTime(state).getTime();
    return (edges.length / duration) * 60000;
  },
});

a.getProgress(); // number
a.getKPM();      // number
```

## 型の構造

```
Automaton = AutomatonImpl & BaseExtensionType
  .withBackspace() -> this & BackspaceExtensionType
  .with(custom)    -> this & { [K]: () => ReturnType<custom[K]> }
```

back() は AutomatonImpl のメソッドとして常に公開。
各チェーンは `this &` を返すため、自由に組み合わせられる。

## Selector との互換性

Selector は `Inputtable` インターフェース（`input()` + `reset()` のみ）に依存する。withBackspace の有無に関わらず、すべての Automaton は Selector で管理できる。

```typescript
import { build, Selector } from "emiel";

const selector = new Selector([
  build(romanRule, word),
  build(kanaRule, word),
]);
```
