# react-mixed-layout

かなと英字で異なるキーボードレイアウトを使う混在構成のサンプル。

- かな（ローマ字入力）: Qwerty JIS 配列
- 英字・記号（直接入力）: Dvorak 配列

## 仕組み

emiel の preset は「素の Rule」のみを返すので、consumer が `createDirectInputRule(layout)` を `compose` するだけで混在構成が作れる。

```ts
const rule = loadPresetRuleRoman(kanaLayout).compose(createDirectInputRule(alphaLayout));
```

- `loadPresetRuleRoman(kanaLayout)` — ローマ字 → かな変換 Rule。`kanaLayout` はローマ字 tsv の文字を物理キーに解決するために使う
- `createDirectInputRule(alphaLayout)` — layout の文字マッピングをそのまま 1 ストロークで入力する Rule。英字・数字・記号・JIS の `¥` 等を物理キーに解決するのにこちらの layout を使う
- `compose` で 2 つの Rule を連結

この構成により、`おをひく` は Qwerty JIS ローマ字、`apple` は Dvorak 物理配置、`docomoとau` は混在、で入力できる。
