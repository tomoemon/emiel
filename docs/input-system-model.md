# 入力系の形式モデル

この文書は、キーボードからの打鍵を文字列に対応付ける仕組み（以下「入力系」）を形式的に定義する。対象は emiel に限らず、IME、タイピングゲーム、キー入れ替えソフトを含む。

分類と具体例の解説は [input-system-classification.md](./input-system-classification.md) にある。この文書は定義と性質だけを扱う。

## 0. 記法

- 有限集合 $`X`$ に対し、$`X^*`$ は $`X`$ の有限列全体、$`X^+ = X^* \setminus \{\varepsilon\}`$、$`\varepsilon`$ は空列。
- $`|x|`$ は列の長さ、$`x \cdot y`$ は連接。
- $`x \sqsubseteq y`$ は「$`x`$ は $`y`$ の接頭辞」、$`x \sqsubset y`$ は「$`x`$ は $`y`$ の真の接頭辞」。

## 1. キーとイベント

- $`K`$：キー（key）の有限集合。
- イベント（event）：$`\mathit{Ev} = \{\downarrow k,\ \uparrow k \mid k \in K\}`$。$`\downarrow k`$ はキー $`k`$ を押す、$`\uparrow k`$ は離す。
- 時刻付きイベント列：$`x = ((a_1, t_1), \dots, (a_n, t_n))`$。$`a_i \in \mathit{Ev}`$、$`t_1 \le \dots \le t_n`$ は時刻（time）。
- 押下状態（held keys）$`H_i \subseteq K`$：$`i`$ 番目のイベントの直後に押されているキーの集合。$`H_0 = \emptyset`$ とし、$`\downarrow k`$ で $`k`$ を加え、$`\uparrow k`$ で $`k`$ を除く。
- イベント列は、押されているキーを押すイベントや、押されていないキーを離すイベントを含まないものとする。

## 2. 打鍵と打鍵化

### 2.1 修飾グループと修飾条件

Shift のような修飾キー（modifier）は、「左右どちらでもよい」と「複数を同時に押す」の 2 段で指定する。前者を修飾グループ、後者を修飾条件で表す。

- 修飾グループ（modifier group）$`G \subseteq K`$：空でないキー集合。押下状態 $`H`$ が $`G`$ を満たすとは、$`H \cap G \neq \emptyset`$、つまり $`G`$ のキーのいずれかが押されていることをいう。
  - 例：Shift $`= \{\mathrm{ShiftLeft}, \mathrm{ShiftRight}\}`$
- 修飾条件（modifier condition）$`m = (G_1, \dots, G_\ell)`$、$`\ell \ge 0`$：修飾グループの列。押下状態 $`H`$ が $`m`$ を満たす（$`H \models m`$）とは、$`H`$ がすべての $`G_j`$ を満たすことをいう。$`\ell = 0`$ の条件（修飾キーなし）は常に満たされる。
  - 例：Ctrl+Shift $`= (\{\mathrm{ControlLeft}, \mathrm{ControlRight}\}, \{\mathrm{ShiftLeft}, \mathrm{ShiftRight}\})`$
- emiel では、修飾グループが `ModifierGroup`、修飾条件が `AndModifier` に当たる。

### 2.2 打鍵

打鍵（stroke）の集合 $`\Sigma`$ は、次の 2 種類の要素からなる有限集合である。

- 単打（single stroke）$`\langle k \mid m \rangle`$、$`k \in K`$：キー $`k`$ を、押した時点の押下状態が $`m`$ を満たすように押す。
- 同時押し（simultaneous stroke）$`\langle S \mid m \rangle`$、$`S \subseteq K`$、$`|S| \ge 2`$：$`S`$ のキーを順不同で同時に押す。押下状態は $`m`$ を満たす必要がある。

### 2.3 打鍵化

打鍵化（stroke recognition）$`\beta : (\mathit{Ev} \times \mathbb{R})^* \to 2^{\Sigma^*}`$ は、イベント列を、それが表しうる打鍵列の集合に写す。どの打鍵列を採るかは §5 の受理で決まる。

打鍵化は、イベント列のどの情報を読むかで 4 段階に分ける。次の射影（projection）を考える。

- $`\pi_0(x)`$：押したキーの列。
- $`\pi_1(x)`$：押したキーと、その直前の押下状態の組の列。
- $`\pi_2(x)`$：時刻を除いたイベント列。
- $`\pi_3(x) = x`$。

各 $`\pi_j`$ は $`\pi_{j+1}`$ から計算できる。

