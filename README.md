# これは何？

emiel（エミエル）は超汎用日本語タイピングゲーム用ライブラリです。

以下のような多様な日本語入力方法をサポートしており、React や Vue 等の特定の UI ライブラリ・フレームワークに依存せずにタイピングゲームを簡単に作成することができます。

- 基本：ローマ字、JIS かな
- ローマ字拡張系：AZIK、ACT 等
- ローマ字無拡張系：Dvorak、Colemak、大西配列、Tomisuke 配列等
- 中指シフト系：月配列等
- 同時打鍵系：新下駄配列、薙刀式等
- 親指シフト系：NICOLA、飛鳥カナ配列等

# 使い方

TBD

# 特徴

## シンプルなインターフェース

タイピングゲームで必要となる

## シンプルで柔軟性の高い設定ファイル

Mozc(GoogleIME)のローマ字設定ファイルの仕様をベースにすることで、シンプルで柔軟性の高い設定ファイルを実現しています。一般的な実装ではローマ字入力における「っ」や「ん」に関する入力ルールを、大量に記述するか、あるいはハードコードする必要がありますが、emiel では Mozc 同様にこれらの入力ルールを極めてシンプルに記述することができます。

## pure typescript

依存ライブラリのない、pure な TypeScript で実装されており、React や Vue 等の特定の UI ライブラリ・フレームワークに依存せずにタイピングゲームを作成することができます。

# ブラウザサポート

Windows, Mac, Linux の最新版の主要ブラウザをサポートしています。
Chrome, Edge, Firefox, Safari で動作確認しています。
