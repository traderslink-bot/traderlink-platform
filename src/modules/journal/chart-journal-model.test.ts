import { describe, expect, it } from "vitest";
import { chartJournalFocusBounds, chartJournalLocalTime, makeJournalMarkers } from "@/app/(dashboard)/charts/chart-journal-model";

describe("Chart Journal candle markers", () => {
  it("groups fills of the same side and leaves their original prices to the Journal", () => {
    const time = Date.parse("2026-11-13T18:00:00Z") / 1000;
    const { markers, buckets } = makeJournalMarkers([
      { time: time + 21, id: "buy-1", kind: "buy" },
      { time: time + 62, id: "buy-2", kind: "buy" },
      { time: time + 111, id: "sell", kind: "sell" },
      { time: time + 180, id: "note", kind: "note" },
      { time: time + 360, id: "outside", kind: "note" },
    ], { timeframe: "5m", regularOnly: false, sortedCandles: [{ time }], hasCandle: (timestamp) => timestamp === time }, () => true);
    expect(markers).toHaveLength(3);
    expect(markers[0]).toMatchObject({ time, shape: "arrowUp", position: "belowBar", text: "2" });
    expect(buckets.get(markers[0].id!)?.ids).toEqual(["buy-1", "buy-2"]);
    expect(markers[1]).toMatchObject({ time, shape: "arrowDown" });
    expect(markers[2]).toMatchObject({ time, shape: "circle" });
  });

  it("uses the actual daily candle for that Eastern date and leaves missing dates unplotted", () => {
    const friday = Date.parse("2026-11-13T14:30:00Z") / 1000;
    const monday = Date.parse("2026-11-16T05:00:00Z") / 1000;
    const fridayFill = Date.parse("2026-11-13T19:20:07.140Z") / 1000;
    const saturdayPin = Date.parse("2026-11-15T02:08:20Z") / 1000;
    const { markers, buckets } = makeJournalMarkers([
      { time: fridayFill, id: "sell", kind: "sell" },
      { time: saturdayPin, id: "closed-session", kind: "note" },
      { time: monday + 46000, id: "buy", kind: "buy" },
    ], { timeframe: "1D", regularOnly: false, sortedCandles: [{ time: friday }, { time: monday }],
      hasCandle: (time) => time === friday || time === monday }, () => true);
    expect(markers.map(marker => marker.time)).toEqual([friday, monday]);
    expect([...buckets.values()].flatMap(bucket => bucket.ids)).toEqual(["sell", "buy"]);
  });

  it("uses the full Eastern trading date on both clock-change weekends when focusing a daily chart", () => {
    for (const [fill, start, next] of [
      ["2026-03-08T17:00:00Z", "2026-03-08T05:00:00Z", "2026-03-09T04:00:00Z"],
      ["2026-11-01T17:00:00Z", "2026-11-01T04:00:00Z", "2026-11-02T05:00:00Z"],
    ]) {
      const time = Date.parse(fill) / 1000;
      expect(chartJournalFocusBounds(time, time, "1D", false)).toEqual({
        first: Date.parse(start) / 1000,
        last: Date.parse(next) / 1000 - 1,
      });
    }
  });

  it.each([
    ["1W", "2026-10-30T19:50:00Z", "2026-11-02T14:35:00Z", "2026-10-26T04:00:00Z", "2026-11-02T05:00:00Z"],
    ["1M", "2026-10-30T19:50:00Z", "2026-11-02T14:35:00Z", "2026-10-01T04:00:00Z", "2026-11-01T04:00:00Z"],
    ["1Y", "2025-12-31T19:50:00Z", "2026-01-02T14:35:00Z", "2025-01-01T05:00:00Z", "2026-01-01T05:00:00Z"],
  ] as const)("keeps both %s fill markers and Fit trade endpoints on their calendar candles", (timeframe, entry, exit, left, right) => {
    const seconds = (value: string) => Date.parse(value) / 1000;
    const from = seconds(entry), to = seconds(exit), first = seconds(left), last = seconds(right);
    const result = makeJournalMarkers([
      { time: from, id: "entry", kind: "buy" },
      { time: from + 1.2, id: "add", kind: "buy" },
      { time: to, id: "exit", kind: "sell" },
    ], { timeframe, regularOnly: false, sortedCandles: [{ time: first }, { time: last }],
      hasCandle: (time) => time === first || time === last }, () => true);
    expect(chartJournalFocusBounds(from, to, timeframe, false)).toEqual({ first, last });
    expect(result.markers.map(marker => marker.time)).toEqual([first, last]);
    expect([...result.buckets.values()].map(bucket => bucket.ids)).toEqual([["entry", "add"], ["exit"]]);
  });

  it("formats the draft using the selected account timezone and keeps seconds", () => {
    const time = Date.parse("2026-11-13T02:21:37Z") / 1000;
    expect(chartJournalLocalTime(time, "America/New_York")).toEqual({ date: "2026-11-12", time: "21:21:37" });
    expect(chartJournalLocalTime(time, "UTC")).toEqual({ date: "2026-11-13", time: "02:21:37" });
  });
});