定義（打鍵化の段階）：ある $`f`$ について $`\beta = f \circ \pi_j`$ と書けるとき、$`\beta`$ は段階 $`B_j`$ に属する。

- $`B_0`$：押したキーの順序だけを読む。
- $`B_1`$：押した時点でほかに何が押されているかも読む（前置修飾）。
- $`B_2`$：キーを離した順序も読む（押下区間の重なりによる同時押し）。
- $`B_3`$：時刻も読む（時間の閾値による同時打鍵判定、タイムアウト）。

命題 2.1：$`B_0 \subseteq B_1 \subseteq B_2 \subseteq B_3`$。

証明：$`\pi_j`$ は $`\pi_{j+1}`$ の関数なので、$`\beta = f \circ \pi_j`$ なら $`\beta`$ は $`\pi_{j+1}`$ を経由しても書ける。□

入力系の段階は、その $`\beta`$ が属する最小の段階で表す。$`B_0`$〜$`B_2`$ の打鍵化は、時刻を単調に付け替えても結果が変わらない。

## 3. 変換表

- $`\Gamma`$：出力記号（output symbol）の有限集合。かな、英字、キー入れ替えソフトならキーイベント。
- $`\Pi`$：仮想記号（pending symbol）の有限集合。$`\Sigma \cap \Pi = \emptyset`$。トグル入力の未確定の文字のような装置内部の記号で、打鍵列には現れない。$`\Delta = \Sigma \cup \Pi`$ とおく。
- 変換表（entries）$`E \subseteq \Delta^+ \times \Gamma^* \times \Delta^*`$：有限集合。要素 $`e = (\mathit{in}_e, \mathit{out}_e, \mathit{nxt}_e)`$ をエントリ（entry）と呼ぶ。3 つの成分は読み取り列（input）、出力（output）、持ち越し（next input）で、emiel の `RuleEntry` の `input`、`output`、`nextInput` に当たる。

## 4. 解釈

打鍵列（strokes）$`s \in \Sigma^*`$ の読み方を、配置（configuration）$`(r, c)`$ の遷移で定める。$`r \in \Sigma^*`$ は残りの打鍵列（rest）、$`c \in \Delta^*`$ は持ち越し（carry）である。

定義（1 歩）：$`\mathit{in}_e = c \cdot u`$ かつ $`r = u \cdot r'`$ となる $`u \in \Sigma^*`$ があるとき、エントリ $`e`$ で $`(r, c) \xrightarrow{e} (r', \mathit{nxt}_e)`$ と進める。$`u`$ をこの歩の区切りと呼ぶ。

持ち越しは読み取り列の先頭として丸ごと使い、残りを打鍵列から読む、という意味である。

定義（解釈）：$`(s, \varepsilon) = (r_0, c_0) \xrightarrow{e_1} \cdots \xrightarrow{e_n} (r_n, c_n) = (\varepsilon, \varepsilon)`$ となるエントリ列 $`p = (e_1, \dots, e_n)`$ を $`s`$ の解釈（parse）、$`\mathit{out}(p) = \mathit{out}_{e_1} \cdots \mathit{out}_{e_n}`$ をその出力とする。最後に持ち越しが残る解釈はない。

## 5. 方針と受理

### 5.1 区切りの方針 σ

各エントリに区切りの方針（segmentation）$`\sigma(e) \in \{D, T\}`$ を与える。$`D`$（device）は「装置が最長一致で区切る」、$`T`$（target）は「区切り方を目標文字列に委ねる」を表す。$`E_D = \{e \in E \mid \sigma(e) = D\}`$ とおく。

定義（最長一致条件）：解釈 $`p`$ が最長一致条件を満たすとは、$`\sigma(e_i) = D`$ であるどの歩 $`i`$ についても、次を満たす $`f \in E_D`$ が存在しないことをいう。

- $`\mathit{in}_{e_i} \sqsubset \mathit{in}_f`$ であり、かつ $`r_i = \varepsilon`$ であるか、$`\mathit{in}_f`$ の $`|\mathit{in}_{e_i}| + 1`$ 番目の記号が $`r_i`$ の先頭の打鍵に等しい。

つまり、次に打たれる打鍵を足すとより長いエントリの先頭になるところや、より長いエントリの途中で打鍵列が終わるところでは切らない。先読みするのは持ち越しではなく次に打たれる打鍵で、たとえば $`(tt, っ, t)`$ で切るかどうかは $`tta`$ で判定する。

