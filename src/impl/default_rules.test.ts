import { RuleEntry } from "../core/rule";
import { rules } from "./default_rules";
import { expect, test } from "vitest";
import { VirtualKey } from "./virtual_key";
import { prettyPrint } from "@base2/pretty-print-object";

function entryToString(entry: RuleEntry<VirtualKey>): string {
  return (
    entry.input.map((i) => i.key.toString()).join("") +
    " " +
    entry.output +
    " " +
    entry.nextInput.map((i) => i.key.toString()).join("")
  );
}

test("load google ime roman rule", () => {
  const rule = rules.roman;
  // rule.entries.forEach((entry) => {
  //   console.log(entryToString(entry));
  // });
  expect(rule.entries.length).toBe(420);
});

test("load jis kana rule", () => {
  const rule = rules.jis_kana;
  expect(rule.entries.length).toBe(178);
});

test("load nicola rule", () => {
  const rule = rules.nicola;
  expect(rule.entries.length).toBe(255);
});
