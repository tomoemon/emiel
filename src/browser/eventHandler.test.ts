import { expect, test } from "vitest";
import type { InputEvent } from "../core/inputEvent";
import { VirtualKeys } from "../core/virtualKey";
import { activate } from "./eventHandler";

function fakeTarget() {
  const listeners = new Map<string, (evt: Event) => void>();
  const target = {
    addEventListener: (type: string, fn: (evt: Event) => void) => listeners.set(type, fn),
    removeEventListener: (type: string) => listeners.delete(type),
  } as unknown as EventTarget;
  const dispatch = (type: string, code = "") =>
    listeners.get(type)?.({ code, timeStamp: 0 } as unknown as Event);
  return { target, listeners, dispatch };
}

test("Backquote はプリセット配列で使われるため VirtualKey に変換される", () => {
  const { target, dispatch } = fakeTarget();
  const events: InputEvent[] = [];
  activate(target, (e) => events.push(e));
  dispatch("keydown", "Backquote");
  expect(events.map((e) => e.input.key)).toEqual([VirtualKeys.Backquote]);
});

test("VirtualKey に対応しない code は例外を投げずに無視する", () => {
  const { target, dispatch } = fakeTarget();
  const events: InputEvent[] = [];
  activate(target, (e) => events.push(e));
  expect(() => dispatch("keydown", "ArrowLeft")).not.toThrow();
  expect(events).toEqual([]);
});

test("blur で押下中のキーがクリアされる", () => {
  const { target, dispatch } = fakeTarget();
  const events: InputEvent[] = [];
  activate(target, (e) => events.push(e));
  dispatch("keydown", "ShiftLeft");
  dispatch("blur");
  dispatch("keydown", "KeyA");
  expect(events.at(-1)?.keyboardState.downedKeys).toEqual([VirtualKeys.A]);
});

test("deactivate で blur リスナーも解除される", () => {
  const { target, listeners } = fakeTarget();
  const deactivate = activate(target, () => {});
  deactivate();
  expect(listeners.size).toBe(0);
});