### 5.2 読みの方針 ρ

入力系全体に読みの方針（reading）$`\rho \in \{D, T\}`$ を与え、使う表 $`E^\rho`$ を次で定める。

- $`\rho = T`$：$`E^\rho = E`$。同じ読み取り列を持つエントリが複数あれば、どれを採るかは目標文字列が決める。
- $`\rho = D`$：$`E^\rho`$ は、読み取り列ごとにエントリを 1 つだけ残した $`E`$ の部分集合。

どちらでも、$`E^\rho`$ に現れる読み取り列の集合は $`E`$ と等しい。

### 5.3 入力系と受理

定義（入力系）：入力系（input system）は組 $`\mathcal{S} = (\beta, E, \sigma, \rho)`$ である。

定義（許容される解釈）：$`E^\rho`$ のエントリだけからなり、最長一致条件を満たす解釈を、$`\mathcal{S}`$ で許容される解釈という。

定義（受理）：目標文字列（word）$`w \in \Gamma^*`$ に対し、$`\mathcal{S}`$ が受理（accept）するイベント列の集合を次で定める。

```math
\mathrm{Acc}_{\mathcal{S}}(w) = \{\, x \mid \exists s \in \beta(x),\ \exists p \text{ は } s \text{ の許容される解釈},\ \mathit{out}(p) = w \,\}
```

打鍵列のレベルの受理言語（language）を $`L_{\mathcal{S}}(w) = \{\, s \mid \exists p \text{ は } s \text{ の許容される解釈},\ \mathit{out}(p) = w \,\}`$ と書く。

定義（決定的な入力系）：どの打鍵列 $`s`$ についても、$`s`$ の許容される解釈の出力がすべて等しいとき（許容される解釈がない場合を含む）、$`\mathcal{S}`$ は決定的であるという。決定的な入力系は、打鍵列から出力への部分関数を定める。目標文字列を持たない装置（IME、キー入れ替えソフト）は、決定的な入力系として表す。

## 6. 変換表の段階

変換表を構文で 5 段階に分ける。上の段階から条件を足す形で定める。

- $`C_4`$：進行条件を満たすすべての表。
  - 進行条件：打鍵を読まず（$`u = \varepsilon`$）出力もしない（$`\mathit{out}_e = \varepsilon`$）歩だけで、同じ持ち越しに戻ることがない。打鍵列と目標文字列を固定したとき、解釈を有限個にするための条件である。
- $`C_3`$：$`C_4`$ のうち、$`\Pi = \emptyset`$ で、すべての $`e`$ で $`\mathit{out}_e \neq \varepsilon`$。
- $`C_2`$：$`C_3`$ のうち、すべての $`e`$ で $`\mathit{nxt}_e = \varepsilon`$。
- $`C_1`$：$`C_2`$ のうち、読み取り列の集合が接頭符号（$`\mathit{in}_e \sqsubset \mathit{in}_f`$ となる組がない）。
- $`C_0`$：$`C_2`$ のうち、すべての $`e`$ で $`|\mathit{in}_e| = 1`$。

$`C_0 \subseteq C_1 \subseteq C_2 \subseteq C_3 \subseteq C_4`$ が成り立つ。$`C_0 \subseteq C_1`$ は、長さ 1 の列どうしは真の接頭辞にならないことによる。

## 7. 性質

命題 7.1（有限性）：$`E \in C_3`$ ならば、どの入力系 $`\mathcal{S}`$ でも $`L_{\mathcal{S}}(w)`$ は有限集合で、すべての $`s \in L_{\mathcal{S}}(w)`$ は $`|s| \le |w| \cdot \max_e |\mathit{in}_e|`$ を満たす。

証明：$`C_3`$ ではすべての歩が 1 記号以上を出力するので、$`\mathit{out}(p) = w`$ となる解釈の歩数は $`|w|`$ 以下である。各歩の区切りの長さは $`\max_e |\mathit{in}_e|`$ 以下である。□

命題 7.2（有限状態性）：$`E \in C_4`$ ならば、$`L_{\mathcal{S}}(w)`$ は正規言語である。受理する有限オートマトンは、状態を（出力済みの長さ、持ち越し、最長一致条件の検査を待つ読み取り列の集合）の組として構成できる。

