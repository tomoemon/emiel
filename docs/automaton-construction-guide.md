# Automaton構築処理の詳細ガイド

## 概要

emielのAutomatonは、日本語タイピングゲームにおける入力状態を管理する中核的なクラスです。ユーザーが入力すべき「かな文字列」を受け取り、キーボード入力に対して「正解/不正解」を判定し、入力の進捗を追跡します。

このドキュメントでは、Automatonがどのように構築されるかを詳細に説明します。

## Automaton構築の全体フロー

```
入力: かな文字列（例: "がっこう"）+ Rule（入力規則）+ KeyboardLayout
                    ↓
┌─────────────────────────────────────┐
│ 1. Rule作成/ロード                   │
│   - Mozc/JSON形式からRuleを作成      │
│   - RuleEntryのリストを生成          │
└─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│ 2. Rule前処理                        │
│   - Common Prefix Extension         │
│   - 最長一致規則への対応             │
└─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│ 3. KanaNodeグラフ構築                │
│   - かな文字列から逆向きグラフ生成    │
│   - RuleEntryとの対応付け            │
└─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│ 4. StrokeNodeグラフ変換              │
│   - KanaNodeからStrokeNodeへ変換     │
│   - 最短経路のコスト計算             │
└─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│ 5. Automatonインスタンス生成         │
│   - 開始ノード設定                   │
│   - 入力受付準備完了                 │
└─────────────────────────────────────┘
```

## 各ステップの詳細

### 1. Rule作成/ロード

#### Mozc形式の場合

Mozc（Google日本語入力）互換形式のテキストファイルからRuleを作成します。

```typescript
// Mozc形式の例
// 入力<TAB>出力<TAB>次の入力
a	あ	
ka	か	
tt	っ	t
```

`mozcRuleLoader.ts`での処理:
1. 各行をタブで分割し、3つの要素（入力、出力、次の入力）を取得
2. 入力文字列を`KeyboardLayout`を使って`RuleStroke[]`に変換
3. `RuleEntry`オブジェクトを生成

```typescript
// 処理例: "ka" → RuleEntry
const inputs: RuleStroke[][] = [...cols[0]].map((c) => 
  toStrokesFromChar(layout, c)  // "k", "a" それぞれをRuleStrokeに変換
);
const output = cols[1];  // "か"
const nextInput: RuleStroke[] = [...cols[2]].map((c) => 
  toStrokesFromChar(layout, c)[0]
);
```

#### RuleEntryの構造

```typescript
class RuleEntry {
  input: RuleStroke[];      // 入力キー列（例: [k, a]）
  output: string;           // 出力文字列（例: "か"）
  nextInput: RuleStroke[];  // 次の入力（例: [t] for "っ"）
  extendCommonPrefixCommonEntry: boolean;  // 共通接頭辞展開フラグ
}
```

### 2. Rule前処理（Common Prefix Extension）

最長一致規則に対応するため、共通接頭辞を持つエントリを事前展開します。

#### なぜ必要か？

例えば以下のルールがある場合：
```
n   ん
na  な
ka  か
```

"んか"を入力する際、`n`単体では「ん」を確定できません（後続が`a`なら「な」になるため）。
そこで、`n`の後に`na`以外のパターンが来る場合のルールを事前に生成します。

#### 展開処理の例

`ruleExtender.ts`での処理:
```
元のルール:
n   ん
na  な
ka  か

↓ 展開後

nk  ん  k   (nの後にkが来たら「ん」確定、次の入力はk)
na  な
ka  か
```

この展開により、オートマトン構築時に最長一致を考慮する必要がなくなります。

### 3. KanaNodeグラフ構築

`builderKanaGraph.ts`で、かな文字列から逆向きのグラフ構造を構築します。

#### 例: "やった"の場合

```
終端 ← "た" ← "っ" ← "や" ← 開始
 $      KanaNode[3]  KanaNode[2]  KanaNode[1]  KanaNode[0]

各ノード間は KanaEdge で接続され、対応するRuleEntryを保持
```

処理の流れ:
1. かな文字列の各文字に対応する`KanaNode`を作成
2. 文字列の末尾から開始し、各位置で適用可能な`RuleEntry`を探索
3. `RuleEntry`の出力が現在の部分文字列と一致する場合、エッジを作成

