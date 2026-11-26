import { describe, expect, it } from "vitest";
import { replayCandles, replayDateWindow } from "./chart-bar-replay";
import { ChartSessionCalendar } from "./chart-calendar";
import { DEFAULT_CHART_PREFERENCES } from "./chart-preferences";

const time = (dateTime: string) => Date.parse(dateTime) / 1_000;
const bar = (dateTime: string, price: number) => ({
  time: time(dateTime), open: price, close: price, high: price + 0.01, low: price - 0.01, volume: 100,
});

describe("bar replay", () => {
  it("uses the Eastern date even across daylight saving changes", () => {
    expect(replayDateWindow("2026-11-01")).toEqual({
      start: time("2026-11-01T04:00:00Z"),
      end: time("2026-11-02T05:00:00Z"),
    });
    expect(() => replayDateWindow("2026-02-30")).toThrow();
  });

  it("replays only reported bars inside the selected date and sessions", () => {
    const calendar = new ChartSessionCalendar();
    calendar.merge({ available: true, start: "2026-11-19", end: "2026-11-19",
      sessions: [{ date: "2026-11-19", open: "09:30", close: "16:00" }] });
    const bars = [
      bar("2026-11-18T15:02:00Z", 0.31),
      bar("2026-11-19T14:23:00Z", 0.42),
      bar("2026-11-19T14:33:00Z", 0.51),
      bar("2026-11-19T14:42:00Z", 0.64),
      bar("2026-11-19T15:02:00Z", 0.71),
      bar("2026-11-20T15:02:00Z", 0.55),
    ];
    const preferences = { ...DEFAULT_CHART_PREFERENCES, premarket: false, postmarket: false };
    expect(replayCandles(bars, "2026-11-19", "15m", preferences, calendar)).toMatchObject([
      { time: time("2026-11-19T14:30:00Z"), open: 0.51, close: 0.64, volume: 200 },
      { time: time("2026-11-19T15:00:00Z"), open: 0.71, close: 0.71, volume: 100 },
    ]);
  });
});
