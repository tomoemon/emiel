import { expect, test } from "vitest";
import { VirtualKeys } from "../core/virtualKey";
import { findMatchedKeyboardLayout } from "./presetKeyboardLayout";

test("empty", () => {
  expect(findMatchedKeyboardLayout(new Map()).name).toBe("QWERTY JIS");
});

test("dvorak", () => {
  expect(
    findMatchedKeyboardLayout(
      new Map([
        [VirtualKeys.A, "a"],
        [VirtualKeys.F, "u"],
      ]),
    ).name,
  ).toBe("DVORAK");
});

test("qwerty us", () => {
  expect(
    findMatchedKeyboardLayout(
      new Map([
        [VirtualKeys.A, "a"],
        [VirtualKeys.BracketLeft, "["],
      ]),
    ).name,
  ).toBe("QWERTY US");
});

test("qwerty jis", () => {
  expect(
    findMatchedKeyboardLayout(
      new Map([
        [VirtualKeys.A, "a"],
        [VirtualKeys.BracketLeft, "@"],
      ]),
    ).name,
  ).toBe("QWERTY JIS");
});