証明の概略：出力済みの長さは $`|w|`$ 以下、持ち越しは $`\{\varepsilon\} \cup \{\mathit{nxt}_e\}`$ のいずれか、検査を待つ読み取り列は $`\{\mathit{in}_e\}`$ の部分集合で、どれも有限通りしかない。最長一致条件は、読み取り列と次の 1 打鍵だけで検査できる。したがって状態は有限で、遷移は表から直接定まる。□

$`\beta`$ が有限状態の変換器で与えられる場合（emiel の打鍵化はこれに当たる）は、合成によりイベント列のレベルの $`\mathrm{Acc}_{\mathcal{S}}(w)`$ も有限状態で受理できる。

$`C_4`$ では $`L_{\mathcal{S}}(w)`$ が無限になりうる。例：仮想記号 $`\Pi = \{あ, い, う, え, お\}`$ と、打鍵 $`a`$ に対する表 $`(a, \varepsilon, あ)`$、$`(あa, \varepsilon, い)`$、$`(いa, \varepsilon, う)`$、$`(うa, \varepsilon, え)`$、$`(えa, \varepsilon, お)`$、$`(おa, \varepsilon, あ)`$、$`(あ, あ, \varepsilon)`$ … $`(お, お, \varepsilon)`$ を考える（すべて $`\sigma = T`$）。このとき $`L_{\mathcal{S}}(う) = aaa(aaaaa)^*`$ である。

定義（言語の族）：段階 $`C_j`$ の表を変換表に持つ入力系 $`\mathcal{S}`$ が定める写像 $`w \mapsto L_{\mathcal{S}}(w)`$ の集合を、$`C_j`$ の言語の族と呼ぶ。

系 7.3：$`C_3`$ と $`C_4`$ の言語の族は異なる。

証明：命題 7.1 より $`C_3`$ の $`L_{\mathcal{S}}(w)`$ は常に有限だが、上の例の $`L_{\mathcal{S}}(う)`$ は無限である。□

命題 7.4：$`C_0`$ と $`C_1`$ の言語の族は異なる。

証明：$`C_0`$ では各歩が 1 打鍵を読み 1 記号以上を出力するので、$`s \in L_{\mathcal{S}}(w)`$ なら $`|s| \le |w|`$。$`C_1`$ の表 $`\{(ka, か, \varepsilon)\}`$ では $`ka \in L_{\mathcal{S}}(か)`$ で、$`|ka| = 2 > 1`$。□

$`C_1`$ と $`C_2`$、$`C_2`$ と $`C_3`$ の言語の族が異なるかは、この文書では証明しない。例による説明は分類の文書にある。

以下、$`(\sigma_0, \rho)`$ は、すべてのエントリに $`\sigma(e) = \sigma_0`$ を与え、読みの方針を $`\rho`$ とした入力系を表す。

命題 7.5（方針の包含）：$`\beta`$ と $`E`$ を固定すると、どの $`w`$ についても次が成り立つ。

- $`\mathrm{Acc}_{(D,D)}(w) \subseteq \mathrm{Acc}_{(D,T)}(w) \subseteq \mathrm{Acc}_{(T,T)}(w)`$
- $`\mathrm{Acc}_{(D,D)}(w) \subseteq \mathrm{Acc}_{(T,D)}(w) \subseteq \mathrm{Acc}_{(T,T)}(w)`$

証明：$`E^\rho \subseteq E`$ なので、$`\rho = D`$ の解釈は $`\rho = T`$ でも解釈である。最長一致条件は読み取り列の集合だけで決まり、その集合は $`\rho`$ によらない。$`\sigma = T`$ は最長一致条件を課さないので、$`\sigma = D`$ で許容される解釈は $`\sigma = T`$ でも許容される。□

命題 7.6（方針が効かない場合）：

- $`E \in C_1`$ ならば、許容される解釈は $`\sigma`$ によらない。
- $`E`$ の読み取り列がすべて相異なるならば、許容される解釈は $`\rho`$ によらない。

証明：$`C_1`$ では $`\mathit{in}_{e_i} \sqsubset \mathit{in}_f`$ となる $`f`$ が存在しないので、最長一致条件は常に成り立つ。読み取り列が相異なれば $`E^\rho = E`$ である。□

## 8. emiel の位置づけ

emiel は次の入力系として表せる。

- 打鍵化 $`\beta`$：$`B_2`$。押下状態と離した順序を使い、時刻は使わない（`StrokeCommitter`）。
- 変換表 $`E`$：`RulePrimitive.rawEntries`（プレフィックス展開の前のエントリ）で、$`C_3`$ に属する。
  - $`\Gamma`$ はかなと英数記号、$`\Pi = \emptyset`$。
  - 持ち越しは、次のエントリの読み取り列の真の接頭辞であることを要求する（`RuleEntry.isConnetableAfter`）。§4 で、持ち越しのある歩に $`u \neq \varepsilon`$ を課したものに当たる。
  - 出力が空でないことは前提としている（検査はしていない）。
