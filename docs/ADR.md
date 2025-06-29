# なぜ GoogleIME(Mozc) のローマ字設定仕様をもとにしたのか

ローマ字入力を実現する上で、取りうる選択肢は主に 2 つ。入力ルールをハードコードするか、すべて展開したパターンとして持つか。入力ルールをハードコードすると細かい調整が効かせやすくなる一方で、入力ルールが完全に固定化されてしまい、他の入力配列への流用が難しい。
一方で、展開したパターンとしてルールを持つことで、「ん」や「っ」に関する特殊な処理を実装しなくて済むため、入力時の状態遷移処理がシンプルになる。しかし、展開したパターン数は膨大になり、結局そのパターン生成をプログラムで行うことになるため、つまるところ入力ルールを展開プログラム側に持つのとほぼ同義になり、誰でも簡単に配列を自作するにはほど遠い。

GoogleIME(Mozc)のローマ字入力設定には次の 2 つの特徴があり、これによって入力ルールを人が理解できる範囲でシンプルに表現でき、かつより柔軟な入力ルールを実現できる。

1 つが「次の入力」で、ある入力エントリの「入力」が完了すると同時に、「出力」を表示しつつ、追加で入力が発生したことにしてくれる。「tt/っ/t」というのは標準のローマ字入力で唯一「次の入力」が使われている例だが、これと「ta/た」を組み合わせることで、「tta/った」のような入力ルールを実現できる。

事前展開する場合は、「たちつてと」それぞれに「っ」と組み合わせたパターンを用意する必要があったが、「tt/っ/t」があれば、1 ＋ 5 パターンで済む。た行だけでなく、他の行にも応用できるため、入力ルールの記述量が大幅に削減できる。

2 つ目が「共通プレフィクスルール」で、これは公式に名前がついているわけではないため、個人的に勝手に呼んでいるだけだが、「n/ん」という入力エントリで使われている。「na/な」「ni/に」というルールがあるため、n 1 打鍵では「ん」は確定しないが、2 打鍵めに k 等の入力ルールで使われていない入力が入ると「ん」が確定するというルールである。

このパターンも事前展開しようとすると膨大な数を展開しないといけないが、GoogleIME ではたった一つの入力エントリで表現できる。

これら 2 つの特徴により、配列を自作する側は入力ルールを極めてシンプルに記述できるようになっている。タイピングゲームがサポートする入力ルールについても、できるだけ多くの人が簡単に配列を自作して試せるようにするなら、GoogleIME の設定ルールをベースにするのが良いと考えた。

# 「打鍵」をどのようにコード上で表現するか問題

少なくともブラウザで取得できる「打鍵」の表現は、OS のキーボードレイアウトを考慮して入力された「文字」か、キーコード（ここではスキャンコードを元にして決まるブラウザ上の定数）のどちらにするかという選択肢がある。

ローマ字入力や、英字入力だけを考えると、入力された「文字」をそのまま扱うのはとても自然で取り回しのしやすい方法である。特に OS 上で、DVORAK や QWERTZ といったキーボードレイアウトを設定している場合、それが考慮された「文字」を直接取得できるのが利点。

一方で、かな入力のことを考えると、Qwerty+JIS において、Shift + 0 を入力したときに「文字」が取得できない問題があり、これを扱おうとするとキーコードを扱わなければならない。

上記のような問題をいろいろと考えた結果、まずは「打鍵」の表現は型パラメータとして変更可能なものにするという選択肢を取ることで先に進むことにした。最終的には「equals」メソッドを実装している型であればなんでも良い、ということになったが、いったん型パラメータとして決定を先送りすることで、その他の実装を先に進めることにした。

最終的には、「ローマ字入力だけでなく、かな入力も同様の抽象度で扱いたい」という目的を達成するためにキーコードを具体的な打鍵表現とすることに決めた。OS によるキーボードレイアウトによっては、意図しないキーが入力されてしまうことになる問題に関しては、そもそも日本語タイピングをするユーザについては大多数が Qwerty であることから問題にならないであろうこと。さらに、Dvorak 等のユーザに関しても Chrome 系のブラウザの機能を使って、OS のキーボードレイアウトを判定することで解決することにした。（未対応のブラウザに関しては全員 Qwerty 扱いにする）

