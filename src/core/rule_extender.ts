import { Comparable, RuleEntry } from "./rule";
import { RuleStroke } from "./stroke";

export function extendCommonPrefixOverlappedEntriesDeeply<
  T extends Comparable<T>
>(entries: RuleEntry<T>[]): RuleEntry<T>[] {
  const alphaNumericEntries = entries.filter((entry) => entry.isAlphaNumeric);
  const notAlphaNumericEntries = entries.filter(
    (entry) => !entry.isAlphaNumeric
  );
  return [
    ...recursiveExtendCommontPrefixOverlappedEntries(alphaNumericEntries),
    ...recursiveExtendCommontPrefixOverlappedEntries(notAlphaNumericEntries),
  ];
}

function recursiveExtendCommontPrefixOverlappedEntries<T extends Comparable<T>>(
  entries: RuleEntry<T>[]
): RuleEntry<T>[] {
  let newEntries = entries.slice();
  while (true) {
    const { extendRequiredEntries, extendedNewEntries } =
      extendCommonPrefixOverlappedEntries(newEntries);
    // console.log(
    //   Array.from(extendRequiredEntries).map((v) => {
    //     return {
    //       input: v.input.map((i) => i.keys[0]).join("|"),
    //       output: v.output,
    //       nextInput: v.nextInput.map((i) => i.keys[0]).join("|"),
    //     };
    //   })
    // );
    // extend された entry は除外する
    newEntries = newEntries.filter(
      (entry) => !extendRequiredEntries.has(entry)
    );
    // console.log(
    //   extendedNewEntries.map((v) => {
    //     return {
    //       input: v.input.map((i) => i.keys[0]).join("|"),
    //       output: v.output,
    //       nextInput: v.nextInput.map((i) => i.keys[0]).join("|"),
    //     };
    //   })
    // );
    // new entries を追加する
    newEntries.push(...extendedNewEntries);
    if (extendRequiredEntries.size === 0) {
      break;
    }
  }
  return newEntries;
}

