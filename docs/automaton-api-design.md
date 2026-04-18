# Automaton API 設計

## 概要

Automaton の状態参照 API は、データソース軸（現在位置 vs 入力履歴）で 2 つのメソッドに集約する。

```typescript
import { build } from "emiel";

// 基本（追加の opt-in 無し）
const a = build(rule, "こんにちは");

// カスタム拡張
const a = build(rule, "こんにちは").with({
  getProgress: (state) => (state.currentNode.kanaIndex / state.word.length) * 100,
});
```

## 設計の分類軸

Automaton の状態参照には以下 2 つの軸がある:

1. データソース軸: `currentNode` ベースの「現在位置の分割」 vs `inputHistory` ベースの「入力イベント集計」
2. back 軸: back() 取消をどう扱うか

軸 2 については、「一部の統計だけが ON/OFF で意味が変わる」ものの、現在位置ベースの値（`currentView()`）は `currentNode` 経由で常に back 反映されるため軸として現れない。また、集計系（`eventsView()`）については back 取消を除外した値を常に返す（effective デフォルト）。

## クエリ

### `automaton.currentView(): CurrentView`

現在位置ベースの派生値。リアルタイム表示に使う。

- `finishedWord: string` — 入力完了したかな文字列
- `pendingWord: string` — 未入力のかな文字列
- `finishedRoman: string` — 入力完了したローマ字列（非ローマ字系 Rule では空文字列）
- `pendingRoman: string` — 未入力のローマ字列（同上）
- `finishedStroke: RuleStroke[]` — 入力完了したキーストローク列
- `pendingStroke: RuleStroke[]` — 最短で完了するキーストローク列

### `automaton.eventsView(): EventsView`

`inputHistory` から算出した集計。back() の扱いはフィールドごとに異なる:

- `first: InputEvent | undefined` — 最初の入力イベント（成功・失敗問わず）
- `last: InputEvent | undefined` — 最後の入力イベント（同上）
- `firstSucceeded: InputEvent | undefined` — 最初の成功入力イベント（back 取消を除外）
- `lastSucceeded: InputEvent | undefined` — 最後の成功入力イベント（同上）
- `succeededCount: number` — 有効な成功打鍵数（back 取消を除外）
- `failedCount: number` — 失敗打鍵数（back 取消区間のミスも含む）
- `totalCount: number` — `succeededCount + failedCount`

時刻は `event.timestamp` から取得する:

```typescript
const events = automaton.eventsView();
const latencyMs = events.firstSucceeded?.timestamp ?? 0;
```

### 状態判定

- 完了判定は `automaton.currentNode.isFinished`（`StrokeNode` のゲッター）
- 開始済み判定は `automaton.inputHistory.length > 0`
- `back()` — 直前の成功遷移を1つ取り消す（`AutomatonImpl` の直接メソッド）

## カスタム拡張（with）

ユーザーが独自のクエリを追加できる。拡張関数は `AutomatonState` を受け取り、値を返す純粋関数として定義する。

```typescript
const a = build(rule, "こんにちは").with({
  getProgress: (state) => (state.currentNode.kanaIndex / state.word.length) * 100,
  getKPM: (state) => {
    const succeeded = automatonView.eventsView(state).succeededCount;
    const first = automatonView.eventsView(state).first?.timestamp;
    const last = automatonView.eventsView(state).last?.timestamp;
    if (!first || !last) return 0;
    return (succeeded / (last - first)) * 60000;
  },
});

a.getProgress(); // number
a.getKPM();      // number
```

## 型の構造

```
Automaton = AutomatonImpl & BaseExtensionType
  .with(custom) -> this & { [K]: () => ReturnType<custom[K]> }
```

`BaseExtensionType` には `currentView()` / `eventsView()` が含まれる。
`back()` は `AutomatonImpl` のメソッドとして常に公開。
`.with()` は `this &` を返すため、自由に組み合わせられる。
