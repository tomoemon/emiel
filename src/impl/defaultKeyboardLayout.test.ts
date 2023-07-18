import { expect, test } from "vitest";
import { VirtualKeys } from "./virtualKey";
import { detectKeyboardLayout } from "./defaultKeyboardLayout";

test("empty", () => {
  expect(detectKeyboardLayout(new Map()).name).toBe("QWERTY JIS");
});

test("dvorak", () => {
  expect(
    detectKeyboardLayout(
      new Map([
        [VirtualKeys.A, "a"],
        [VirtualKeys.F, "u"],
      ])
    ).name
  ).toBe("DVORAK");
});

test("qwerty us", () => {
  expect(
    detectKeyboardLayout(
      new Map([
        [VirtualKeys.A, "a"],
        [VirtualKeys.BracketLeft, "["],
      ])
    ).name
  ).toBe("QWERTY US");
});

test("qwerty jis", () => {
  expect(
    detectKeyboardLayout(
      new Map([
        [VirtualKeys.A, "a"],
        [VirtualKeys.BracketLeft, "@"],
      ])
    ).name
  ).toBe("QWERTY JIS");
});
