# ローカルでの examples の動作確認

pnpm workspace を使って、examples 側からローカルの emiel を参照しています。
各 examples の `package.json` では `"emiel": "workspace:*"` と指定されており、ルートの emiel パッケージが自動的にリンクされます。

```
# ルートで依存関係をインストール（全ワークスペースが対象）
pnpm install

# emiel をビルド（examples から参照される dist/ が生成される）
pnpm run build

# examples の開発サーバーを起動
cd examples/react-simple
pnpm dev
```

emiel 側のコードを変更した場合は `pnpm run build` で再ビルドすると examples 側に反映されます。

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