```typescript
// "やった"の場合の処理例
// i=3: "やった"の末尾から確認
//   - "ta/た" にマッチ → KanaNode[2]からKanaNode[3]へのエッジ作成
// i=2: "やっ"の末尾から確認  
//   - "tt/っ/t" にマッチ → KanaNode[1]からKanaNode[2]へのエッジ作成（次の入力付き）
//   - "ltu/っ", "xtu/っ" にもマッチ → 複数のエッジ作成
// i=1: "や"の末尾から確認
//   - "ya/や" にマッチ → KanaNode[0]からKanaNode[1]へのエッジ作成
```

#### 次の入力の処理

"tt/っ/t"のような「次の入力」を持つエントリの場合、次のノードとの接続可能性を確認します。

```typescript
if (entry.hasNextInput) {
  // 次の入力 "t" が、次のKanaNodeの "ta" と接続可能か確認
  nextNode.connectEdgesWithNextInput(previousNode, entry);
}
```

### 4. StrokeNodeグラフへの変換

`builderStrokeGraph.ts`で、KanaNodeグラフをキーストローク単位のグラフに変換します。

#### 変換の目的

- KanaNodeは「かな単位」のノード
- StrokeNodeは「キーストローク単位」のノード
- タイピングゲームでは1打鍵ごとの判定が必要

#### 変換処理

```typescript
function buildStrokeNode(endKanaNode: KanaNode): StrokeNode {
  // 1. 終端から逆向きに探索
  // 2. 各KanaEdgeをStrokeEdgeの列に展開
  // 3. コスト（最短打鍵数）を計算
  // 4. 同じキー入力は共有してグラフを最適化
}
```

例: "やった"の場合
```
KanaGraph:
開始 --[ya/や]--> [っ] --[tta/った]--> 終端

StrokeGraph:
開始 -[y]-> -[a]-> [っ] -[t]-> -[t]-> -[a]-> 終端
              |                    |
              +-[l]-[t]-[u]--------+  (別経路: ltu)
              |                    |
              +-[x]-[t]-[u]--------+  (別経路: xtu)
```

#### コスト計算

各ノードから終端までの最短打鍵数を計算し、`nextEdges[0]`が常に最短経路になるよう並び替えます。

### 5. Automatonインスタンス生成

最終的に、以下の要素でAutomatonを構築します：

```typescript
export function build(rule: Rule, kanaText: string): Automaton {
  const [_, endKanaNode] = buildKanaNode(rule, kanaText);
  const startNode = buildStrokeNode(endKanaNode);
  return new Automaton(kanaText, startNode, rule);
}
```

## 実装例

### 基本的な使用例

```typescript
// 1. KeyboardLayoutの準備
const layout = await detectKeyboardLayout(window);

// 2. Ruleのロード
const rule = loadPresetRuleRoman(layout);

// 3. Automatonの構築
const automaton = rule.build("がっこう");

// 4. 入力の処理
window.addEventListener("keydown", (e) => {
  const inputEvent = createInputEvent(e);
  const result = automaton.input(inputEvent);
  
  if (result.isSucceeded) {
    console.log("正解！");
    console.log("完了:", automaton.finishedWord);
    console.log("残り:", automaton.pendingWord);
  }
});
```

### カスタムRuleの作成

```typescript
// Mozc形式の文字列からRule作成
const mozcText = `
a	あ	
ka	か	
tt	っ	t
`;
const rule = loadMozcRule(mozcText, layout);

// JSON形式からRule作成
const jsonRule = {
  entries: [
    { input: "a", output: "あ" },
    { input: "ka", output: "か" },
    { input: "tt", output: "っ", nextInput: "t" }
  ]
};
const rule = loadJsonRule(jsonRule);
```

## 内部動作の詳細

### 入力判定のアルゴリズム

Automatonの`testInput`メソッドでは、以下の判定を行います：

1. 現在のノードから遷移可能なエッジを確認
2. 入力されたキーとマッチするエッジを探索
3. 他の可能な入力との競合を確認（最長一致の考慮）
4. 修飾キー付き入力の場合は仮確定状態を使用

### 状態遷移の管理

- `_currentNode`: 現在の位置
- `_edgeHistories`: これまでの入力履歴
- `_failedEventsAtCurrentNode`: 現在位置での失敗入力

これらの状態により、入力の進捗、ミスタイプ数、入力時間などの統計情報を提供できます。

## まとめ

Automatonの構築は以下の5つのステップで行われます：

1. **Rule作成**: 入力方式の定義をロード
2. **前処理**: 最長一致規則への対応
3. **KanaNode構築**: かな単位のグラフ生成
4. **StrokeNode変換**: キーストローク単位への変換
5. **Automaton生成**: 入力判定エンジンの完成

この設計により、様々な日本語入力方式（ローマ字、かな、AZIK、親指シフトなど）に対応し、効率的な入力判定を実現しています。