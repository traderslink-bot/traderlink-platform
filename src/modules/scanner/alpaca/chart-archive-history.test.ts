import { expect, it } from "vitest";
import { chartArchiveWindow, mergeChartArchivePages, parseChartArchiveWindow, readChartArchivePage } from "./chart-archive-history";
import { aggregateCandles } from "./candles";

const epoch = (date: string) => Date.parse(date) / 1000;
const now = Date.parse("2026-11-28T00:00:00Z");
const open = epoch("2026-11-27T14:30:00Z");
const end = epoch("2026-11-27T18:00:00Z");
const regular = { premarket: false, regular: true, postmarket: false };
const bar = { time: open, open: 10, high: 12, low: 9, close: 11, volume: 100 };

it("uses half-open 30m archive windows, falling back for partial buckets and mixed sessions", () => {
  const window = chartArchiveWindow(end * 1000 - 1, "30m", regular, now)!;
  expect(window).toMatchObject({ end, frame: "30m", session: "regular" });
  expect(window.start % 1800).toBe(0);
  expect(chartArchiveWindow((end + 60) * 1000 - 1, "30m", regular, now)).toBeNull();
  expect(chartArchiveWindow(end * 1000 - 1, "30m", { ...regular, premarket: true }, now)).toBeNull();
  expect(chartArchiveWindow(end * 1000 - 1, "30m", { premarket: true, regular: true, postmarket: true }, now)?.session).toBe("extended");
  expect(chartArchiveWindow(end * 1000 - 1, "1W", regular, now)).toBeNull();
  const midnight = epoch("2026-11-27T05:00:00Z");
  expect(chartArchiveWindow(midnight * 1000 - 1, "4h", regular, now)?.end)
    .toBe(epoch("2026-11-27T02:30:00Z"));
  expect(chartArchiveWindow(midnight * 1000 - 1, "1h", regular, now)?.end)
    .toBe(epoch("2026-11-27T04:30:00Z"));
  expect(parseChartArchiveWindow(new URLSearchParams({
    frame: "4h", session: "regular", start: String(open), end: String(end),
  }), now)).toBeNull();
});

it("validates complete coverage and replaces eligible overlapping bars without adding volume", () => {
  const window = { start: open, end, frame: "30m", session: "regular" } as const;
  const ready = { state: "ready", start: open, end, basisDate: "2026-11-27", bars: [{ ...bar, privateRule: "hidden" }] };
  const page = readChartArchivePage(ready, window)!;
  expect(page.bars).toStrictEqual([bar]);
  expect(readChartArchivePage({ ...ready, bars: [] }, window)?.bars).toStrictEqual([]);
  expect(readChartArchivePage({ ...ready, end: end - 1800 }, window)).toBeNull();
  expect(readChartArchivePage({ ...ready, bars: [bar, bar] }, window)).toBeNull();
  expect(readChartArchivePage({ ...ready, bars: [{ ...bar, time: end }] }, window)).toBeNull();
  expect(readChartArchivePage({ ...ready, bars: [{ ...bar, time: open + 1 }] }, window)).toBeNull();
  expect(readChartArchivePage({ state: "miss" }, window)).toBeNull();

  const completed = { ...bar, volume: 9 };
  const forming = { ...bar, time: end, volume: 8 };
  const base = aggregateCandles([completed, { ...completed, time: open + 60 }, forming], "30m", true);
  expect(base.map(row => row.volume)).toEqual([18, 8]);
  expect(mergeChartArchivePages(base, [page])).toStrictEqual([bar, forming]);
  expect(mergeChartArchivePages(base, [{ ...page, bars: [] }])).toStrictEqual([forming]);
});
