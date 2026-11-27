// @vitest-environment node
import { expect, it } from "vitest";
import { completedSwingBars, pivotHistoryStart, sessionProfileWindows, standardPivotLevels, visibleProfileWindow } from "./chart-advanced-context";
import { ChartSessionCalendar } from "./chart-calendar";
import { futureCalculationAxis } from "./chart-calculation-intervals";
import { easternDayStart, type DisplayCandle } from "./candles";

const stamp = (date: string, utc = "12:00") => Date.parse(`${date}T${utc}:00Z`) / 1000;
const day = (date: string) => easternDayStart(stamp(date));
const candle = (time: number, close = 2): DisplayCandle => ({
  time, open: close, high: close + 1, low: close - 1, close, volume: 100, carried: false,
});
const calendar = new ChartSessionCalendar();
calendar.merge({ available: true, start: "2026-10-01", end: "2026-11-30",
  sessions: ["2026-10-01", "2026-10-30", "2026-11-02", "2026-11-25", "2026-11-27", "2026-11-30"].map(date =>
    ({ date, open: "09:30", close: date.endsWith("-27") ? "13:00" : "16:00" })),
});
const regular = { premarket: false, regular: true, postmarket: false };

it("uses the prior known session across a holiday and skips missing prior daily facts", () => {
  const axis = [candle(stamp("2026-11-27", "15:00")), candle(stamp("2026-11-30", "15:00"))];
  const prior = candle(day("2026-11-25"), 3);
  expect(pivotHistoryStart(axis[0].time, "15m", calendar)).toBe(prior.time);
  expect(standardPivotLevels(axis, [prior, candle(day("2026-11-30"), 9)], "15m", calendar)).toEqual([
    { time: axis[0].time, high: 4, low: 2, close: 3 },
  ]);
});

it("only applies completed underlying calendar periods", () => {
  const daily = [candle(day("2026-10-01"), 4), candle(day("2026-10-30"), 2), candle(day("2026-11-02"), 9)];
  expect(standardPivotLevels(daily, daily, "1D", calendar)).toEqual([
    { time: day("2026-11-02"), high: 5, low: 1, close: 2 },
  ]);
  expect(standardPivotLevels(daily, daily.slice(1), "1D", calendar)).toEqual([]);
});

it("matches profile windows to visible candles, complete sessions and early closes", () => {
  const axis = [candle(stamp("2026-11-25", "14:30")), candle(stamp("2026-11-25", "15:00")),
    candle(stamp("2026-11-27", "14:30")), candle(stamp("2026-11-27", "15:00"))];
  const window = visibleProfileWindow(axis, { from: 1, to: 3 }, "30m")!;
  expect(window).toEqual({ start: axis[1].time, firstTime: axis[1].time, lastTime: axis[3].time, end: axis[3].time + 1800 });
  expect(sessionProfileWindows(axis, window, "30m", regular, calendar)).toEqual([
    { start: axis[0].time, end: stamp("2026-11-25", "21:00"), firstTime: axis[0].time, lastTime: axis[1].time },
    { start: axis[2].time, end: stamp("2026-11-27", "18:00"), firstTime: axis[2].time, lastTime: axis[3].time },
  ]);
  const days = [candle(day("2026-10-30")), candle(day("2026-11-02"))];
  const months = sessionProfileWindows(days, visibleProfileWindow(days, { from: 0, to: 1 }, "1D")!, "1D", regular, calendar);
  expect(months.map(({ start, end }) => [start, end])).toEqual([
    [day("2026-10-01"), day("2026-11-01")],
    [day("2026-11-01"), day("2026-12-01")],
  ]);
});

it("projects only the requested verified daily slots and can keep available slots when the calendar ends", () => {
  const source = [day("2026-11-25")];
  expect(futureCalculationAxis(source, 1, "1D", regular, calendar)).toEqual([...source, day("2026-11-27")]);
  expect(futureCalculationAxis(source, 3, "1D", regular, calendar, true))
    .toEqual([...source, day("2026-11-27"), day("2026-11-30")]);
  expect(() => futureCalculationAxis(source, 3, "1D", regular, calendar)).toThrow("future_session_coverage_unavailable");
});

it("withholds the forming right-leg candle and uses an abbreviated session's real close", () => {
  const last = candle(stamp("2026-11-27", "14:30"));
  const previous = candle(stamp("2026-11-25", "18:30"));
  expect(completedSwingBars([previous, last], "4h", regular, calendar, stamp("2026-11-27", "17:55"))).toEqual([previous]);
  expect(completedSwingBars([previous, last], "4h", regular, calendar, stamp("2026-11-27", "18:00"))).toEqual([previous, last]);
});