function extendCommonPrefixOverlappedEntries<T extends Comparable<T>>(
  entries: RuleEntry<T>[]
): {
  extendRequiredEntries: Set<RuleEntry<T>>;
  extendedNewEntries: RuleEntry<T>[];
} {
  // console.log("called extendCommonPrefixOverlappedEntries");
  // Map のキーにするために、RuleStroke を文字列に変換する
  const strokeToHash = (...strokes: RuleStroke<T>[]): string => {
    return strokes
      .map(
        (stroke) =>
          `${stroke.keys
            .map((v) => v.toString())
            .join(
              ","
            )}/${stroke.requiredModifier.toString()}/${stroke.unnecessaryModifiers
            .map((v) => v.toString())
            .join(",")}`
      )
      .join("-");
  };

  const entryMapByInput = new Map<string, RuleEntry<T>[]>();
  const entryMapByInputPrefix = new Map<string, RuleEntry<T>[]>();
  entries.forEach((entry) => {
    // 各エントリの input をキーにして entry を Map に登録する
    const hash = strokeToHash(...entry.input);
    if (entryMapByInput.has(hash)) {
      entryMapByInput.get(hash)?.push(entry);
    } else {
      entryMapByInput.set(hash, [entry]);
    }
    // 各エントリの input prefix をキーにして entry を Map に登録する
    for (let i = 1; i < entry.input.length; i++) {
      const prefixHash = strokeToHash(...entry.input.slice(0, i));
      if (entryMapByInputPrefix.has(prefixHash)) {
        entryMapByInputPrefix.get(prefixHash)?.push(entry);
      } else {
        entryMapByInputPrefix.set(prefixHash, [entry]);
      }
    }
  });
  // console.log("entryMapByInput", entryMapByInput);
  // console.log("entryMapByInputPrefix", entryMapByInputPrefix);
  const extendRequiredInput = new Map<string, RuleEntry<T>[]>();
  entries.forEach((entry) => {
    // 各エントリの input の prefix に一致するものが entryMap にある場合、
    // そのまま使うことはできないので、展開する
    // 例： n/ん, na/な, ka/か
    // このとき、n 単独で「ん」を打つことはできず、
    // nka のときのみ「んか」となって「ん」を n 一打で打つことができる
    // ※2打鍵目が a 以外でなければならず、a 以外で始まるエントリと結合する
    //
    // 展開対象が複数ある場合、展開されたものがさらに展開を要することもある
    // 例：n/ん, na/な, ka/か, s/さ, si/し
    // n/ん → nk/ん/k, ns/んさ, ns/ん/s となる
    // ns/んさ → nsna/んさな, nska/んさか
    // s/さ → sn/さん, sna/さな, ska/さか
    // 最終的に
    // nk/ん/k, nsna/んさな, nska/んさか, sn/さん, sna/さな, ska/さか, si/し, ka/か, na/な
    // となる
    // 疑問：展開されたことによって、すでにチェック済みのもの（上で言えば na/な とか）が
    // あらためて展開が必要になることはあるか？
    // →展開されると、重複しないように prefix が伸びていくので、一度展開不要となったエントリが
    // あらためて展開必要になることはないはず
    // nnn/ななな, nn/なぬ, n/ん, ka/か
    // n/ん → nk/ん/k
    // nn/なぬ → nnk/なぬ/k
    for (let i = 1; i < entry.input.length; i++) {
      const prefixHash = strokeToHash(...entry.input.slice(0, i));
      if (!entryMapByInput.has(prefixHash)) {
        // prefix と同じ入力を持つものがないときは展開不要
        continue;
      }
      // console.log(prefixHash);
      if (!extendRequiredInput.has(prefixHash)) {
        // 同じ prefix を持つエントリ集合を P とする (entry=na の場合, na, ni, nu, ...)
        // P に含まれないエントリのうち、「P に含まれるエントリの input[i] で使われていないキー」を
        // 1打鍵目に持つエントリのみ、この後の展開で使うことができる
        const usedStrokeHashes = new Set<string>(
          entryMapByInputPrefix
            .get(prefixHash)
            ?.map((prefixEntry) => strokeToHash(prefixEntry.input[i]))
        );
        usedStrokeHashes.add(strokeToHash(entry.input[0]));
        // console.log("usedStrokeHashes", usedStrokeHashes);
        extendRequiredInput.set(
          prefixHash,
          entries.filter((entry) => {
            const firstHash = strokeToHash(entry.input[0]);
            return !usedStrokeHashes.has(firstHash);
          })
        );
      }
    }
  });
  // console.log("extendRequiredInput", extendRequiredInput);
  const extendRequiredEntries = new Set<RuleEntry<T>>();
  const extendedNewEntries = new Map<string, RuleEntry<T>>();
  extendRequiredInput.forEach((availableEntries, hash) => {
    // 展開が必要なエントリ（例：n/ん）
    const prefixOverlapEntries = entryMapByInput.get(hash) as RuleEntry<T>[];
    prefixOverlapEntries.forEach((expandRequiredEntry) => {
      extendRequiredEntries.add(expandRequiredEntry);
      availableEntries.forEach((availableEntry) => {
        if (availableEntry.input.length === 1) {
          const newInput = [
            ...expandRequiredEntry.input,
            ...availableEntry.input,
          ];
          const newInputHash = strokeToHash(...newInput);
          extendedNewEntries.set(
            newInputHash,
            new RuleEntry<T>(
              newInput,
              expandRequiredEntry.output + availableEntry.output,
              availableEntry.nextInput,
              false
            )
          );
        } else {
          const newInput = [
            ...expandRequiredEntry.input,
            availableEntry.input[0],
          ];
          const newInputHash = strokeToHash(...newInput);
          extendedNewEntries.set(
            newInputHash,
            new RuleEntry<T>(
              [...expandRequiredEntry.input, availableEntry.input[0]],
              expandRequiredEntry.output,
              [availableEntry.input[0]],
              false
            )
          );
        }
      });
    });
  });
  return {
    extendRequiredEntries: extendRequiredEntries,
    extendedNewEntries: Array.from(extendedNewEntries.values()),
  };
}
