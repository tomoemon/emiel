import * as v from "valibot";
import { describe, expect, test } from "vitest";
import { loadJsonKeyboardGuide } from "./keyboardGuideLoader";

test("valid keyboard guide", () => {
  const guide = loadJsonKeyboardGuide({
    entries: [
      {
        key: "A",
        labels: [{ position: "center", label: "a" }],
      },
    ],
  });
  expect(guide.guideData.entries).toHaveLength(1);
  expect(guide.guideData.entries[0].labels[0].label).toBe("a");
});

describe("validation errors", () => {
  test("entries is missing", () => {
    expect(() => loadJsonKeyboardGuide({})).toThrow(v.ValiError);
  });

  test("invalid position", () => {
    expect(() =>
      loadJsonKeyboardGuide({
        entries: [
          {
            key: "A",
            labels: [{ position: "invalid", label: "a" }],
          },
        ],
      }),
    ).toThrow(v.ValiError);
  });

  test("unknown virtual key", () => {
    expect(() =>
      loadJsonKeyboardGuide({
        entries: [
          {
            key: "InvalidKey",
            labels: [{ position: "center", label: "a" }],
          },
        ],
      }),
    ).toThrow(v.ValiError);
  });

  test("JSON string with invalid data", () => {
    expect(() => loadJsonKeyboardGuide('{"entries": 123}')).toThrow(v.ValiError);
  });
});