また、具体型が VirtualKey 型に決まった後も、「打鍵」表現が満たすべき条件が明確になるため、型パラメータとして扱う方針は継続する。

# 「打鍵」をどのようにコード上で表現するか問題（続）

ある程度 emiel が形になったあとで、あらためて考え直すと、結局「打鍵」を VirtualKey として扱う以外に方法がないことから、抽象化するだけのメリットがあまりないのではないかと思うようになった。
逆に、抽象化した結果、すべてのキーは object になって比較コストが上がり、かつ VirtualKey を扱うすべての関数は型パラメータを持たなければならなくなり、コードの複雑さや見通しの悪さが増すだけである。

最終的に VirtualKey はすべてのシンプルな文字列として扱うことにする。

VirtualKey を Number で扱ったほうがよりパフォーマンス改善につながる事も考えたが、VirtualKey は文字列として扱うことで、デバッグ時にも見やすくなるというメリットがあるため、文字列として扱うことにした。

# StrokeNode の実装

当初の実装では Kana 1 文字に対応する Node とそれをつなぐ Edge で構成されていた。
今の実装で言う KanaGraph(KanaNode+KanaEdge) がそれに相当する。
しかし、KanaGraph をもとにした状態遷移を行おうとすると、特定のある時点で複数の遷移先があるということが起こりうる。
例えば

「しょう」というかなを入力する際に下のような Node と Edge が構成される。
s という打鍵をした瞬間に si, shi, syo, sho の Edge がすべてアクティブになり、次の打鍵時にはそれらすべての Edge の遷移が可能かどうかチェックしなければならず、Automaton 側が複雑になる。

```
し 　     ょ        う      END
|-- si --|
|-- shi -|
|------- syo -----|
|------- sho ------|
                   |-- u --|
```

さらに、ある時点で残りの打鍵列を表示しようとしたときに、残りの打鍵列をどのように決定し、表示するかという問題もある。もっともシンプルなのは最短経路を表示することだが、KanaGraph だと事前に各状態に最短経路を計算して管理することができず、動的な計算が必要になってしまう。

そこで、KanaGraph をもとにして、Stroke 単位の StrokeNode と StrokeEdge で構成された StrokeGraph を作成することで、これらの問題を解決することにした。
以下のように、1Stroke 単位で Node が移り変わっていく。

```
[何も打ってないNode] - [sで遷移するEdge] - [sを打ったNode]
```

「しょう」を StrokeGraph にすると以下のようになる。

```
し              ょ              う
| - s - i ----->| - l - y - o ->| - u ->|
    +-- h + i ->| - xyo ------->|
    |     +-------- o --------->|
    +-- y --------- o --------->|
```

ある KanaNode から遷移可能な Edge の input の共通プレフィックス部分に関しては共通の StrokeNode を使い回しているが、StrokeGraph はすべての共通する StrokeNode を省略するわけではない。
ある StrokeNode からある打鍵をしたときに遷移する候補が最大でも 1 になるということだけを保証している。
例えば「し」を打とうとしているとき、si, shi, syo という遷移が可能で、s は共通の StrokeNode だが、それ以降は次の KanaNode に行くまで独立した経路を取る。sily まで打った後の残りの経路と、sy まで打った後の残りの経路はそれぞれ ou しか残ってないが、上記の理由から今の実装ではその経路の共通化は行なっていない。

# KanaGraph における「次の入力」の扱い

次のような配列定義があるときに、「った」を打つために「tt, ta」のエントリが結合されることになる。

```
a/あ
ltu/っ
ta/た
tt/っ/t
```

KanaGraph では以下のように表現できる。

```
あ        っ          た
| -- a -->| -- ltu -->|
+------- tta -------->|
```

つまり、あたかも以下のようなルールとして扱うことができる。

```
a/あ
ltu/っ
ta/た
tta/った
```

しかし、現状の実装ではこのようにしておらず、以下のように複数のエントリを繋げた表現にしている。

```
あ        っ          た
| -- a -->| -- ltu -->|
+----- tt, ta ------->|
```

これによるメリットは、入力しているかなの状態をより正確に表現できることである。

```
tta/った
```

というルールにしてしまうと、tta の 3 打鍵がすべて完了するまで「った」のかなを打ち終わったことにならない。しかし、`tt/っ/t` と `ta/た` の 2 つのエントリのまま扱うことで、tt を打ち終わった時点で、「っ」の入力は完了したことを表現できる。

