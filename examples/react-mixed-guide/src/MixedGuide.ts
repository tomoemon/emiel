import { Automaton } from "emiel";

export class MixedText {
  readonly kanaText: string;
  readonly mixedText: string;
  readonly mixedTextIndex: number[];

  /**
   * commaKanaText: "きょう,は,い,い,てん,き"
   * commaMixedTextSplit: "今日,は,い,い,天,気"
   */
  constructor(
    readonly commaKanaText: string,
    readonly commaMixedText: string,
  ) {
    const kanaTextSplit = commaKanaText.split(",");
    const mixedTextSplit = commaMixedText.split(",");
    if (kanaTextSplit.length !== mixedTextSplit.length) {
      throw new Error(
        `kanaTextSplit.length !== mixedTextSplit.length: ${commaKanaText} ${commaMixedText}`,
      );
    }
    /*
     * mixedTextIndex はある kanaText の位置における mixedText の位置を指す
     *                  き ょ う  は い い  て ん き
     * mixedTextIndex: [0, 0, 0, 2, 3, 4, 5, 5, 6, 7]
     */
    const mixedTextIndex = [];
    let lastMixedIndex = 0;
    kanaTextSplit.forEach((kana, i) => {
      for (let j = 0; j < kana.length; j++) {
        mixedTextIndex.push(lastMixedIndex);
      }
      lastMixedIndex += mixedTextSplit[i].length;
    });
    mixedTextIndex.push(lastMixedIndex);
    this.mixedTextIndex = mixedTextIndex;
    this.kanaText = kanaTextSplit.join("");
    this.mixedText = mixedTextSplit.join("");
  }
}

export function withMixedText(automaton: Automaton, mixedText: MixedText) {
  return automaton.with({
    getFinishedMixedSubstr(): string {
      return mixedText.mixedText.substring(
        0,
        mixedText.mixedTextIndex[automaton.getFinishedWord().length],
      );
    },
    getPendingMixedSubstr(): string {
      return mixedText.mixedText.substring(
        mixedText.mixedTextIndex[automaton.getFinishedWord().length],
      );
    },
  });
}
