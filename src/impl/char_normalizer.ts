// 必ず1文字対1文字になるようにする
const kanaNormalizeBaseMap = {
  あ: "ア",
  い: "イ",
  う: "ウ",
  え: "エ",
  お: "オ",
  か: "カ",
  き: "キ",
  く: "ク",
  け: "ケ",
  こ: "コ",
  さ: "サ",
  し: "シ",
  す: "ス",
  せ: "セ",
  そ: "ソ",
  た: "タ",
  ち: "チ",
  つ: "ツ",
  て: "テ",
  と: "ト",
  な: "ナ",
  に: "ニ",
  ぬ: "ヌ",
  ね: "ネ",
  の: "ノ",
  は: "ハ",
  ひ: "ヒ",
  ふ: "フ",
  へ: "ヘ",
  ほ: "ホ",
  ま: "マ",
  み: "ミ",
  む: "ム",
  め: "メ",
  も: "モ",
  や: "ヤ",
  ゆ: "ユ",
  よ: "ヨ",
  ら: "ラ",
  り: "リ",
  る: "ル",
  れ: "レ",
  ろ: "ロ",
  わ: "ワ",
  ゐ: "ヰ",
  ゑ: "ヱ",
  を: "ヲ",
  ん: "ン",
  が: "ガ",
  ぎ: "ギ",
  ぐ: "グ",
  げ: "ゲ",
  ご: "ゴ",
  ざ: "ザ",
  じ: "ジ",
  ず: "ズ",
  ぜ: "ゼ",
  ぞ: "ゾ",
  だ: "ダ",
  ぢ: "ヂ",
  づ: "ヅ",
  で: "デ",
  ど: "ド",
  ば: "バ",
  び: "ビ",
  ぶ: "ブ",
  べ: "ベ",
  ぼ: "ボ",
  ぱ: "パ",
  ぴ: "ピ",
  ぷ: "プ",
  ぺ: "ペ",
  ぽ: "ポ",
  ゔ: "ヴ",
  ぁ: "ァ",
  ぃ: "ィ",
  ぅ: "ゥ",
  ぇ: "ェ",
  ぉ: "ォ",
  っ: "ッ",
  ゃ: "ャ",
  ゅ: "ュ",
  ょ: "ョ",
  ー: "-",
};

const alphaNumericNormalizeBaseMap = {
  Ａ: "A",
  Ｂ: "B",
  Ｃ: "C",
  Ｄ: "D",
  Ｅ: "E",
  Ｆ: "F",
  Ｇ: "G",
  Ｈ: "H",
  Ｉ: "I",
  Ｊ: "J",
  Ｋ: "K",
  Ｌ: "L",
  Ｍ: "M",
  Ｎ: "N",
  Ｏ: "O",
  Ｐ: "P",
  Ｑ: "Q",
  Ｒ: "R",
  Ｓ: "S",
  Ｔ: "T",
  Ｕ: "U",
  Ｖ: "V",
  Ｗ: "W",
  Ｘ: "X",
  Ｙ: "Y",
  Ｚ: "Z",
  ａ: "a",
  ｂ: "b",
  ｃ: "c",
  ｄ: "d",
  ｅ: "e",
  ｆ: "f",
  ｇ: "g",
  ｈ: "h",
  ｉ: "i",
  ｊ: "j",
  ｋ: "k",
  ｌ: "l",
  ｍ: "m",
  ｎ: "n",
  ｏ: "o",
  ｐ: "p",
  ｑ: "q",
  ｒ: "r",
  ｓ: "s",
  ｔ: "t",
  ｕ: "u",
  ｖ: "v",
  ｗ: "w",
  ｘ: "x",
  ｙ: "y",
  ｚ: "z",
  "１": "1",
  "２": "2",
  "３": "3",
  "４": "4",
  "５": "5",
  "６": "6",
  "７": "7",
  "８": "8",
  "９": "9",
  "０": "0",
  "！": "!",
  "”": '"',
  "“": '"',
  "＃": "#",
  "＄": "$",
  "％": "%",
  "＆": "&",
  "’": "'",
  "‘": "'",
  "（": "(",
  "）": ")",
  "‐": "-",
  "―": "-",
  "−": "-",
  "＝": "=",
  "〜": "~",
  "￥": "\\",
  "｜": "|",
  "∥": "|",
  "❘": "|",
  "‖": "|",
  "❙": "|",
  "❚": "|",
  丨: "|",
  "￤": "|",
  "＼": "\\",
  "＠": "@",
  "｀": "`",
  "「": "[",
  "｛": "{",
  "【": "[",
  "『": "[",
  "［": "[",
  "；": ";",
  "＋": "+",
  "：": ":",
  "＊": "*",
  "」": "]",
  "】": "]",
  "』": "]",
  "｝": "}",
  "、": ",",
  "，": ",",
  "＜": "<",
  "〈": "<",
  "。": ".",
  "．": ".",
  "＞": ">",
  "〉": ">",
  "・": "/",
  "／": "/",
  "？": "?",
  "＿": "_",
  "　": " ",
};

const kanaNormalizeMap = Object.assign(
  {},
  kanaNormalizeBaseMap,
  Object.fromEntries(Object.values(kanaNormalizeBaseMap).map((v) => [v, v]))
);

const alphaNumericNormalizeMap = Object.assign(
  {},
  alphaNumericNormalizeBaseMap,
  Object.fromEntries(
    Object.values(alphaNumericNormalizeBaseMap).map((v) => [v, v])
  )
);

export function defaultKanaNormalize(value: string): string {
  return Array.from(value)
    .map((c) => {
      if (!(c in kanaNormalizeMap)) {
        return c;
      }
      return kanaNormalizeMap[c];
    })
    .join("");
}

export function defaultAlphaNumericNormalize(value: string): string {
  return Array.from(value)
    .map((c) => {
      if (!(c in alphaNumericNormalizeMap)) {
        return c;
      }
      return alphaNumericNormalizeMap[c];
    })
    .join("");
}