同様の例は「ん」に関する扱いにも出てくる。`n/ん` に関しては共通プレフィックス展開があるため、通常 n 1 打鍵で入力することはできず、`nka/んか` のように、展開可能なパターンのときのみ入力できる。
しかし、このとき nka 3 打鍵打ち終わった瞬間に一気に「んか」が確定したことになると、一般的な IME の入力と異なって気持ち悪い。nk の 2 打鍵を打った時点で「ん」は確定しているので、タイピングゲームにおいても「ん」の分は打ち終わったことにしたい。

このような理由から、現状の実装では、KanaGraph において「次の入力」を結合した 1 つのエントリとして扱わずに、複数のエントリをそのまま使う表現にしている。

# 最短経路の計算

StrokeGraph を構成することで、よりシンプルな非巡回有向グラフになった。
ユーザの入力に応じて、「その時点」での最短経路を常に表示するようにしたい。
当初、事前に「先頭ノードから終端ノードまでの最短経路」を計算しようとしたが、それだと、途中で脇道にそれると最短経路から外れてしまい、再計算が必要になってしまうことになる。
そこで、「経路」そのものを事前に計算するのではなく、各ノードの終端ノードまでの距離（コスト）を計算しておき、それぞれのノードにそのコストを割り当てておくことで、あるノードにいるときに、次にどのノードに向かえば最短経路かどうかが即座にわかるようになる。

実装上は、さらに一歩進めて、ある Kana を指すノードから遷移可能な Edge を「その先のノードのコスト」で事前にソートしておき、常に 0 番目の Edge に遷移することで最短経路になるようにしている。

# Modifier の扱い

「KeyA:a」「Shift+KeyA:A」のように、入力ルールの表現として、Modifier が必要か否かという観点で最初実装していた。
「A を入力するときは Shift が押下されている必要がある」、という感じである。
ところが、実際は「a を入力する時は Shift が押されていないことが必要」という考慮も必要になる。

そこで、Modifier に関しては「押下されていることが必要」なものと、かつ「押下されていないことが必要」なものという観点で実装し直した。

これにより、例えば、Modifier の概念が異なるルールのマージも可能になった。
英数字用の入力ルールは基本的にどれも共通であるため、各種かな入力でわざわざ定義し直す必要がないように、後から別途ルールをマージしたい。ところが、英数入力に関しては Shift が Modifier であり、一方のかな入力では例えば「無変換」や「変換」が Modifier になりうる。さらに、「F」や「J」といったキーが Modifier になることもありえる。

そういったときに、それぞれの入力ルールにおける、「必要な Modifier」「不要な Modifier」を定義しておくことで、ルールをマージしたときにも、それぞれの入力ルールにおける Modifier の概念が保持できるようになった。

# ローマ字入力の共通プレフィックス展開とかな入力の共通プレフィックス展開

ローマ字入力において、共通プレフィックス展開を行う例：

- n/ん
- na/な
- ni/に
- ka/か

n/ん を展開して n/ん/k が新しく作られる。
「んか」という文章を打つ際にのみ nka で入力できるようになる。

JIS かな入力において、共通プレフィックス展開を "行わない" 例：

- 2/ふ
- 2@/ぶ
- t/か

という入力ルールがあるとき、ローマ字入力と同様のロジックで処理を行うと、
2t/ふか のときのみ「ふ」を 2 で入力できるようになるが、これは本来意図したものではない。
このため、かな入力においては、共通プレフィックス展開を行わないことにした。
（配列定義ファイルにおいて、共通プレフィックス展開を行うかどうかを設定できるようにした）

ちなみに、JIS かな入力に関しては

- 2/ふ
- @/゛
- t/か

のようなルールを許容して、「2@/ぶ」を打つことができるようにするのであれば共通プレフィックス展開は不要になるが、今度はオートマトン生成時に濁点との合成や分解を行う必要が出てくるため、別の箇所が複雑化するので、今のところは検討しない。

# ルールの矛盾チェック

入力すべきキーと modifier が共通であるけれども、入力すべきでない modifier が異なる場合、あるノードからの遷移が一意に定まらない場合がありえる。

inputKey: su
modifier: []
output: す
noModifier: [shift]

