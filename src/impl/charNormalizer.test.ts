import { expect, test } from "vitest";
import { defaultAlphaNumericNormalize, defaultKanaNormalize } from "./charNormalizer";

test("hiragana normalized: あ", () => {
  expect(defaultKanaNormalize("あ")).toBe("ア");
});

test("katakana not changed: ア", () => {
  expect(defaultKanaNormalize("ア")).toBe("ア");
});

test("number normalized: 1", () => {
  expect(defaultAlphaNumericNormalize("１")).toBe("1");
});

test("sign normalized: @", () => {
  expect(defaultAlphaNumericNormalize("＠")).toBe("@");
});

test("sign normalized: !", () => {
  expect(defaultAlphaNumericNormalize("！")).toBe("!");
});

test("number not normalized normalized: 1", () => {
  expect(defaultKanaNormalize("１")).toBe("１");
});

test("sign not normalized: @", () => {
  expect(defaultKanaNormalize("＠")).toBe("＠");
});

test("sign not normalized: !", () => {
  expect(defaultKanaNormalize("！")).toBe("！");
});
