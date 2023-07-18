import { getKeyboardLayout } from "./defaultKeyboardLayout";
import { rules } from "./defaultRules";
import { expect, test } from "vitest";

// function entryToString(entry: RuleEntry<VirtualKey>): string {
//   return (
//     entry.input.map((i) => i.key.toString()).join("") +
//     " " +
//     entry.output +
//     " " +
//     entry.nextInput.map((i) => i.key.toString()).join("")
//   );
// }

test("load google ime roman rule", () => {
  const rule = rules.get("roman", getKeyboardLayout("qwerty-jis"));
  // rule.entries.forEach((entry) => {
  //   console.log(entryToString(entry));
  // });
  expect(rule.entries.length).toBe(421);
});

test("load jis kana rule", () => {
  const rule = rules.get("jis-kana", getKeyboardLayout("qwerty-jis"));
  expect(rule.entries.length).toBe(178);
});

test("load nicola rule", () => {
  const rule = rules.get("nicola", getKeyboardLayout("qwerty-jis"));
  expect(rule.entries.length).toBe(256);
});
