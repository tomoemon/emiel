import { expect, test } from "vitest";
import { detectKeyboardLayout } from "./osKeyboardLayout";

type DetectWindow = Parameters<typeof detectKeyboardLayout>[0];

function fakeWindow(getLayoutMap: () => Promise<Map<string, string>>): DetectWindow {
  return { navigator: { keyboard: { getLayoutMap } } } as unknown as DetectWindow;
}

const qwertyLetters = "abcdefghijklmnopqrstuvwxyz";
const colemakLetters = "abcsftdhuneimky;qprglvwxjz";

function layoutMap(bracketLeft: string, letters: string): Map<string, string> {
  const map = new Map([["BracketLeft", bracketLeft]]);
  Array.from(letters).forEach((c, i) => map.set(`Key${String.fromCharCode(65 + i)}`, c));
  return map;
}

test("getLayoutMap が reject された場合は QWERTY JIS にフォールバックする", async () => {
  const layout = await detectKeyboardLayout(
    fakeWindow(() => Promise.reject(new Error("SecurityError"))),
  );
  expect(layout.metadata.name).toBe("QWERTY JIS");
});

test("BracketLeft で JIS / US を判別する", async () => {
  const jis = await detectKeyboardLayout(
    fakeWindow(() => Promise.resolve(layoutMap("@", qwertyLetters))),
  );
  const us = await detectKeyboardLayout(
    fakeWindow(() => Promise.resolve(layoutMap("[", qwertyLetters))),
  );
  expect(jis.metadata.name).toBe("QWERTY JIS");
  expect(us.metadata.name).toBe("QWERTY US");
});

test("英字キーで Colemak を QWERTY US と区別する", async () => {
  const layout = await detectKeyboardLayout(
    fakeWindow(() => Promise.resolve(layoutMap("[", colemakLetters))),
  );
  expect(layout.metadata.name).toBe("Colemak");
});
