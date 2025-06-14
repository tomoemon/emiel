import { expect, test } from "vitest";
import { product } from "./itertools";

test("empty", () => {
  const result = Array.from(product([]));
  expect(result).toEqual([[]]);
});

test("1 element 1 item", () => {
  const result = Array.from(product([[1]]));
  expect(result).toEqual([[1]]);
});

test("1 element 2 item", () => {
  const result = Array.from(product([[1, 2]]));
  expect(result).toEqual([[1], [2]]);
});

test("2 element 1 item", () => {
  const result = Array.from(product([[1], [2]]));
  expect(result).toEqual([[1, 2]]);
});

test("2 element 2 item", () => {
  const result = Array.from(
    product([
      [1, 2],
      [3, 4],
    ]),
  );
  expect(result).toEqual([
    [1, 3],
    [1, 4],
    [2, 3],
    [2, 4],
  ]);
});
