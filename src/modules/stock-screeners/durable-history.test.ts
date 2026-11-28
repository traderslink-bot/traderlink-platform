// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { easternDayStart } from "../scanner/alpaca/candles";
import type { ChartMarketSession } from "../scanner/alpaca/chart-calendar";
import { collectMarketPack, type BarCache } from "./collect-market";
import { querySnapshot } from "./query";
import { DEFAULT_DEFINITION } from "./contracts";
import type { CorrectionHistoryRequest, ScreenerCorrections, ScreenerRevisionManifest } from "./trade-corrections";

const now = Date.parse("2026-11-27T16:01:00Z"), basisDate = "2026-11-27";
const old = Date.parse("2026-11-13T14:30:00Z"), current = Date.parse("2026-11-27T14:30:00Z");
const manifest: ScreenerRevisionManifest = { feed: "sip", generation: 10,
  symbols: { POM: { minutes: [old / 1000, current / 1000], pending: false, revision: "c".repeat(64) } } };
function calendar(): ChartMarketSession[] {
  const days: ChartMarketSession[] = [];
  for (let at = Date.parse("2025-05-01T12:00:00Z"); at <= Date.parse("2026-11-30T12:00:00Z"); at += 86_400_000) {
    const date = new Date(at), key = date.toISOString().slice(0, 10);
    if (date.getUTCDay() % 6 && key !== "2026-11-26") days.push({ date: key, open: "09:30", close: key === basisDate ? "13:00" : "16:00" });
  }
  return days;
}
const raw = (time: number, price: number, volume: number) => ({ t: new Date(time).toISOString(), o: price, h: price, l: price, c: price, v: volume, vw: price });
afterEach(() => { vi.useRealTimers(); });

it.each([false, true])("repairs old 15m materialized history and current opening range while isolating unsupported daily facts, baseline failure=%s", async baselineFailure => {
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(now);
  const days = calendar(), cache: BarCache = { key: "", daily: new Map(), intraday: new Map() };
  let corrected = false;
  const revisions = vi.fn<ScreenerCorrections["revisions"]>(async () => corrected ? manifest : { feed: "sip", generation: 0, symbols: {} });
  const history = vi.fn(async (request: CorrectionHistoryRequest) => ({ symbol: request.symbol, feed: "sip", adjustment: "split", basisDate,
    complete: !(baselineFailure && request.timeframe === "15Min"), nextPageToken: null,
    bars: [{ time: request.start / 1000, open: 7, high: 7.41, low: 6, close: 7, volume: request.timeframe === "15Min" ? 500 : 1000 }] }));
  const get = vi.fn(async (_path: string, params: URLSearchParams) => {
    const from = Date.parse(params.get("start")!), until = Date.parse(params.get("end")!), frame = params.get("timeframe");
    return { bars: Object.fromEntries(params.get("symbols")!.split(",").map(symbol => {
      const bars = frame === "1Day" ? days.map(day => raw(easternDayStart(Date.parse(day.date + "T12:00:00Z") / 1000) * 1000,
        symbol === "POM" && day.date === "2026-11-13" ? 38 : 10, 10000))
        : frame === "15Min" ? days.map(day => raw(Date.parse(day.date + "T14:30:00Z"), 10, symbol === "POM" && day.date === "2026-11-13" ? 10000 : 1000))
          : [raw(Date.parse("2026-11-25T14:30:00Z"), 10, 1000), raw(current, 38, 2000), raw(current + 5 * 60_000, 6, 1000)];
      return [symbol, bars.filter(bar => Date.parse(bar.t) >= from && Date.parse(bar.t) <= until)];
    })), next_page_token: null };
  });
  const collect = () => collectMarketPack({ now, data: { get }, calendar: days,
    calendarRange: { start: "2025-05-01", end: "2026-11-30" }, universeDate: basisDate, cache,
    stocks: ["POM", "PEER"].map(symbol => ({ symbol, name: symbol, exchange: "NASDAQ", marketCap: 20000000 })),
    corrections: { revisions, history } });
  const before = await collect();
  const original = before.snapshots.regular.rows.find(row => row.symbol === "POM")!;
  expect(original.values.sma20).toBeGreaterThan(10);
  expect(original.values.or5High).toBe(38);
  corrected = true;
  const after = await collect(), pom = after.snapshots.regular.rows.find(row => row.symbol === "POM")!, peer = after.snapshots.regular.rows.find(row => row.symbol === "PEER")!;
  expect(revisions.mock.calls.every(([request]) => request.end - request.start > 400 * 86_400_000)).toBe(true);
  expect(history.mock.calls.map(([request]) => request.timeframe).sort()).toEqual(["15Min", "5Min"]);
  expect(pom.values).toMatchObject({ price: 6, high: 7.41, or5High: 7.41, volume: 2000 });
  expect(pom.values.sma20).toBeUndefined();
  expect(peer.values).toMatchObject({ price: 6, high: 38, sma20: 10, relativeVolume: 3 });
  expect(after.snapshots.regular.partial).toBe(true);
  if (baselineFailure) expect(pom.values.relativeVolume).toBeUndefined();
  else expect(pom.values.relativeVolume).toBeCloseTo(2000 / 950);
  const screened = querySnapshot(after.snapshots.regular, { ...DEFAULT_DEFINITION, rules: [{ metric: "or5High", operator: "lt", value: 8 }] });
  expect(screened.rows.map(row => row.symbol)).toEqual(["POM"]);
  expect(after.correctionGeneration).toBe(10);
  expect(after.correctionRevision).not.toBe(before.correctionRevision);
  const again = await collect();
  expect(again.snapshots.regular.rows.find(row => row.symbol === "POM")!.values.sma20).toBeUndefined();
  expect(again.snapshots.regular.partial).toBe(true);
  expect(again.correctionRevision).toBe(after.correctionRevision);
  if (!baselineFailure) {
    const next = { ...manifest, generation: 11, symbols: { POM: { ...manifest.symbols.POM!, revision: "d".repeat(64) } } };
    revisions.mockResolvedValueOnce(manifest).mockResolvedValue(next);
    const raced = await collect();
    expect(raced.snapshots.regular.rows.find(row => row.symbol === "POM")!.values.price).toBeUndefined();
    expect(raced.snapshots.regular.rows.find(row => row.symbol === "PEER")!.values.price).toBe(6);
    expect(raced.correctionGeneration).toBe(11);
    expect(raced.correctionRevision).not.toBe(again.correctionRevision);
    expect((await collect()).snapshots.regular.rows.find(row => row.symbol === "POM")!.values.high).toBe(7.41);
  }
});
