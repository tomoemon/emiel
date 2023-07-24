import { Comparable, Rule } from "./rule";
import { buildKanaNode } from "./builderKanaGraph";
import { buildStrokeNode } from "./builderStrokeGraph";
import { Automaton, MixedAutomaton } from "./automaton";

export function build<T extends Comparable<T>>(
  rule: Rule<T>,
  kanaText: string
): Automaton<T> {
  const [_, endKanaNode] = buildKanaNode(rule, kanaText);
  return new Automaton<T>(kanaText, buildStrokeNode(rule, endKanaNode));
}

/**
 * kanaTextSplit: [きょう,は,い,い,てん,き]
 * mixedTextSplit: [今日,は,い,い,天,気]
 *
 * ある kanaText の位置における mixedText の位置を指す
 *                  き ょ う  は い い  て ん き
 * mixedTextIndex: [0, 0, 0, 2, 3, 4, 5, 5, 6, 7]
 */
export function buildMixed<T extends Comparable<T>>(
  rule: Rule<T>,
  kanaTextSplit: string[],
  mixedTextSplit: string[]
): MixedAutomaton<T> {
  if (kanaTextSplit.length !== mixedTextSplit.length) {
    throw new Error(
      `kanaText.length !== mixedText.length: ${kanaTextSplit} ${mixedTextSplit}`
    );
  }
  const automaton = build(rule, kanaTextSplit.join(""));
  const mixedTextIndex = [];
  let lastMixedIndex = 0;
  kanaTextSplit.forEach((kana, i) => {
    for (let j = 0; j < kana.length; j++) {
      mixedTextIndex.push(lastMixedIndex);
    }
    lastMixedIndex += mixedTextSplit[i].length;
  });
  mixedTextIndex.push(lastMixedIndex);
  return new MixedAutomaton<T>(
    automaton,
    mixedTextSplit.join(""),
    mixedTextIndex
  );
}
