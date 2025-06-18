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

# 参考資料

Microsoft キーボード入力の概要（真ん中以下にスキャンコード表がある）
https://learn.microsoft.com/ja-jp/windows/win32/inputdev/about-keyboard-input

W3C Writing System Keys（キーの名前）
https://www.w3.org/TR/uievents-code/#key-alphanumeric-writing-system

Windows のキーボードレイアウト一覧
http://kbdlayout.info/

USB キーボードと PS/2 キーボードの違い
https://ascii.jp/elem/000/004/031/4031629/

ブラウザのキーボードイベントの詳細確認ツール
https://www.toptal.com/developers/keycode

Keyboard Event Viewer(IME の状態による違いも確認できる)
https://w3c.github.io/uievents/tools/key-event-viewer.html

OS・ブラウザ別の code 一覧
https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values

USB HID Usage ID の Scancode 変換と対応するキー
https://bsakatu.net/doc/usb-hid-to-scancode/

USB HID Usage Tables ver.1.5
https://www.usb.org/document-library/hid-usage-tables-15