inputKey: su
modifier: []
output: す
noModifier: [shift, 無変換]
（無変換を modifier として使う何らかのかな入力ルール）

こういう入力ルールが存在するかどうかを事前にチェックして、存在する場合はエラーを出すようにした。

# 配列ごとにカバーしている文字集合が異なる問題にどう対処するか

JIS かな入力の配列と、ローマ字入力の配列では、配列定義の Output でカバーしている文字集合が異なる。
例えば、lwa/ゎ（小文字のわ）をローマ字入力で打つことができるが、かな入力では打つことができない。

「こんにちゎ」
という文章が与えられた時にどのような挙動にするのが正解か？
ローマ字入力ではオートマトンを生成することができるが、かな入力ではそのままでは生成できない。

かな入力ルールに対して上記のような文章が与えられたときはエラーにする。
ただし、できればお題となる文章作成時にそういったパターンを検知できると嬉しいので、デフォルトで用意してある配列については、そのようなパターンが存在するかどうかを簡単にチェックできるようにしておきたい。

# json config の数字キーがわざわざ Digit1 のような表記にする理由

本来は 1, 2, 3, ... だけで良いのだが、それだとダブルクオートを忘れたときに、json 上 number 型になってしまうのが嫌。そこを回避するようなコードを書くことも可能だが、Digit1 を 1 にしたところで大して楽さは変わらないので、そのままで行く。

# キーの座標表現

今のところこれが一番ソースとして信頼できそうなので、これを元に VirtualKey を設計している
https://www.w3.org/TR/uievents-code/#key-alphanumeric-writing-system

# どこまで高機能な Automaton を標準で用意すべきか

かな文だけでなく、漢字かな交じり文も合わせて状態遷移しながら表示を切り替えるタイプウェル風なものを実現するための MixedTextAutomaton や、ミスしたときに Backspace で消さなければ先に進めない BackspaceAutomaton を用意していたが、これらはタイピングゲームとしては一般に必要な機能ではなく、かつそれぞれのユースケースで実装が変わりうるものであるため標準で用意する必要はないと判断して消した。実装例として examples に残すのみとする。

# キーボードガイドの物理キー配置をどこまで考慮するか

US 配列と言っても下記のページに掲載されているように、Mac と HHKB で大きく異なる配置になる。
https://www.wasabito.com/hhkb-us-vs-macbookair-us/

これ以外にも様々な物理キー配置が存在する。
https://w3c.github.io/uievents-code/

これらの物理キー配置まで考慮してキーボードガイドを作成するのは非常に大変であり、かつ、ユーザが自分のキーボードに合わせてガイドを選択するのも大変なため、物理キー配置は 106/109 キーボード前提で考える。

# データ管理

キーボード配列やガイドデータは数百、数千件という規模になる可能性があり、そのすべてを npm package に同梱しておくのは現実的ではない。外部のストレージに保存して、CDN 経由で実行時に取得するのが良さそう。
理想的には誰でも自由に自分専用のキーボード配列を作成して使い、かつ、それを共有できるようにしたい。

layout (qwerty-jis, qwerty-us, dvorak 等)
rule (kana, romaji, nicola 等)

layout

- ID STRING
- NAME STRING
- Body JSON

# VirtualKey

Lang1, Lang2 という名称がわかりづらいので、LangRight, LangLeft に変更

# JSON rule フォーマット

主に親指シフト系列のキーボード配列を定義する際に、親指シフトのキーを変数として扱うことができるようにすることを考えていたが、仕様が複雑化するのでいったんなしにする。

json 上では親指シフトキーを変数として受け取れるようにしておけるようにした場合、入力ルールの各エントリが変数として記述されている状態と、実際の値が定まった状態の 2 つが存在する。ユーザが自由に配列を登録したり変更したりする UI を考えたときに、この変数と実際の値の関係の見せ方が難しい。
aliasKey という仕様もあったが、これも同様の理由でなしにする。

