import * as v from "valibot";
import { describe, expect, test } from "vitest";
import { loadJsonKeyboardLayout } from "./keyboardLayoutLoader";

test("valid keyboard layout", () => {
  const layout = loadJsonKeyboardLayout({
    name: "test",
    entries: [{ output: "a", input: { key: "A", shift: false } }],
  });
  expect(layout.name).toBe("test");
});

describe("validation errors", () => {
  test("name is missing", () => {
    expect(() =>
      loadJsonKeyboardLayout({
        entries: [{ output: "a", input: { key: "A", shift: false } }],
      }),
    ).toThrow(v.ValiError);
  });

  test("entries is missing", () => {
    expect(() => loadJsonKeyboardLayout({ name: "test" })).toThrow(v.ValiError);
  });

  test("shift is not a boolean", () => {
    expect(() =>
      loadJsonKeyboardLayout({
        name: "test",
        entries: [{ output: "a", input: { key: "A", shift: "yes" } }],
      }),
    ).toThrow(v.ValiError);
  });

  test("unknown virtual key", () => {
    expect(() =>
      loadJsonKeyboardLayout({
        name: "test",
        entries: [{ output: "a", input: { key: "InvalidKey", shift: false } }],
      }),
    ).toThrow(v.ValiError);
  });

  test("JSON string with invalid data", () => {
    expect(() => loadJsonKeyboardLayout('{"name": 123}')).toThrow(v.ValiError);
  });
});
