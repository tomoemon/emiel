import { expect, test } from "vitest";
import { VirtualKeys } from "..";
import { buildKanaNode } from "../core/builderKanaGraph";
import { loadMozcRule } from "./mozcRuleLoader";
import { loadPresetKeyboardLayoutQwertyJis } from "./presetKeyboardLayout";

test("build kana node", () => {
  const rule = loadMozcRule(
    `
a	あ
i	い
u	う
e	え
o	お
tt	っ	t
ta	た
ltu	っ
`,
    loadPresetKeyboardLayoutQwertyJis(),
  );
  const [startNode, endKanaNode] = buildKanaNode(rule, "おった");
  expect(startNode.nextEdges[0].entries[0].output).toBe("お");
  const nextNode = startNode.nextEdges[0].next;
  expect(nextNode.nextEdges.length).toBe(2);
  expect(nextNode.nextEdges[0].entries[0].output).toBe("っ");
  expect(nextNode.nextEdges[0].entries[1].output).toBe("た");
  expect(nextNode.nextEdges[0].next).toBe(endKanaNode);
  expect(nextNode.nextEdges[1].entries[0].output).toBe("っ");
  const thirdNode = nextNode.nextEdges[1].next;
  expect(thirdNode.nextEdges.length).toBe(1);
  expect(thirdNode.nextEdges[0].entries[0].output).toBe("た");
  expect(thirdNode.nextEdges[0].next).toBe(endKanaNode);
});

test("erase invalid connection test", () => {
  const rule = loadMozcRule(
    `
a	あ
x	あいう
`,
    loadPresetKeyboardLayoutQwertyJis(),
  );
  const [startNode, endNode] = buildKanaNode(rule, "あいう");
  expect(startNode.nextEdges.length).toBe(1);
  expect(startNode.nextEdges[0].entries[0].input[0].key).toBe(VirtualKeys.X);
  expect(startNode.nextEdges[0].next).toBe(endNode);
});