modifierGroup に関しても、入力ルールのエントリ内で使わない場合でも、Shift 等の定義をいちいち記載しておく必要があったが（ここに定義している modifier の中で、各エントリで使われない modifier が unnecesaryModifier の扱いになり、押してはいけない修飾キーになる）、Shift, Control, Alt(Meta) は基本的に modifier として扱って問題ないと思われるため、デフォルトで定義された状態にする。追加で modifierGroup を定義したい場合のみ、json に記載させる。
→ と考えていたが、暗黙的なルールはできるだけない方が後から理解しやすいので、明示する形式に変更する。また、グループに名前をつけて管理する方法も多少 easy にするだけで、仕様の複雑化につながるので、なしにする。

# Keyboard Layout の概念の整理

202502 現在の KeyboardLayout はキーコードから英数記号文字への対応表を意味している
これとは別で、キーコード自体を入れ替えるような、キーコード to キーコードの対応表も考えられる

後者を KeyMap として、emiel.activate 時に渡す
eventHandler でブラウザから渡されるキーコードを内部のキーコードに変換しているが、そこからさらに KeyMap を使って変換するようにする。ブラウザから渡されるキーコードから直接変換するものを KeyMap とすることも考えられるが、OS やブラウザの違いによって同じ位置にあるキーでも異なるキーコードが渡されることがあるため、最初にまず emiel 用のキーコードに変換した方が KeyMap が扱いやすくなると考えた。

用途としては、例えば backspace キーや space キー、shift キー等も含めたキーの入れ替えを行う配列で使えそう。

また、前者の名前を KeyCharMap とするような案はあるが、
OS のキーボード設定等は KeyboardLayout という名前なので、それに対応する概念として、名前は維持する

# 20250214 薙刀式同時押し問題

KEYDOWN のみで入力判定することで、同時押しの問題が発生する。

「じょ」を打つべきときに
「R+J+I」を打つと「じょ」になるが、
「R+J」だけで打つと「じ」になるため、
R↓J↓I↓J↑R↑I↑ という順序で打つと最初の R+J の時点で「じ」の入力が確定してしまい、その後に I を打つと、「じじょ」になってしまうため、ミス扱いになる。

また、「しる」を打つべきときに
R,I の順番で打つ必要があるが、このとき
R↓R↑I↓I↑ なら問題ないが、
R↓I↓ と両方が押下されている状態になると「しょ」になるため、本来はミス扱いになるべき。現在は KEYDOWN のみで判定しているため、R↓ になった時点で「し」が確定してしまい、R↓I↓ という状態になると、「ししょ」になってしまうため、ミス扱いになる。

NICOLA でも J キー単独入力で「と」、J+親指右シフト入力で「お」が入力できるが、「お」を入力すべきシーンで J キー単独の KEYDOWN→KEYUP すると本来は「と」のミス入力が確定するはずだが、現状は KEYDOWN のみで判定しようとするため、J キーはあくまで modifier キー扱いで単独 KEYUP しても無視されるため、ミス入力が確定しない。

これらの問題の対策として、KEYUP イベントも考慮する必要がある。

例えば次のような処理方法が考えられる
「お」を入力すべきシーン（正解は J+親指右）

1. J keydown：J は modifier 専用キーではなく、かつ「J+親指右」の modifier になれるため仮入力状態としておく（いずれのエッジの modifier にもなれない場合は即時ミス入力確定）
2. a,b,c のいずれかに遷移する
   a. J keyup：仮入力状態の J が確定してミス入力になる
   b. 親指右 keydown：J が modifier として使われているため、親指右との同時押しで「お」が確定する、J の仮入力状態を消す
   c. 別のキー keydown：modifier キー以外の場合はミス入力確定する、J の仮入力状態を消す

薙刀式の場合、

「じょ」を打つべきときに

R keydown：R は modifier 専用キーではなく、かつ「J+R」「J+R+I」の modifier になれるため、仮入力状態としておく

J keydown：J は modifier 専用キーではなく、かつ「J+R+I」の modifier になれるため、「J+R」は遷移可能なので、仮入力状態（仮入力エッジ）としておく

- J or R keyup：仮入力エッジ（R+J）が確定する（「じ」が確定する）
- I keydown：「R+J+I」が他のエッジの modifier にはならないため、「R+J+I」が確定する（「じょ」が確定する）、仮入力状態を解除

# 20250219 Rule.modifiers の扱い

json rule の中で下記のように modifiers を定義していたが、これは Shift キー単体で入力したときにミス扱いしないようにすることが目的だった。modifiers キーを単独で押下すると ignored になる。それ以外のキーを押下するとすべてミス扱いにしていた。
また、同時に modifiers キーで定義されているキーは、それが必要とされているとき以外は押してはいけないキーという扱いにしていた。

