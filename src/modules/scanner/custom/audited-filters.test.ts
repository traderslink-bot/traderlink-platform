import { expect, it, vi } from "vitest";
import { CustomScanMarket } from "./market";
import {
  EMPTY_SCAN,
  parseScanDefinition,
  type ScanMarketRow,
} from "./definition";
import { candleStudyValue } from "./candle-study-values";
import { ArchiveStudies } from "./archive-studies";
import {
  applyAlpacaTrade,
  type AlpacaSessionState,
} from "../alpaca/session-book";
import type { ScanPressRelease } from "./signal-filters";

const at = Date.parse("2026-11-19T15:01:05Z"),
  close = at - 5000,
  start = close - 60000;
const row = (
  symbol: string,
  extra: Partial<ScanMarketRow> = {},
): ScanMarketRow => ({
  symbol,
  session: "regular",
  exchange: "NASDAQ",
  price: 0.6,
  observedAt: at,
  priceSourceAt: at,
  volume: 4000,
  dollarVolume: 2400,
  marketCap: 12000000,
  float: 800000,
  dayChange: 60,
  belowHigh: 0,
  ...extra,
});
const scan = (metric: string, extra: Record<string, unknown> = {}) => ({
  key: "main",
  page: 1,
  definition: parseScanDefinition({
    ...EMPTY_SCAN,
    rules: [{ metric, minimum: null, maximum: 5, ...extra }],
  }),
});
const article = (id: string, time: number, title = id): ScanPressRelease => ({
  id,
  at: time,
  title,
  url: "https://test.invalid/" + id,
});
it("orders PR publication and trade resumption against the actual candle and handles unavailable evidence", () => {
  const market = new CustomScanMarket({
    attach: () => () => {},
    observe: () => {},
    indicator: () => undefined,
    pressRelease: () => undefined,
    lastMinute: (symbol) => ({
      start,
      close: 0.6,
      previous: 0.45,
      vwapCross: symbol === "WEAK" ? null : close,
      relativeVolume: symbol === "WEAK" ? 1 : 2,
    }),
  });
  market.set("open", at, "regular", [
    row("FAST", { halted: false, tradeResumedAt: close - 300000 }),
    row("REVERSE", { halted: false, tradeResumedAt: close + 1 }),
    row("EQUAL", { halted: false, tradeResumedAt: close }),
    row("MIDBAR", { halted: false, tradeResumedAt: start + 1 }),
    row("OLD", { halted: false, tradeResumedAt: close - 300001 }),
    row("WEAK", { halted: false, tradeResumedAt: start }),
    row("UNKNOWN"),
  ]);
  const history = new Map([
    [
      "FAST",
      [
        article("later", close + 1),
        article("original", close - 300000, "FDA clearance"),
      ],
    ],
    ["REVERSE", [article("after", close + 1)]],
    ["EQUAL", [article("tie", close)]],
    ["OLD", [article("old", close - 300001)]],
    ["WEAK", [article("early", start)]],
  ]);
  const news = () => ({
    releases: new Map([...history].map(([key, items]) => [key, items[0]])),
    history,
  });
  expect(market.query(scan("prThenVwap"), news)).toMatchObject({
    total: 1,
    rows: [
      { symbol: "FAST", matches: [close], pressRelease: { id: "original" } },
    ],
  });
  expect(market.query(scan("prThenVwap"), () => undefined)).toMatchObject({
    total: 0,
    incomplete: 7,
  });
  expect(
    market.query(
      scan("prHeadline", { maximum: null, selection: ["FDA"] }),
      news,
    ),
  ).toMatchObject({ total: 1, rows: [{ pressRelease: { id: "original" } }] });
  expect(market.query(scan("resumeThenVolume"))).toMatchObject({
    total: 1,
    incomplete: 1,
    rows: [{ symbol: "FAST" }],
  });
});
it("shares one archive read for simultaneous study definitions and requires the current split basis", async () => {
  const bars = Array.from({ length: 64 }, (_, i) => ({
    time: Math.floor(at / 1000) - (64 - i) * 86400,
    open: i + 1,
    close: i + 1,
    low: i + 1,
    high: i + 1,
    volume: 5,
  }));
  const read = vi.fn(
    async (
      query: Parameters<ConstructorParameters<typeof ArchiveStudies>[0]>[0],
    ) => ({
      ...query,
      state: "ready" as const,
      bars,
      basisDate: "2026-11-19",
    }),
  );
  const changed = vi.fn();
  const cache = new ArchiveStudies(read, changed);
  expect(cache.value("FAST", "1D", "smaDistance", 50, at)).toBeNull();
  expect(cache.value("FAST", "1D", "volumeWindowSum", 5, at)).toBeNull();
  await vi.waitFor(() => expect(changed).toHaveBeenCalled());
  expect(cache.value("FAST", "1D", "smaDistance", 50, at)).toBeCloseTo(
    (64 / 39.5 - 1) * 100,
  );
  expect(cache.value("FAST", "1D", "volumeWindowSum", 5, at)).toBe(25);
  expect(read).toHaveBeenCalledTimes(1);
  expect(candleStudyValue("betaSpy", bars, 20, bars)).toBeCloseTo(1);
  expect(candleStudyValue("returnVsSpy", bars, 20, bars)).toBe(0);
  expect(candleStudyValue("betaSpy", bars, 20, bars.slice(0, -1))).toBeNull();
});
it("computes the print maxima from eligible trades", () => {
  const total = {
    volume: 0,
    dollarVolume: 0,
    high: null,
    low: null,
    price: null,
    providerAt: null,
  };
  const state: AlpacaSessionState = {
    date: "2026-11-19",
    regularClose: 960,
    complete: true,
    sessions: {
      premarket: { ...total },
      regular: { ...total },
      after_hours: { ...total },
    },
  };
  for (const [shares, price] of [
    [1000, 0.3],
    [800, 0.5],
  ])
    applyAlpacaTrade(state, {
      S: "FAST",
      p: price,
      s: shares,
      t: "2026-11-19T15:00:00Z",
      i: shares,
      x: "Q",
      c: [],
      z: "C",
    });
  expect(state.sessions.regular).toMatchObject({
    largestTradeShares: 1000,
    largestTradeDollars: 400,
  });
});
