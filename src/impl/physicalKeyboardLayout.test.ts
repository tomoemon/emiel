import * as v from "valibot";
import { describe, expect, test } from "vitest";
import { loadJsonPhysicalKeyboardLayout } from "./physicalKeyboardLayout";

test("valid physical keyboard layout", () => {
  const layout = loadJsonPhysicalKeyboardLayout({
    keys: [["A", "S"], ["Space"]],
    leftMargins: [0, 1.5],
    keyWidth: { Space: 4.0 },
  });
  expect(layout.keys).toHaveLength(2);
  expect(layout.keys[0]).toEqual(["A", "S"]);
  expect(layout.keyWidth.Space).toBe(4.0);
});

test("loads from JSON string", () => {
  const layout = loadJsonPhysicalKeyboardLayout(
    '{"keys": [["A"]], "leftMargins": [0], "keyWidth": {}}',
  );
  expect(layout.keys[0][0]).toBe("A");
});

describe("validation errors", () => {
  test("keys is missing", () => {
    expect(() => loadJsonPhysicalKeyboardLayout({ leftMargins: [], keyWidth: {} })).toThrow(
      v.ValiError,
    );
  });

  test("leftMargins is missing", () => {
    expect(() => loadJsonPhysicalKeyboardLayout({ keys: [], keyWidth: {} })).toThrow(v.ValiError);
  });

  test("unknown virtual key in keys", () => {
    expect(() =>
      loadJsonPhysicalKeyboardLayout({
        keys: [["InvalidKey"]],
        leftMargins: [0],
        keyWidth: {},
      }),
    ).toThrow(v.ValiError);
  });

  test("unknown virtual key in keyWidth", () => {
    expect(() =>
      loadJsonPhysicalKeyboardLayout({
        keys: [],
        leftMargins: [],
        keyWidth: { InvalidKey: 2.0 },
      }),
    ).toThrow(v.ValiError);
  });

  test("non-number leftMargin", () => {
    expect(() =>
      loadJsonPhysicalKeyboardLayout({
        keys: [],
        leftMargins: ["zero"],
        keyWidth: {},
      }),
    ).toThrow(v.ValiError);
  });
});
