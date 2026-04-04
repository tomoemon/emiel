# CLAUDE.md

## Project Overview

emiel - 日本語タイピングゲーム用ライブラリ（純粋TypeScript、外部依存なし）

## Commands

```bash
pnpm install        # 依存関係インストール（全ワークスペース対象）
pnpm run build      # ライブラリビルド（vite build && tsc）
pnpm run test       # テスト（vitest）
pnpm run lint       # リント（oxlint）
pnpm run fmt        # フォーマット（oxfmt）
pnpm run fmt:check  # フォーマットチェック
make publish        # パッケージ公開
```

## Structure

- `/src/core/` - Automaton, Rule, KeyboardLayout 等のコアロジック
- `/src/impl/` - プリセットルール、ローダー、統計
- `/src/assets/` - キーボードレイアウト定義、入力ルール定義
- `/examples/` - React ベースのサンプル（pnpm workspace でローカル emiel を参照）

## Testing

テストは Vitest、ソースと同じディレクトリに `.test.ts` で配置

## Rules

- 会話は日本語で行うこと
- 型定義には `interface` ではなく `type` を使うこと
