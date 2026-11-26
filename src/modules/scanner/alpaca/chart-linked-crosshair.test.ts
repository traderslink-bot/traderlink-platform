import { expect, it, vi } from "vitest";
import { createChartCrosshairLink, linkedCandleTime } from "./chart-linked-crosshair";

const time = (hourMinute: string) => Date.parse(`2026-11-19T${hourMinute}:00Z`) / 1_000;

it("maps 9:42 ET to the corresponding 1m, 5m, 15m and regular-session 4h candle", () => {
  expect(linkedCandleTime(time("14:42"), "1m", true)).toBe(time("14:42"));
  expect(linkedCandleTime(time("14:42"), "5m", true)).toBe(time("14:40"));
  expect(linkedCandleTime(time("14:42"), "15m", true)).toBe(time("14:30"));
  expect(linkedCandleTime(time("14:42"), "4h", true)).toBe(time("14:30"));
  expect(linkedCandleTime(time("14:42"), "1D", true)).toBe(time("05:00"));
});

it("updates sibling panes and clears only when the current source leaves", () => {
  const group = createChartCrosshairLink();
  const separate = createChartCrosshairLink();
  const one = Symbol(), five = Symbol(), fifteen = Symbol();
  const first = vi.fn(), second = vi.fn(), third = vi.fn(), unrelated = vi.fn();
  const detach = group.attach(one, first);
  group.attach(five, second);
  group.attach(fifteen, third);
  separate.attach(five, unrelated);
  group.publish(one, 20);
  group.publish(one, 20);
  group.publish(five, null);
  expect(first).not.toHaveBeenCalled();
  expect(second.mock.calls).toEqual([[20]]);
  expect(third.mock.calls).toEqual([[20]]);
  expect(unrelated).not.toHaveBeenCalled();
  detach();
  expect(second.mock.calls).toEqual([[20], [null]]);
  expect(third.mock.calls).toEqual([[20], [null]]);
});
