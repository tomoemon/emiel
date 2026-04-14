# cli-simple

ターミナルで実際にキーを叩いて遊べる、対話型のタイピングデモ。

Node 標準の `readline` + `tty.setRawMode` のみを使用し、外部依存は emiel のみ。

## 動かし方

Node.js 22.6 以降が必要（TypeScript を直接実行するため。Node 22.6〜23.5 は `--experimental-strip-types` フラグ付きで実行）。

```
pnpm install
node index.ts                   # デフォルト: JIS106 配列
node index.ts --layout us       # QWERTY US 配列として解釈
node index.ts --help            # 利用可能なレイアウト一覧
```

Ctrl+C または Esc で終了。

## 対応レイアウト

`jis`（デフォルト）, `us`

## 仕組み

ターミナルは物理キー KEYDOWN/KEYUP を提供せず、OS のキーボードレイアウト適用後の「文字」しか届けてくれない。そのためこのサンプルでは

1. ターミナルを raw モードにして文字を受け取る
2. 指定レイアウトの `KeyboardLayout.getStrokesByChar(char)` で「文字 → VirtualKey + Shift 有無」に逆変換する
3. その結果から `InputEvent` を合成して `automaton.input()` に渡す

という手順で emiel を駆動している。OS 側のキーボードレイアウト設定と `--layout` を合わせる必要がある。

## 制約

- Roman ルール限定。Shift 単独押下・同時押し・先押し修飾を必要とするルール（Nicola、Naginatashiki 等）はターミナルからの情報では再現できない
- IME を経由する日本語入力ルール（JisKana 等）は成立しない
- KEYUP は実際には発生せず、`keydown` のみを合成している
- 詳しい背景と代替手段は `../README.md` 参照
