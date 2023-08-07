[![main branch](https://github.com/tomoemon/emiel/actions/workflows/main.yaml/badge.svg)](https://github.com/tomoemon/emiel/actions/workflows/main.yaml)

# これは何？

emiel（エミエル）は超汎用日本語タイピングゲーム用ライブラリです。

タイピングゲームを作る際に必要となる、以下の機能を提供します。

- ローマ字入力
  - Google 日本語入力(Mozc) と同等のローマ字入力ルールを完全サポート
  - 「しゃ：sha, sya」といった入力の自動判別
  - 「っっか：kkka」と打鍵可能
  - MS-IME 等他の日本語入力システムに合わせたローマ字入力ルールも作成可能
- かな入力
  - いずれの入力方法にしても使い方は同じなので切り替えが簡単
- キーボードレイアウトの切り替え機能
  - QWERTY, Dvorak, Colemak といった英字入力のキーボードレイアウトの切り替え
  - OS のキーボードレイアウトを自動認識 (Chrome, Edge のみ)

また、以下のような多様な日本語入力方法をサポートしており、React や Vue 等の特定の UI ライブラリ・フレームワークに依存せずにタイピングゲームを簡単に作成することができます。

- ローマ字拡張系：AZIK、ACT 等
- ローマ字無拡張系：Dvorak、Colemak、大西配列、Tomisuke 配列等
- 中指シフト系：月配列等
- 同時打鍵系：新下駄配列、薙刀式等
- 親指シフト系：NICOLA、飛鳥カナ配列等

# 使い方

<a href="./examples/">examples/</a> を参照してください。

# 特徴

## 使いやすいインターフェース

入力配列によらず最小限の概念を把握するだけで簡単にタイピングゲームを作成することができます。

- `KeyboardLayout`
  - キーボードレイアウトを表すクラス（Qwerty JIS, US, Dvorak 等）
  - 基本的には `emiel.keyboard.detect()` で自動認識するだけでよい
  - プリセットで用意されているレイアウト以外でも JSON 形式で自由にレイアウトすることができる
- `Rule`
  - 入力配列を表すクラス（ローマ字入力やかな入力等）
  - 基本的には `emiel.rule.get(...)` で名前を指定して取得する
  - プリセットで用意されている配列以外でも JSON 形式、Mozc 形式で自由に作成することができる
- `Automaton`
  - ワードのキーボード入力を受け付けるクラス。タイピングゲームの中心的な概念。入力が成功したか、どこまで入力したか、残りの文字はなにかといった情報を持つ

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

## シンプルで柔軟性の高い設定ファイル

Mozc(GoogleIME)のローマ字設定ファイルの仕様をベースにすることで、シンプルで柔軟性の高い設定ファイルを実現しています。一般的な実装ではローマ字入力における「っ」や「ん」に関する入力ルールを、大量に記述するか、あるいはハードコードする必要がありますが、emiel では Mozc 同様にこれらの入力ルールを極めてシンプルに記述することができます。

## Pure TypeScript

依存ライブラリのない、pure な TypeScript で実装されており、React や Vue 等の特定の UI ライブラリ・フレームワークに依存せずにタイピングゲームを作成することができます。

# ブラウザサポート

|             | Chrome  | Edge    | Firefox      | Safari       |
| ----------- | ------- | ------- | ------------ | ------------ |
| Windows 11  | o       | o       | o            | -            |
| Mac Ventura | o       | o       | △(eisu,kana) | △(eisu,kana) |
| Linux       | not yet | not yet | not yet      | not yet      |

- Windows の Safari はサポート終了
- Mac の Firefox, Safari では本体 JIS キーボードの「英数」と「かな」のキー押下で KeyboardEvent が発火しない
- Linux は未確認
