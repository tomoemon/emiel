import { prettyPrint } from "@base2/pretty-print-object";
import { loadFromGoogleImeText } from "./googleImeConfigRuleLoader";
import { test } from "vitest";
import { buildKanaNode } from "../core/builderKanaGraph";
import { buildStrokeNode } from "../core/builderStrokeGraph";
import { getKeyboardLayout } from "./defaultKeyboardLayout";

function showNextNode(node: any) {
  return console.log(
    prettyPrint(node, {
      indent: "  ",
      transform: (_, prop, originalResult) => {
        if (prop.toString().indexOf("previous") >= 0 || prop == "kanaEdge") {
          return "[ignore]";
        }
        return originalResult;
      },
    })
  );
}
function showPreviousNode(node: any) {
  return console.log(
    prettyPrint(node, {
      indent: "  ",
      transform: (_, prop, originalResult) => {
        if (prop.toString().indexOf("next") >= 0 || prop == "kanaEdge") {
          return "[ignore]";
        }
        return originalResult;
      },
    })
  );
}

test("load google ime empty rule", () => {
  const rule = loadFromGoogleImeText(
    "test-rule",
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
    getKeyboardLayout("qwerty-jis")
  );
  // console.log(rule);
  // const [_, endKanaNode] = buildKanaNode(rule, "おった");
  // const startStrokeNode = buildStrokeNode(rule, endKanaNode);
  // showNextNode(startStrokeNode);
  // showPreviousNode(endKanaNode);
});

test("erase invalid connection test", () => {
  const rule = loadFromGoogleImeText(
    "test-rule",
    `
a	あ
x	あいうえ
`,
    getKeyboardLayout("qwerty-jis")
  );
  // console.log(prettyPrint(rule, { indent: "    " }));
  /*
  function clearPrevious(node: KanaNode) {
    node.previousEdges.splice(0);
    for (let edge of node.nextEdges) {
      clearPrevious(edge.next);
    }
  }
	*/
  //clearPrevious(startNode);
  // console.log(prettyPrint(startNode, { indent: "    " }));
});
