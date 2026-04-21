# examples

emiel を使ったサンプル集。pnpm workspace で本体の `emiel` パッケージをローカル参照している。

## サンプル一覧

- cli-test — 非対話の API 動作確認。ハードコードしたキー列を `automaton.input()` に流し、挙動を確認する最小例
- cli-simple — ターミナルで対話的に打鍵できるタイピングデモ（Node 標準機能のみ使用）
- react-simple — 最小の React 版タイピングデモ
- react-backspace — バックスペース対応
- react-keyboardguide — キーボードガイド表示
- react-kanji-annotation — 漢字交じり表示文字列の対応付け
- react-mixed-input-guide — JIS かな + Qwerty JIS 混在入力。候補キーの色付けガイドとミス入力時の赤フラッシュ付き
- react-mixed-layout — レイアウト混在
- react-multi-word — 複数ワードを連続で打つ例
- react-result-record — 打鍵結果の記録
- react-roman-or-kana — Roman / かな入力切替
- react-stroke-graph — ストローク遷移の可視化
- react-typewell — タイプウェル風の複数ワード連続入力。末尾「ん」をスペースで 1 打確定できる

## CLI でのキー取得についての設計メモ

cli-simple を作るにあたり、「ターミナルアプリで `KeyboardEvent` 相当の物理キー情報を取れるか」を検討した。結論と選択の背景を残しておく。

### ターミナルは物理キーを提供しない

ターミナル（PTY）は歴史的に「文字ストリーム」を扱う抽象であり、プロセスに届くのは OS のキーボードレイアウト適用後のバイト列（ASCII または ANSI エスケープシーケンス）である。`ncurses` や `termios` の raw モードでも取得できるのは「文字」または矢印キー等の ESC シーケンスであって、以下は取れない。

- KEYDOWN / KEYUP の区別
- リピートの検出
- 修飾キー単独押下（Shift だけ押した、など）
- 物理キー位置（同じ文字が別キーから入力されたかの区別）

例えば `A` と `Shift+a` は区別できるが、「`A` キーが押された瞬間」と「離された瞬間」は得られない。

### emiel が必要とする情報とのギャップ

emiel は `InputEvent(InputStroke(VirtualKey, "keydown"|"keyup"), KeyboardState, ...)` を前提としており、物理キー粒度の KEYDOWN/KEYUP と修飾キー状態を要求する。ターミナルから得られるのは「文字」のみなので、直接は繋がらない。

### cli-simple の選択: 文字 → VirtualKey への逆変換

起動時に指定したキーボードレイアウトを使い、届いた文字から `KeyboardLayout.getStrokesByChar(char)` で VirtualKey と Shift 有無を逆算し、`InputEvent` を合成して `automaton.input()` に渡す方針を採用した。

この方式には原理的な制約がある。

- Roman ルール限定。Shift 単独・同時押し・先押し修飾を使うルール（Nicola 等）は再現不可
- IME を経由する日本語入力ルール（JisKana 等）は成立しない
- KEYUP は合成できないため、keyup を意味的に必要とするルールには使えない
- 物理キー位置に依存する体験（どの指で打つか等）は OS 側のレイアウト設定と `--layout` 指定が一致している前提で成立する

### 採用しなかった代替手段

- Kitty keyboard protocol — kitty / WezTerm / foot / Ghostty 等が対応しており、エスケープシーケンスで KEYDOWN/KEYUP・修飾キー単独・リピート・物理キー相当の情報が取れる。Terminal.app など非対応ターミナルで動かないため、ポータブルなサンプルとしては不採用
- Windows Console API (`ReadConsoleInput`) — Windows 限定
- Linux evdev (`/dev/input/event*`) — root 権限が必要で、ターミナルアプリではなくキーロガー相当になる

ブラウザの `KeyboardEvent.code` 相当の体験を前提とするサンプル（同時押し、ガイド表示、物理配置可視化など）はブラウザ版 (react-\*) を参照。
