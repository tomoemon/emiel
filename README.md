[![main branch](https://github.com/tomoemon/emiel/actions/workflows/main.yaml/badge.svg)](https://github.com/tomoemon/emiel/actions/workflows/main.yaml)

# これは何？

emiel（エミエル）は超汎用日本語タイピングゲーム用ライブラリです。

タイピングゲームを作る際に必要となる、以下の機能を提供します。

- ローマ字入力
  - Google 日本語入力(Mozc) と同等のローマ字入力ルールをサポート
  - 「しゃ：sha, sya」といった入力の自動判別
- かな入力
  - いずれの入力方法にしても使い方は同じなので切り替えが簡単
- キーボードレイアウトの切り替え機能
  - QWERTY, Dvorak, Colemak といった英字入力のキーボードレイアウトの切り替え

また、以下のような多様な日本語入力方法をサポートしており、React や Vue 等の特定の UI ライブラリ・フレームワークに依存せずにタイピングゲームを簡単に作成することができます。

- ローマ字拡張系：AZIK、ACT 等
- ローマ字無拡張系：Dvorak、Colemak、大西配列、Tomisuke 配列等
- 中指シフト系：月配列等
- 同時打鍵系：新下駄配列、薙刀式等
- 親指シフト系：NICOLA、飛鳥カナ配列等

# 使い方

TBD

# 特徴

## シンプルなインターフェース

TBD

## シンプルで柔軟性の高い設定ファイル

Mozc(GoogleIME)のローマ字設定ファイルの仕様をベースにすることで、シンプルで柔軟性の高い設定ファイルを実現しています。一般的な実装ではローマ字入力における「っ」や「ん」に関する入力ルールを、大量に記述するか、あるいはハードコードする必要がありますが、emiel では Mozc 同様にこれらの入力ルールを極めてシンプルに記述することができます。

## Pure TypeScript

依存ライブラリのない、pure な TypeScript で実装されており、React や Vue 等の特定の UI ライブラリ・フレームワークに依存せずにタイピングゲームを作成することができます。

# ブラウザサポート

Windows, Mac, Linux の最新版の主要ブラウザをサポートしています。
Chrome, Edge, Firefox, Safari で動作確認しています。
