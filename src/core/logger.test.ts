import { beforeEach, expect, test, vi } from "vitest";
import { type LogRecord, logging } from "./logger";

beforeEach(() => {
  logging.disableAll();
  logging.resetHandler();
});

test("getLogger returns the same instance for the same label", () => {
  const a = logging.getLogger("automaton.input");
  const b = logging.getLogger("automaton.input");
  expect(a).toBe(b);
});

test("logger is disabled by default", () => {
  const log = logging.getLogger("automaton.input");
  expect(log.enabled).toBe(false);
  const handler = vi.fn();
  logging.setHandler(handler);
  log.log("msg");
  expect(handler).not.toHaveBeenCalled();
});

test("enable with exact match activates only that label", () => {
  const input = logging.getLogger("automaton.input");
  const back = logging.getLogger("automaton.back");
  logging.enable("automaton.input");
  expect(input.enabled).toBe(true);
  expect(back.enabled).toBe(false);
});

test("enable with wildcard activates matching labels", () => {
  const input = logging.getLogger("automaton.input");
  const back = logging.getLogger("automaton.back");
  const build = logging.getLogger("builder.build");
  logging.enable("automaton.*");
  expect(input.enabled).toBe(true);
  expect(back.enabled).toBe(true);
  expect(build.enabled).toBe(false);
});

test("enable('*') activates all labels", () => {
  const a = logging.getLogger("a");
  const b = logging.getLogger("b.c");
  logging.enable("*");
  expect(a.enabled).toBe(true);
  expect(b.enabled).toBe(true);
});

test("enabled state updates for loggers created after enable", () => {
  logging.enable("automaton.*");
  const log = logging.getLogger("automaton.input");
  expect(log.enabled).toBe(true);
});

test("disable removes a previously enabled pattern", () => {
  const log = logging.getLogger("automaton.input");
  logging.enable("automaton.*");
  expect(log.enabled).toBe(true);
  logging.disable("automaton.*");
  expect(log.enabled).toBe(false);
});

test("multiple patterns are combined with OR", () => {
  const input = logging.getLogger("automaton.input");
  const build = logging.getLogger("builder.build");
  const other = logging.getLogger("loader.json");
  logging.enable("automaton.input");
  logging.enable("builder.*");
  expect(input.enabled).toBe(true);
  expect(build.enabled).toBe(true);
  expect(other.enabled).toBe(false);
});

test("enable accepts multiple patterns as varargs", () => {
  const a = logging.getLogger("a");
  const b = logging.getLogger("b");
  const c = logging.getLogger("c");
  logging.enable("a", "b");
  expect(a.enabled).toBe(true);
  expect(b.enabled).toBe(true);
  expect(c.enabled).toBe(false);
});

test("disable accepts multiple patterns as varargs", () => {
  const a = logging.getLogger("a");
  const b = logging.getLogger("b");
  logging.enable("a", "b");
  logging.disable("a", "b");
  expect(a.enabled).toBe(false);
  expect(b.enabled).toBe(false);
});

test("disableAll clears all active patterns", () => {
  const a = logging.getLogger("a");
  const b = logging.getLogger("b");
  logging.enable("a", "b");
  logging.disableAll();
  expect(a.enabled).toBe(false);
  expect(b.enabled).toBe(false);
});

test("handler receives a LogRecord when the logger is enabled", () => {
  const records: LogRecord[] = [];
  logging.setHandler((r) => records.push(r));
  const log = logging.getLogger("automaton.input");
  logging.enable("automaton.input");
  log.log("hello", 42, { foo: "bar" });
  expect(records).toHaveLength(1);
  expect(records[0].label).toBe("automaton.input");
  expect(records[0].args).toEqual(["hello", 42, { foo: "bar" }]);
  expect(typeof records[0].timestamp).toBe("number");
});

test("resetHandler restores the default handler", () => {
  const customHandler = vi.fn();
  logging.setHandler(customHandler);
  logging.resetHandler();
  const log = logging.getLogger("automaton.input");
  logging.enable("automaton.input");
  log.log("msg");
  expect(customHandler).not.toHaveBeenCalled();
});

test("exact label pattern does not match sub-labels", () => {
  const a = logging.getLogger("automaton");
  const b = logging.getLogger("automaton.input");
  logging.enable("automaton");
  expect(a.enabled).toBe(true);
  expect(b.enabled).toBe(false);
});
