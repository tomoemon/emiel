# ローカルでの examples の動作確認

pnpm の link 機能を使って、examples 側からローカルの emiel を参照します。
※examples 内のコードはあくまでもそれぞれが独立したプロジェクトであるという前提で書かれています。

https://pnpm.io/ja/cli/link

emiel のルートディレクトリで以下のコマンドを実行します。

```
pnpm link --global
```

次に、各 examples のディレクトリで以下のコマンドを実行します。

```
cd examples/react-simple
pnpm link --global emiel
```

これで react-simple が参照する emiel パッケージはローカルにあるプロジェクトになります。
vite は事前に依存パッケージの最適化等を行っているため、誤って npm の emiel をインストールしてしまったりすると、npm 側の emiel のコードがずっと使われてしまうことがあります。link を変更してもうまく動かなくない場合は、以下のコマンドでリセットできます。

```
pnpm exec vite optimize --force
```
