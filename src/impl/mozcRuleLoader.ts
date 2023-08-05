import { KeyboardLayout } from "../core/keyboardLayout";
import { Rule, RuleEntry } from "../core/rule";
import { RuleStroke } from "../core/ruleStroke";
import { product } from "../utils/itertools";
import { defaultKanaNormalize } from "./charNormalizer";
import { VirtualKey } from "./virtualKey";

export function loadMozcRule(
  name: string,
  text: string,
  layout: KeyboardLayout<VirtualKey>
): Rule<VirtualKey> {
  /*
		a	あ	
		ta	た	
		tt	っ	t
		*/
  text = text.replace(/\r\n/g, "\n");
  text = text.replace(/\r/g, "\n");
  const lines = text.split("\n");
  const entries: RuleEntry<VirtualKey>[] = [];
  for (let line of lines) {
    line = line.trim();
    if (line.length == 0) {
      continue;
    }
    const cols = line.split("\t");
    if (cols.length < 2) {
      continue;
    }
    if (cols.length < 3) {
      cols.push("");
    }
    // キーボードレイアウトによっては1つの文字を打つために複数のキー候補がありえる
    const inputs: RuleStroke<VirtualKey>[][] = [...cols[0]].map((c) =>
      toStrokesFromChar(layout, c)
    );
    const output = cols[1];
    const nextInput: RuleStroke<VirtualKey>[] = [...cols[2]].map(
      (c) => toStrokesFromChar(layout, c)[0]
    );
    Array.from(product(inputs)).forEach((input) => {
      entries.push(
        new RuleEntry(
          input,
          output,
          nextInput,
          !Array.from(output).some((v) => layout.hasChar(v))
        )
      );
    });
  }
  return new Rule(name, entries, layout.modifiers, defaultKanaNormalize);
}

function toStrokesFromChar(
  layout: KeyboardLayout<VirtualKey>,
  key: string
): RuleStroke<VirtualKey>[] {
  const strokes = layout.getStrokesByChar(key);
  if (!strokes) {
    throw new Error("invalid key: " + key);
  }
  return strokes;
}
