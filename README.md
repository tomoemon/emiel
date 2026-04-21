[![main branch](https://github.com/tomoemon/emiel/actions/workflows/main.yaml/badge.svg)](https://github.com/tomoemon/emiel/actions/workflows/main.yaml)

# これは何？

emiel（エミエル）は超汎用日本語タイピングゲーム用ライブラリです。

ローマ字入力・かな入力を含むさまざまな入力配列を共通のインターフェースで扱えるため、配列を切り替えても同じコードでタイピングゲームを実装できます。React や Vue 等の特定の UI ライブラリ・フレームワークには依存しません。

## サポートする入力配列

- 標準ローマ字
  - Google 日本語入力(Mozc) と同等のローマ字入力ルールを完全サポート
  - 「しゃ：sha, sya」といった入力の自動判別、「っっか：kkka」のような打鍵にも対応
  - MS-IME 等、他の日本語入力システムに合わせたルールも作成可能
- ローマ字拡張系：AZIK、ACT 等
- ローマ字無拡張系：Dvorak、Colemak、大西配列、Tomisuke 配列 等
- JIS かな入力
- 中指シフト系：月配列 等
- 同時打鍵系：新下駄配列、薙刀式 等
- 親指シフト系：NICOLA、飛鳥カナ配列 等
- 上記以外の任意の入力配列も JSON Rule 形式・Mozc 形式で定義可能

## キーボードレイアウト

QWERTY (JIS / US), Dvorak, Colemak 等のプリセットに対応しており、OS のキーボードレイアウトを自動検出できます（Chrome / Edge のみ。未対応ブラウザでは QWERTY JIS にフォールバック）。独自のレイアウトを JSON で定義することもできます。

# 使い方

## インストール

```bash
npm install emiel
```

## 最小コード例

```typescript
import {
  build,
  activate,
  createDirectInputRule,
  detectKeyboardLayout,
  loadPresetRuleRoman,
} from "emiel";

// キーボードレイアウトを自動検出
const layout = await detectKeyboardLayout(window);

// ローマ字入力ルールを作成
const romanRule = loadPresetRuleRoman(layout);
// 英数字の直接入力ルールを作成
// （"hello" のように英字・記号のみのワードや、"aから@" のように混ざるケースに対応）
// かなの入力しかさせない場合はルールの合成は不要
const directInputRule = createDirectInputRule(layout);
// ２つのルールを統合してオートマトンを作成
const rule = romanRule.merge(directInputRule);
const automaton = build(rule, "かった");

// キーボードイベントを購読
activate(window, (event) => {
  const result = automaton.input(event);
  const view = automaton.currentView();
  console.log(view.finishedRoman, view.pendingRoman);
  if (result.isFinished) {
    console.log("入力完了!");
  }
});
```

## レイテンシの計測

ワードが表示されてから最初の1打鍵が成功するまでの時間（レイテンシ）を計測する例です。

高精度な時刻取得にはブラウザ組み込みの `performance.now()` を使います。ミリ秒未満の精度を持つ単調増加時刻（`DOMHighResTimeStamp`）を返す関数で、`KeyboardEvent.timeStamp` や `automaton.eventsView()` から得られる各入力イベントの `timestamp` と同じ時間軸のため、差分を取るだけで経過時間を計算できます（`Date.now()` とは時間軸が異なるため併用不可）。

```typescript
const automaton = build(rule, "かった");

// ワードが表示された瞬間の時刻を記録
const wordDisplayedAt = performance.now();

activate(window, (event) => {
  automaton.input(event);
  const events = automaton.eventsView();
  // succeededCount が 1 になる瞬間 ＝ 最初の1打鍵成功時
  if (events.succeededCount === 1) {
    const latency = events.firstSucceeded!.timestamp - wordDisplayedAt;
    console.log(`latency: ${latency}ms`);
  }
});
```

## Examples

- <a href="./examples/react-simple">react-simple</a> - 単語を次々と入力するシンプルなタイピング練習
- <a href="./examples/react-backspace">react-backspace</a> - バックスペースの3つの実装パターン比較（全クリア/カウント/入力戻し）
- <a href="./examples/react-roman-or-kana">react-roman-or-kana</a> - ローマ字入力とJISかな入力の両対応デュアル入力モード
- <a href="./examples/react-mixed-guide">react-mixed-guide</a> - 漢字かな混じりテキストのローマ字入力
- <a href="./examples/react-multi-word">react-multi-word</a> - 複数単語を同時表示するマルチターゲットタイピング
- <a href="./examples/react-result-record">react-result-record</a> - タイピング成績（タイム・入力数）の記録・表示
- <a href="./examples/react-keyboardguide">react-keyboardguide</a> - 物理キーボード配列・入力ガイドのビジュアライザー
- <a href="./examples/react-stroke-graph">react-stroke-graph</a> - キー入力の状態遷移をグラフで可視化
- <a href="./examples/cli">cli</a> - Node.js 環境でのオートマトン直接操作

# 特徴

## 使いやすいインターフェース

入力配列によらず最小限の概念を把握するだけで簡単にタイピングゲームを作成することができます。

- `KeyboardLayout`
  - キーボードレイアウトを表すクラス（Qwerty JIS, US, Dvorak 等）
  - 基本的には `emiel.detectKeyboardLayout()` で自動認識するだけでよい
  - プリセットで用意されているレイアウト以外でも JSON 形式で自由に定義できる
- `Rule`
  - 入力配列を表すクラス（ローマ字入力やかな入力等）
  - 基本的にはプリセット関数（`emiel.loadPresetRuleRoman()`, `emiel.loadPresetRuleJisKana()` 等）で取得する
  - プリセットで用意されている配列以外でも JSON 形式、Mozc 形式で自由に作成できる
- `Automaton`
  - ワードのキーボード入力を受け付けるクラス。タイピングゲームの中心的な概念
  - `emiel.build(rule, "かった")` のように `Rule` とワードから生成する
  - `automaton.input(event)` に入力イベントを渡すと `InputResult` を返し、`isSucceeded` / `isFailed` / `isFinished` / `isBack` 等で打鍵結果を分類できる
  - `automaton.currentView()` で「どこまで入力したか」「残りの文字は何か」といった表示用の情報を取得できる
- `activate`
  - `window` 等の EventTarget から `keydown` / `keyup` を購読し、ブラウザ差を吸収した `InputEvent` を `Automaton` に流し込むための関数
  - `emiel.activate(window, (event) => automaton.input(event))` のように使う
  - 戻り値の関数を呼ぶとイベントリスナーを解除できる

## 多様なスタイルのタイピングゲームをサポート

以下のような多様なワード形式・表示方式をサポートしています。

- ワード形式
  - 「WeatherTyping」「e-typing」のようにワード数の決まった単語・文章を入力していくタイプ
  - 「寿司打」のようにワード数の決まっていない単語・文章を入力していくタイプ
  - 「タイプウェル」のように単語の連続を入力していくタイプ
  - 「タイピングオブザデッド」のように複数のワードを同時に表示して、任意のワードを選択して打つことができるタイプ
  - 「TypeRacer」のように誤ったキー入力を Backspace キーで消さなければいけないタイプ
- 表示形式
  - 「WeatherTyping」「e-typing」「寿司打」のようにローマ字のみを状態遷移しながら表示するタイプ
  - 「タイプウェル」のようにローマ字とかな文字、漢字かな混じり文字を状態遷移しながら表示するタイプ

## Backspace のカスタマイズ対応

ローマ字入力やかな入力以外の入力配列（薙刀式、新下駄配列など）では、入力効率を高めるために backspace キーをホームポジションに近い打ちやすい位置に配置することがあります。たとえば薙刀式(v15)では U キー単独を backspace として使用します。

既存の多くのタイピングゲームでは backspace が考慮されておらず、こうした配列の入力効率を正しく測定できません。emiel では、入力ルール定義の中で任意のキーやキーの組み合わせを backspace として指定できます。

```json
{
  "backspaces": [{ "keys": ["U"] }],
  "entries": [...]
}
```

backspace が発動すると `InputResult.BACK` が返されるため、アプリケーション側でミス入力の取り消しや成功ストロークの巻き戻しなど、ゲームルールに合わせた復旧ロジックを自由に実装できます。backspace を含むすべての入力イベントは `automaton.inputHistory` に時系列で記録されるため、backspace の使用頻度も含めた正確な入力統計を取得できます。

## シンプルで柔軟性の高い設定ファイル

入力配列の定義方法として、Mozc 形式と JSON Rule 形式の 2 種類をサポートしています。

### Mozc 形式

Google 日本語入力(Mozc)のローマ字設定ファイルと同じ形式です。タブ区切りで「入力」「出力」「次入力（省略可）」の 2〜3 列で記述します。

```
a	あ
ka	か
tt	っ	t
nn	ん
```

一般的な実装ではローマ字入力における「っ」や「ん」のルールを大量に記述するか、ハードコードする必要があります。Mozc 形式では 3 列目の次入力フィールドを使うことで、`tt → っ（次の入力として t を受け付ける）` というルールを 1 行で表現できます。

input 列には英数記号を指定するため、実際に押すキーは KeyboardLayout に依存します。たとえば `s` という文字を入力する物理キーの位置は、QWERTY と Dvorak では異なります。

### JSON Rule 形式

同時押し・修飾キー・順次入力の 3 種類の入力パターンを自由に組み合わせて入力ルールを定義できます。input には物理キー名（`"A"`, `"Space"`, `"LangLeft"` 等）を直接指定するため、KeyboardLayout に依存しません。

```json
{
  "entries": [
    // 単打（ローマ字入力）
    {
      "input": [{ "keys": ["A"] }],
      "output": "あ"
    },
    // 同時押し（NICOLA 親指シフト：W と左親指シフトキーを同時に押す）
    {
      "input": [{ "keys": ["W", "LangLeft"] }],
      "output": "ぬ"
    },
    // 修飾キー（薙刀式：Space を押しながら W を押す）
    {
      "input": [{ "keys": ["W"], "modifiers": [["Space"]] }],
      "output": "ぬ"
    },
    // 順次入力（JIS かな入力：Digit2 を押した後に BracketLeft を押す）
    {
      "input": [{ "keys": ["Digit2"] }, { "keys": ["BracketLeft"] }],
      "output": "ぶ"
    }
  ]
}
```

- 単打：`keys` に 1 キーを指定
- 同時押し：`keys` に複数キーを指定（順不同で同時に押す）
- 修飾キー：`modifiers` に先押しするキーを指定
- 順次入力：`input` 配列に複数の stroke を順に並べる

# ブラウザサポート

キーイベントの受信可否に関するサポート状況です。

|             | Chrome  | Edge    | Firefox      | Safari       |
| ----------- | ------- | ------- | ------------ | ------------ |
| Windows 11  | o       | o       | o            | -            |
| Mac Ventura | o       | o       | △(eisu,kana) | △(eisu,kana) |
| Linux       | not yet | not yet | not yet      | not yet      |

- o：全キー正常動作
- △：一部キーで制限あり（注釈参照）
- -：サポート終了
- not yet：未確認

注釈:

- Windows の Safari はサポート終了
- Mac の Firefox, Safari では本体 JIS キーボードの「英数」と「かな」のキー押下で KeyboardEvent が発火しない
- Linux は未確認

OS のキーボードレイアウト自動検出（`detectKeyboardLayout()`）は、ブラウザの [Keyboard API](https://developer.mozilla.org/en-US/docs/Web/API/Keyboard/getLayoutMap) に依存するため Chrome / Edge のみ対応しています。未対応ブラウザでは QWERTY JIS にフォールバックします。
