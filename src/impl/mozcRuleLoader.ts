import { KeyboardLayout } from "../core/keyboardLayout";
import { Rule, RuleEntry } from "../core/rule";
import { RuleStroke } from "../core/ruleStroke";
import { product } from "../utils/itertools";
import { defaultKanaNormalize } from "./charNormalizer";

export function loadMozcRule(
  name: string,
  text: string,
  layout: KeyboardLayout
): Rule {
  /*
    a	あ	
    ta	た	
    tt	っ	t
    */
  text = text.replace(/\r\n/g, "\n");
  text = text.replace(/\r/g, "\n");
  const lines = text.split("\n");
  const entries: RuleEntry[] = [];
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
    const inputs: RuleStroke[][] = [...cols[0]].map((c) =>
      toStrokesFromChar(layout, c)
    );
    const output = cols[1];
    const nextInput: RuleStroke[] = [...cols[2]].map(
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
  return new Rule(name, entries, layout.modifierGroup, defaultKanaNormalize);
}

function toStrokesFromChar(
  layout: KeyboardLayout,
  key: string
): RuleStroke[] {
  const strokes = layout.getStrokesByChar(key);
  if (!strokes) {
    throw new Error("invalid key: " + key);
  }
  return strokes;
}
