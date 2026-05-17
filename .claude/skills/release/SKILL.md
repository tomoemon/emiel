---
name: release
description: リリース用のバージョン bump コミット + PR 作成を一括で行う
argument-hint: "[next-version] (例: 0.5.0)"
---

# Release

emiel のリリース手順 (`CONTRIBUTING.md` の「リリース手順」) に沿って、
`package.json` の version bump → release コミット → push → PR 作成 を一括で行う。

PR がマージされると `.github/workflows/release-tag.yaml` が自動でタグと GitHub release を作成し、
続いて `.github/workflows/npm-publish.yaml` が npm publish を実行する。

## 1. 事前チェック

以下を並列で実行する:

- `gh auth status` で GitHub CLI 認証確認。未認証ならエラーで終了
- `git status` で working tree の状態確認
- 現バージョンを `package.json` から取得:
  ```
  node -p "require('./package.json').version"
  ```
- 最新タグを取得 (参考情報): `git describe --tags --abbrev=0 2>/dev/null || echo none`
- main との差分から `feat` / `fix` / `!` を含むコミットの有無を確認:
  ```
  git log --oneline origin/main..main 2>/dev/null || git log --oneline v<current>..main 2>/dev/null
  ```

## 2. 次バージョンの決定

- `$ARGUMENTS` が指定されていればそれを次バージョンとして使う (例: `0.5.0`)
- 指定がなければ、現バージョンを提示して AskUserQuestion で確認する:
  - patch bump (0.x.Y → 0.x.Y+1)
  - minor bump (0.X.y → 0.X+1.0)
  - major bump (X.y.z → X+1.0.0) ※ 0.x 系でも破壊的変更時は任意選択可
  - 直接入力 (その他)

選択肢の根拠として、 main に溜まっているコミットのうち `feat`/`fix`/`!` の内訳を示す。

## 3. ブランチ作成

ブランチ名は `chore/release-v<version>` とする (例: `chore/release-v0.5.0`)。

- main ブランチにいる場合: そのままブランチを作成してチェックアウト
- main 以外のブランチにいる場合: AskUserQuestion で確認する:
  - 現在のブランチで続行する
  - main に切り替えてから `chore/release-v<version>` を作成する

後者を選んだ場合、 working tree に未コミットの変更があれば先にユーザへ通知して中断する
(stash / commit の判断はユーザに委ねる)。

## 4. package.json の version 更新

- `Edit` で `package.json` の `"version": "<old>"` を `"version": "<new>"` に書き換える
- それ以外のファイルは変更しない (README などは別 PR で扱う)

## 5. コミット

- `git add package.json` (個別指定、 `-A` は禁止)
- コミットメッセージは以下 (HEREDOC で渡す):
  ```
  chore: release v<version>

  Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
  ```

## 6. プッシュ

```
git push -u origin chore/release-v<version>
```

## 7. PR 作成

`gh pr create` で PR を作成する。タイトルは `chore: release v<version>`。

body は HEREDOC で渡す。以下を含める:

```
## Summary

v<version> リリース準備。 `package.json` の version を <old> → <new> に bump。

## 変更内容 (v<current> 以降)

- main に溜まっている feat / fix / breaking-change のコミットを箇条書きで列挙
  (`git log v<current>..main --oneline` の出力から抽出)
  - 破壊的変更 (`!` 付き) は先頭に明示
  - feat → 機能追加
  - fix → バグ修正
  - それ以外 (refactor / docs / test / chore) は重要なもののみ

## リリースフロー

マージ後、以下が自動で走る:

1. `release-tag` workflow がタグ `v<version>` を作成し GitHub release を生成
2. `release` workflow が GitHub release の publish を検知して npm publish を実行

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 8. 完了

作成された PR の URL をユーザに報告する。マージ後はタグ作成 / GitHub release / npm publish が自動で進む旨も伝える。
