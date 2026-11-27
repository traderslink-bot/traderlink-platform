// @vitest-environment node
import { expect, it, vi } from "vitest";
import { ChartVolumeProfiles } from "@/app/(dashboard)/charts/chart-volume-profile";
import { chartPageCoverageStart, profileWindowsWithinCoverage, sessionProfileWindows } from "./chart-advanced-context";
import type { DisplayCandle } from "./candles";
import { ChartCalculationHistory } from "./chart-calculation-history";
import { ChartSessionCalendar } from "./chart-calendar";
import { CHART_HISTORY_FLOOR, chartHistoryPage } from "./chart-history";

const date = "2026-11-19";
const at = (clock: string) => Date.parse(`${date}T${clock}:00-05:00`) / 1000;
const raw = (clock: string, price: number, volume: number): DisplayCandle => ({
  time: at(clock), open: price, close: price, low: price, high: price, volume, carried: false,
});

it("profiles a fully covered but sparse session when its first real trade comes after the open", () => {
  const bars = [raw("10:37", 0.41, 128), raw("13:02", 0.45, 92)];
  const calendar = new ChartSessionCalendar();
  calendar.merge({ available: true, start: date, end: date, sessions: [{ date, open: "09:30", close: "16:00" }] });
  const window = { start: bars[0].time, end: bars[1].time + 60, firstTime: bars[0].time, lastTime: bars[1].time };
  const sessions = { premarket: false, regular: true, postmarket: false };
  const windows = sessionProfileWindows(bars, window, "1m", sessions, calendar);
  expect(windows[0]?.start).toBe(at("09:30"));

  const covered = chartHistoryPage(bars, { start: at("00:00") * 1000, end: at("20:00") * 1000, initial: false }, false);
  const complete = profileWindowsWithinCoverage(windows, chartPageCoverageStart(covered.nextBefore));
  const profile = new ChartVolumeProfiles(price => price, "SessionVolumeProfile");
  expect(profile.update(complete, bars, { rows: 24, valueAreaPercent: 70, color: "#123456" })[0]?.total).toBe(220);
  expect(profileWindowsWithinCoverage(windows, at("10:00"))).toEqual([]);
  expect(profileWindowsWithinCoverage(windows, chartPageCoverageStart(undefined))).toEqual([]);
});

it("uses the accepted provider cursor instead of requesting older data for a covered sparse window", async () => {
  const bars = [raw("10:37", 0.42, 120)];
  const page = chartHistoryPage(bars, { start: at("00:00") * 1000, end: at("20:00") * 1000, initial: false }, false);
  const fetchPage = vi.fn(async () => Response.json({ ...page, basisDate: date }));
  const loader = new ChartCalculationHistory("VIVS", new AbortController().signal, () => date, fetchPage);

  const history = await loader.read("1m", at("09:30"), undefined, "covered");
  expect(history.coveredFrom).toBe(at("00:00"));
  expect(history.bars.map(bar => bar.time)).toEqual([at("10:37")]);
  await loader.read("5m", at("09:00"), undefined, "covered");
  expect(fetchPage).toHaveBeenCalledTimes(1);
  expect(chartPageCoverageStart(null)).toBe(CHART_HISTORY_FLOOR / 1000);
  expect(chartPageCoverageStart(1.5)).toBe(Infinity);
});