```
{
  "modifiers": ["ShiftLeft", "ShiftRight"],
}
```

このときに発生する問題。
例えば J 単独で「あ」を入力できるとする。
J+K で「か」、J+S で「さ」を入力できるとする。
S 単独では「ざ」を入力できるとする。

薙刀式の対応で「か」を入力する場面で、J を keydown(staged) → keyup(miss) でミス入力確定する仕様になった（以前は「か」の入力時に J は modifier 扱いだったのでミス扱いにならなかった）。

J は Rule.modifiers に含まれていないため、「ざ」を入力する場面で J+S を入力しても成功する。「ざ」を入力するとき、J は「不要な modifier」ではないため、J+S でも「ざ」が入力された扱いになってしまう。
ただし、IME では J+S を入力した時点で「さ」になるはずなので、タイピングゲームにおいてもミス入力にならなければならない。

とはいえ、余計なキーを押下されている状態をすべてミスにしてしまうと、ロールオーバー入力が成立しなくなる。例えばローマ字入力で「しょ」を入力する場面で、S↓H↓O↓S↑H↑O↑ のように同時押下状態になっていたとしても、「しょ」になるべきである。

すなわち、KEYDOWN した時点でミス入力にする判定基準としては、その同時押し状態を許容する ENTRY が 1 つ以上存在するかどうかになる。ローマ字入力において、S+H も S+H+O の同時押しも存在しないのでロールオーバーは問題ない。

先程の例で言えば、J+S には「さ」という ENTRY が存在するため、「ざ」を入力すべき場面で J を押下した状態で S を押下するとミス入力になるべきである。

薙刀式で言えば、Space キーは SandS として定義されているため、Space キー単独で入力することができる。（余計な場面で Space の単独押下をしたらミスにするべき＝ modifier 扱いしない方が良い）、一方で、Space をシフトとして別のキー入力ができるため、本来は余計な Space を押した状態で正解キーを押すとやはりミスになるべきである。

これについても、Space は modifier として扱わずに、Space+任意のキーの ENTRY が存在するかどうかで判定することで回避できそう。

このように、何らかのキーと同時押ししたときに、その同時押し状態を受け付ける別の ENTRY が存在するときにのみミス入力扱いとするような仕様に変更するのが良さそう。

この仕様に則った場合、ローマ字入力における Shift 単独入力や、NICOLA における親指 Shift キーの単独入力も ENTRY として定義されていないため、これらのキーを単独で押下した場合はミス入力にならない。

結果として、Rule.modifiers のキーを特別扱いする必要もなくなり、Rule.modifiers という定義そのものが不要になるはず。

# 20250617 Automaton クラスのリファクタリング

## 背景

Automaton クラスに getter 系の関数が集中し、クラスが肥大化していた。また、ユーザーが独自の統計関数や参照系関数を追加したい場合に対応できなかった。

## 決定事項

- Automaton の内部状態を `AutomatonState` インターフェースとして分離
- getter 系関数を `automatonGetters.ts` にグローバル関数として分離
- 動的な機能拡張のための `with()` メソッドを実装

## 実装詳細

### 拡張メカニズム

```typescript
// 拡張の定義
const statsExtension = {
  getKPM: (state: AutomatonState) => {
    /* ... */
  },
  getAccuracy: (state: AutomatonState) => {
    /* ... */
  },
};

// 使用方法
const automaton = rule.build("こんにちは");
const extended = automaton.with(statsExtension);
console.log(extended.getKPM()); // 型安全に拡張メソッドを使用
```

### Proxy を使用した理由

- 拡張メソッドが常に最新の Automaton の状態を参照できる
- メモリ効率が良い（新しいオブジェクトを作成しない）
- 型安全性を保ちながら動的に機能を追加できる

### デフォルト拡張

`rule.build()` はデフォルトで基本的な getter を含む `defaultExtension` を適用する。これにより、既存のコードとの後方互換性を維持。

## 結果

- Automaton クラスの責務が明確になった（状態管理と入力処理に特化）
- ユーザーが必要な機能だけを選択的に使用可能
- 独自の拡張を簡単に追加できるようになった
