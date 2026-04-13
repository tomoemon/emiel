import * as v from "valibot";
import { describe, expect, test } from "vitest";
import { loadJsonKeyboardLayout } from "./keyboardLayoutLoader";

test("valid keyboard layout with metadata", () => {
  const layout = loadJsonKeyboardLayout({
    metadata: { name: "test", url: "https://example.com" },
    entries: [{ output: "a", input: { key: "A", shift: false } }],
  });
  expect(layout.metadata.name).toBe("test");
  expect(layout.metadata.url).toBe("https://example.com");
});

test("metadata is optional", () => {
  const layout = loadJsonKeyboardLayout({
    entries: [{ output: "a", input: { key: "A", shift: false } }],
  });
  expect(layout.metadata.name).toBe("");
  expect(layout.metadata.url).toBe("");
});

describe("validation errors", () => {
  test("entries is missing", () => {
    expect(() => loadJsonKeyboardLayout({ metadata: { name: "test" } })).toThrow(v.ValiError);
  });

  test("shift is not a boolean", () => {
    expect(() =>
      loadJsonKeyboardLayout({
        entries: [{ output: "a", input: { key: "A", shift: "yes" } }],
      }),
    ).toThrow(v.ValiError);
  });

  test("unknown virtual key", () => {
    expect(() =>
      loadJsonKeyboardLayout({
        entries: [{ output: "a", input: { key: "InvalidKey", shift: false } }],
      }),
    ).toThrow(v.ValiError);
  });

  test("JSON string with invalid data", () => {
    expect(() => loadJsonKeyboardLayout('{"metadata": {"name": 123}}')).toThrow(v.ValiError);
  });
});
