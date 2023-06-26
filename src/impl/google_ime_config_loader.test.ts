import { loadFromGoogleImeText } from "./google_ime_config_loader";
import { VirtualKeys } from "./virtual_key";
import { expect, test } from "vitest";

test("load google ime empty rule", () => {
  const rule = loadFromGoogleImeText("test-rule", ``);
  expect(rule.entries.length).toBe(0);
});

test("load google ime single rule", () => {
  const rule = loadFromGoogleImeText("test-rule", `a	あ`);
  const entries = rule.entries;
  expect(entries.length).toBe(1);
  expect(entries[0].input[0].keys).toEqual([VirtualKeys.A]);
  expect(entries[0].output).toEqual("あ");
  expect(entries[0].nextInput).toEqual([]);
});

test("load google ime next rule", () => {
  const rule = loadFromGoogleImeText("test-rule", `tt	っ	t`);
  const entries = rule.entries;
  expect(entries.length).toBe(1);
  expect(entries[0].input.length).toBe(2);
  expect(entries[0].input[0].keys).toEqual([VirtualKeys.T]);
  expect(entries[0].input[1].keys).toEqual([VirtualKeys.T]);
  expect(entries[0].output).toEqual("っ");
  expect(entries[0].nextInput.length).toEqual(1);
  expect(entries[0].nextInput[0].keys).toEqual([VirtualKeys.T]);
});

test("load google ime double rule", () => {
  const rule = loadFromGoogleImeText(
    "test-rule",
    `a	あ
i	い
`
  );
  const entries = rule.entries;
  expect(entries.length).toBe(2);
  expect(entries[0].input[0].keys).toEqual([VirtualKeys.A]);
  expect(entries[0].output).toEqual("あ");
  expect(entries[0].nextInput).toEqual([]);
  expect(entries[1].input[0].keys).toEqual([VirtualKeys.I]);
  expect(entries[1].output).toEqual("い");
  expect(entries[1].nextInput).toEqual([]);
});