- 区切りの方針 $`\sigma`$：`extendCommonPrefixCommonEntry` が true のエントリは $`D`$、false のエントリは $`T`$。
  - mozc 形式の読み込みでは、出力がレイアウトで直接打てる文字を含まないエントリが $`D`$ になる。
  - JSON 形式の読み込みでは既定が $`T`$、直接入力ルール（`createDirectInputRule`）はすべて $`T`$。
- 読みの方針 $`\rho`$：$`T`$。
- 出力の比較：正規化関数 $`\nu`$（既定は `defaultComposedNormalize`）を通して、$`\nu(\mathit{out}(p)) = \nu(w)`$ で比べる。

実装と定義の関係で、未検証のことと既知の差分は次のとおり。

- 予想：`expandPrefixRules` は、最長一致条件付きの表 $`E`$ を、最長一致条件なしで同じ $`L_{\mathcal{S}}(w)`$ を与える表に変換する。トグル入力、「んa」、「あいabc」の例では一致したが、一般の証明はない。
- 既知の差分：`expandPrefixRules` は、他のエントリの真の接頭辞になっているエントリを結合し直すとき、そのエントリ自身の持ち越しを引き継がない。そうしたエントリが $`\sigma = D`$ で持ち越しを持つ場合、上の予想は成り立たない可能性がある。同梱のローマ字に該当するエントリはない。
- `build` は命題 7.1 に基づき、$`L_{\mathcal{S}}(w)`$ を DAG（`StrokeNode` のグラフ）として構成する。$`C_4`$ に拡張するには、閉路を許すグラフが要る。
- `StrokeCommitter` は打鍵化をオンラインで実装し、各時点で 1 つの読みに決める。emiel が実際に受理するイベント列の集合が $`\mathrm{Acc}_{\mathcal{S}}(w)`$ と一致するかは確かめていない。

### 対象文字集合

配列によって定義されている記号の種類は異なる。配列を切り替えても同じ単語を打てるよう、emiel が入力を保証する文字を対象文字集合 $`\Gamma_{\mathrm{core}}`$ として定める。文字は正規化 $`\nu`$ をかけた後の形で扱うので、ひらがなとカタカナ、全角と半角の英数記号はそれぞれ同じ文字とみなす。

- かな：清音（あ〜ん、を）、濁音、半濁音、小書き（ぁ ぃ ぅ ぇ ぉ ゃ ゅ ょ っ）
- 数字：0〜9
- 英字：a〜z、A〜Z
- 記号：ー 、 。 ! ? 「 」

保証：同梱のかな配列のルール $`R`$ を、同梱のキーボードレイアウトから作った直接入力ルールと合成した入力系を $`\mathcal{S}`$ とする（`R.merge(createDirectInputRule(layout))`）。すべての $`c \in \Gamma_{\mathrm{core}}`$ について $`L_{\mathcal{S}}(c) \neq \emptyset`$、つまり $`c`$ 1 文字の単語を build できる。

かな配列のルール単体では数字と英字を打てないので、保証は直接入力と合成した構成を前提にする。$`\Gamma_{\mathrm{core}}`$ に含まれない文字（ゔ、ゎ、・、〜 など）は、ルールに定義があれば打てるが、emiel は保証しない。配列を切り替えて使う単語リストは、$`\Gamma_{\mathrm{core}}`$ の文字だけで作ることを推奨する。

対象文字集合は `coreCharset` として公開している。`findUntypableChars(rule)` で、任意のルールについて対象文字集合のうち打てない文字を調べられる。同梱のルールとキーボードレイアウトのすべての組み合わせは `pnpm run check:charset` でまとめて検査できる。

## 9. この定義の範囲外

次の性質は入力系の表現力とは独立しているので、このモデルでは扱わない。

- ミスの定義：受理されない打鍵のうち、どれを「ミス」として数えるか。emiel ではルール全体を参照して決める（otherMatched）。
- 判定の遅延：打鍵を受けてから受理・不受理を確定するまでに、どれだけ先のイベントを待ってよいか。
- 取り消し：Backspace による取り消しと、その統計上の扱い。
- かな漢字変換などの、出力後の変換。
