import { expect, test } from "vitest";
import { setDefault, setDefaultFunc } from "./map";

test("test setDefault", () => {
  const m = new Map<string, string>();
  const result1 = setDefault(m, "a", "A");
  expect(result1).toBe("A");
  expect(m.size).toBe(1);
  expect(m.get("a")).toBe("A");

  const result2 = setDefault(m, "a", "B");
  expect(result2).toBe("A");
  expect(m.size).toBe(1);
  expect(m.get("a")).toBe("A");
});

test("test setDefault with calling side effect func", () => {
  const m = new Map<string, string>();

  let called = 0;
  function sideEffect(v: string) {
    called++;
    return v;
  }
  const result1 = setDefault(m, "a", sideEffect("A"));
  expect(called).toBe(1);
  expect(result1).toBe("A");
  expect(m.size).toBe(1);
  expect(m.get("a")).toBe("A");

  const result2 = setDefault(m, "a", sideEffect("B"));
  expect(called).toBe(2);
  expect(result2).toBe("A");
  expect(m.size).toBe(1);
  expect(m.get("a")).toBe("A");
});

test("test setDefaultFunc", () => {
  const m = new Map<string, string>();
  const result1 = setDefaultFunc(m, "a", () => "A");
  expect(result1).toBe("A");
  expect(m.size).toBe(1);
  expect(m.get("a")).toBe("A");

  const result2 = setDefaultFunc(m, "a", () => "B");
  expect(result2).toBe("A");
  expect(m.size).toBe(1);
  expect(m.get("a")).toBe("A");
});

test("test setDefaultFunc with calling side effect func", () => {
  const m = new Map<string, string>();
  let called = 0;
  function sideEffect(v: string) {
    return () => {
      called++;
      return v;
    };
  }
  const result1 = setDefaultFunc(m, "a", sideEffect("A"));
  expect(called).toBe(1);
  expect(result1).toBe("A");
  expect(m.size).toBe(1);
  expect(m.get("a")).toBe("A");

  const result2 = setDefaultFunc(m, "a", sideEffect("B"));
  expect(called).toBe(1);
  expect(result2).toBe("A");
  expect(m.size).toBe(1);
  expect(m.get("a")).toBe("A");
});
