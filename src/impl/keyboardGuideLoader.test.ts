import * as v from "valibot";
import { describe, expect, test } from "vitest";
import { loadJsonKeyboardGuide } from "./keyboardGuideLoader";

test("valid keyboard guide", () => {
  const guide = loadJsonKeyboardGuide({
    name: "test",
    physicalLayout: "jis_106",
    entries: [
      {
        key: "A",
        labels: [{ position: "center", label: "a" }],
      },
    ],
  });
  expect(guide.guideData.name).toBe("test");
});

describe("validation errors", () => {
  test("name is missing", () => {
    expect(() =>
      loadJsonKeyboardGuide({
        physicalLayout: "jis_106",
        entries: [],
      }),
    ).toThrow(v.ValiError);
  });

  test("invalid position", () => {
    expect(() =>
      loadJsonKeyboardGuide({
        name: "test",
        physicalLayout: "jis_106",
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
        name: "test",
        physicalLayout: "jis_106",
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
    expect(() => loadJsonKeyboardGuide('{"name": 123}')).toThrow(v.ValiError);
  });
});
