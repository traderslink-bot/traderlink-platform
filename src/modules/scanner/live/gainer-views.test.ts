import { describe, expect, it, vi } from "vitest";
import { LiveScannerEngine } from "./engine";
import { normalizeSnapshotBatch } from "./snapshots";
import { initialConfiguration } from "./settings";
import { activeSession } from "./sessions";
import { gainerViewResults, selectedGainerView } from "./gainer-view";
import { LiveScannerFeed } from "./server/live-feed";
import type { DailyUniverse, NormalizedSnapshot, ScannerReadModel, ScannerSession } from "./contracts";

const NOW = Date.parse("2026-11-02T21:35:52Z");
const universe: DailyUniverse = { version: 1, tradingDate: "2026-11-02", acceptedAtUtc: new Date(NOW).toISOString(),
  lastCollectionAtUtc: new Date(NOW).toISOString(), latestUploadCount: 1, sourceHashes: ["a".repeat(64)],
  stocks: ["PARA","INO","VCIG"].map(symbol => ({ symbol, exchange: "NASDAQ", marketCapAtCollection: 1000000 })) };
const floats = new Map(universe.stocks.map(stock => [stock.symbol,{ shares: 1000000, retrievedAtUtc: new Date(NOW).toISOString() }]));
const configuration = initialConfiguration();
const config = { ...configuration, enabled: true, gainers: { ...configuration.gainers,
  filters: { ...configuration.gainers.filters, after_hours: { ...configuration.gainers.filters.after_hours,
    minimumVolume: 0, minimumDollarVolume: 0, minimumSessionGain: 3, maximumSpreadPercent: null } } } };

// Public price fields from a real OAuth snapshot read at 21:35:51 UTC on Nov 2.
// Other required engine fields below are synthetic, not a recorded order book.
const recordedPrices = [
  { code: "US.PARA", last_price: 1.69, open_price: 2.64, prev_close_price: 3.17, after_price: 2.72 },
  { code: "US.INO", last_price: 1.89, open_price: 1.99, prev_close_price: 0.6024, after_price: 1.9185 },
  { code: "US.VCIG", last_price: 8.16, open_price: 3.39, prev_close_price: 3.0402, after_price: 7.0972 },
];
function normalized(patch: Record<string, unknown> = {}): readonly NormalizedSnapshot[] {
  return normalizeSnapshotBatch({ requestedSymbols: universe.stocks.map(stock => stock.symbol),
    session: "after_hours", tradingDate: universe.tradingDate, receivedAt: NOW,
    qualification: { sessionTimestampVerified: true, sessionCountersVerified: true,
      afterHoursRegularCloseVerified: false, priceTimeBasis: "session_observation" },
    payload: { ret_code: 0, data: { snapshot_list: recordedPrices.map(prices => ({ ...prices,
      data_date: universe.tradingDate, update_time: NOW, after_volume: 500000,
      after_turnover: 1000000, bid_price: 1, ask_price: 1.01, ...patch })) } } }).snapshots;
}
function evaluate(snapshots = normalized(), session: ScannerSession = "after_hours", chosen = config) {
  return new LiveScannerEngine().evaluate({ universe, tradingDate: universe.tradingDate, session,
    snapshots, configuration: chosen, now: NOW, floats, news: new Map() });
}
const empty = { rows: [], focus: [], total: 0 };
function model(session: ScannerSession | null, tradingDate = "2026-11-02"): ScannerReadModel {
  return { status: "ready", tradingDate, session, updatedAtUtc: new Date(NOW).toISOString(), universeCount: 3,
    receivedCount: 3, missingSymbols: [], missingFloatCount: 0, gainers: empty, dayGainers: empty, momentum: empty, issues: [] };
}

describe("two independent gainer comparisons from one snapshot pass", () => {
  it("keeps yesterday's close and today's regular close separate in normalization", () => {
    const para = normalized()[0];
    expect(para.baseline).toBe(3.17);
    expect(para.regularClosePrice).toBe(1.69);
    expect(para.price).toBe(2.72);
  });
  it("ranks PARA's actual after-hours move above INO while preserving the separate day ranking", () => {
    const result = evaluate();
    expect(result.gainers.rows.map(row => row.symbol)).toEqual(["PARA"]); // INO <3%; VCIG negative after-hours.
    expect(result.dayGainers.rows.map(row => row.symbol)).toEqual(["INO","VCIG"]);
    expect(result.gainers.rows[0].sessionGain).toBeCloseTo((2.72/1.69-1)*100);
    expect(result.gainers.rows[0].comparisonPrice).toBe(1.69);
    expect(result.gainers.rows[0].gainBasis).toBe("today_regular_close");
    expect(result.dayGainers.rows[0].sessionGain).toBeCloseTo((1.9185/0.6024-1)*100);
    const audit = result.audit.find(row => row.symbol === "PARA")!;
    expect(audit.gainerRank).toBe(1);
    expect(audit.gainerGain).toBeCloseTo(60.94674556213019);
    expect(audit.gainerComparisonPrice).toBe(1.69);
    expect(audit.gainerGainBasis).toBe("today_regular_close");
    expect(audit.sessionGain).toBeCloseTo((2.72/3.17-1)*100); // Momentum/day context unchanged.
    expect(audit.gainerFailures).not.toContain("gain_below_minimum");
  });
  it.each([0, -1, null, undefined, Number.NaN, Number.POSITIVE_INFINITY])("never substitutes yesterday's close when today's close is %s", close => {
    const result = evaluate(normalized().map(row => ({ ...row, regularClosePrice: close })));
    expect(result.gainers.rows).toEqual([]);
    expect(result.dayGainers.rows.map(row => row.symbol)).toEqual(["INO","VCIG"]);
    expect(result.audit.every(row => row.gainerFailures.includes("gain_unavailable"))).toBe(true);
  });
  it.each(["premarket", "regular"] as const)("leaves %s day comparisons unchanged", session => {
    const result = evaluate(normalized().map(row => ({ ...row, session, priceTimeBasis: undefined })), session);
    expect(result.gainers.rows).toEqual(result.dayGainers.rows);
    expect(result.gainers.rows.every(row => row.gainBasis === "previous_regular_close")).toBe(true);
  });
  it("does not change Momentum qualification, score or day gains when only today's regular close changes", () => {
    const first = evaluate(), second = evaluate(normalized().map(row => ({ ...row, regularClosePrice: 99 })));
    expect(second.momentum).toEqual(first.momentum);
    expect(second.audit.map(row => [row.sessionGain,row.momentumFailures,row.momentumScore])).toEqual(
      first.audit.map(row => [row.sessionGain,row.momentumFailures,row.momentumScore]));
  });
  it("returns both views through the same feed scan and enriches news for both without another quote request", async () => {
    const snapshots = vi.fn(async () => [{ requestedSymbols: universe.stocks.map(stock => stock.symbol), receivedAt: NOW,
      payload: { ret_code: 0, data: { snapshot_list: recordedPrices.map(prices => ({ ...prices,
        data_date: universe.tradingDate, update_time: NOW, after_volume: 500000, after_turnover: 1000000 })) } } }]);
    const news = vi.fn(async (symbols: readonly string[]) => new Map(symbols.map(symbol => [symbol,
      [{ id: symbol, headline: "Synthetic news", createdAt: new Date(NOW).toISOString(), url: null, typeLabel: "PR" }]])));
    const feed = new LiveScannerFeed({ configuration: async () => config,
      marketDay: async () => ({ date: universe.tradingDate, verified: true, open: true, regularCloseEastern: "16:00", extendedCloseEastern: "20:00" }),
      universe: async () => universe, reserveScannerBudget: async () => {}, snapshotPass: snapshots,
      floats: async () => floats, news, now: () => NOW, qualification: () => ({ sessionTimestampVerified: true,
        sessionCountersVerified: true, afterHoursRegularCloseVerified: false, priceTimeBasis: "session_observation" }) });
    const result = await feed.scanOnce();
    expect(snapshots).toHaveBeenCalledTimes(1);
    expect(news).toHaveBeenCalledTimes(1);
    expect(result.gainers.rows[0].symbol).toBe("PARA");
    expect(result.dayGainers!.rows.map(row => row.symbol)).toEqual(["INO","VCIG"]);
    expect(result.dayGainers!.rows[0].news[0].headline).toBe("Synthetic news");
  });
});

describe("live gainer tab selection", () => {
  it("switches default on the existing response's session change, including early close", () => {
    expect(selectedGainerView(model("regular"),null)).toBe("day");
    expect(selectedGainerView(model("after_hours"),null)).toBe("post_market");
    const session = activeSession({ date: "2026-11-02", verified: true, open: true,
      regularCloseEastern: "13:00", extendedCloseEastern: "17:00" },Date.parse("2026-11-02T18:00:00Z"));
    expect(selectedGainerView(model(session),null)).toBe("post_market");
  });
  it("preserves a manual tab through polling/session transitions and resets on the next trading date", () => {
    const choice = { tradingDate: "2026-11-02", view: "day" as const };
    expect(selectedGainerView(model("after_hours"),choice)).toBe("day");
    expect(selectedGainerView(model("after_hours","2026-11-03"),choice)).toBe("post_market");
    expect(selectedGainerView(model("premarket","2026-11-03"),choice)).toBe("day");
  });
  it("selects each independent result and does not show day data as post-market before the close", () => {
    const source = { ...model("after_hours"), gainers: { ...empty, total: 1 }, dayGainers: { ...empty, total: 2 } };
    expect(gainerViewResults(source,"day")!.total).toBe(2);
    expect(gainerViewResults(source,"post_market")!.total).toBe(1);
    expect(gainerViewResults(model("regular"),"post_market")).toBeUndefined();
    expect(selectedGainerView(null,null)).toBe("day");
    expect(gainerViewResults(null,"day")).toBeUndefined();
  });
});

describe("Momentum day and post-market percentage context", () => {
  function run(close: number | null, session: ScannerSession = "after_hours") {
    const engine = new LiveScannerEngine();
    const momentum = { ...config.momentum, focus: { ...config.momentum.focus,
      minimumOneMinuteGain: 0.1, minimumFiveMinuteGain: 0.1 },
      filters: { ...config.momentum.filters, [session]: { ...config.momentum.filters[session],
        minimumVolume: 0, minimumDollarVolume: 0, maximumSpreadPercent: null } } };
    let result: ReturnType<LiveScannerEngine["evaluate"]> | undefined;
    for (let seconds = 0; seconds <= 370; seconds += 10) {
      const snapshots = normalized().map(row => ({ ...row, session,
        priceTimeBasis: session === "after_hours" ? row.priceTimeBasis : undefined,
        providerAt: NOW + seconds*1000, receivedAt: NOW + seconds*1000,
        regularClosePrice: close, price: row.price*(1+seconds/10000),
        volume: 500000+seconds*100, dollarVolume: 1000000+seconds*200 }));
      result = engine.evaluate({ universe, tradingDate: universe.tradingDate, session, snapshots,
        configuration: { ...config, momentum }, now: NOW+seconds*1000, floats, news: new Map() });
    }
    return result!;
  }
  it("shows separate day/post context without changing recent movement, qualification or ranking", () => {
    const first = run(1.69), second = run(9);
    expect(first.momentum.rows.length).toBe(3);
    const original = first.momentum.rows.find(row => row.symbol === "PARA")!;
    expect(original.sessionGain).toBeCloseTo((original.price/3.17-1)*100);
    expect(original.postMarketGain).toBeCloseTo((original.price/1.69-1)*100);
    expect(second.momentum.rows.find(row => row.symbol === "PARA")!.postMarketGain)
      .not.toBeCloseTo(original.postMarketGain!);
    expect(second.momentum.rows.map(row => ({ ...row, postMarketGain: null })))
      .toEqual(first.momentum.rows.map(row => ({ ...row, postMarketGain: null })));
    expect(second.audit.map(row => [row.momentumRank,row.momentumFailures,row.momentumScore]))
      .toEqual(first.audit.map(row => [row.momentumRank,row.momentumFailures,row.momentumScore]));
  });
  it("keeps unknown post gain unavailable while retaining day gain and recent windows", () => {
    const result = run(null);
    expect(result.momentum.rows.length).toBe(3);
    for (const row of result.momentum.rows) {
      expect(row.postMarketGain).toBeNull();
      expect(row.sessionGain).not.toBeNull();
      expect(row.activity.oneMinuteGain).not.toBeNull();
      expect(row.activity.fiveMinuteGain).not.toBeNull();
    }
  });
  it("does not label a regular-session move as post-market gain", () => {
    const result = run(1.69,"regular");
    expect(result.momentum.rows.length).toBe(3);
    expect(result.momentum.rows.every(row => row.postMarketGain === undefined)).toBe(true);
  });
});

it.each(["premarket", "regular", "after_hours"] as const)("keeps %s gainers with unavailable spread and records the same audit decision", session => {
  const chosen = { ...config, gainers: { ...config.gainers, filters: { ...config.gainers.filters,
    [session]: { ...config.gainers.filters[session], minimumVolume: 0, minimumDollarVolume: 0,
      minimumSessionGain: 3, maximumSpreadPercent: 8 } } } };
  const snapshots = normalized().map(row => ({ ...row, session, bid: null, ask: null }));
  const result = evaluate(snapshots, session, chosen);
  expect(result.gainers.rows.map(row => row.symbol)).toContain(session === "after_hours" ? "PARA" : "INO");
  expect(result.dayGainers.rows.map(row => row.symbol)).toContain("INO");
  expect(result.audit.every(row => !row.gainerFailures.includes("spread_unavailable"))).toBe(true);
  const wide = evaluate(snapshots.map(row => ({ ...row, bid: 1, ask: 2 })), session, chosen);
  expect(wide.gainers.rows).toEqual([]);
  expect(wide.audit.every(row => row.gainerFailures.includes("spread_above_maximum"))).toBe(true);
});

it("admits recovered OMH PEPG SMX and PXLW immediately in descending gain order without spread", () => {
  const symbols = ["OMH", "PEPG", "SMX", "PXLW"];
  const fixtureUniverse = { ...universe, stocks: symbols.map(symbol => ({ symbol, exchange: "NASDAQ" as const,
    marketCapAtCollection: symbol === "PEPG" ? 171_071_007 : 14_000_000 })) };
  const chosen = { ...config, gainers: { ...config.gainers, filters: { ...config.gainers.filters,
    regular: { ...config.gainers.filters.regular, maximumMarketCap: 200_000_000,
      minimumVolume: 0, minimumDollarVolume: 0, minimumSessionGain: 1, maximumSpreadPercent: 8 } } } };
  const snapshots = symbols.map((symbol, i) => ({ ...normalized()[0], symbol, session: "regular" as const,
    baseline: 1, price: [1.30, 2.55, 1.58, 1.23][i], bid: null, ask: null }));
  const engine = new LiveScannerEngine();
  const run = (items: readonly NormalizedSnapshot[]) => engine.evaluate({ universe: fixtureUniverse,
    tradingDate: universe.tradingDate, session: "regular", snapshots: items, configuration: chosen,
    now: NOW, floats: new Map(), news: new Map() });
  expect(run(snapshots.map(row => ({ ...row, baseline: null }))).gainers.rows).toEqual([]);
  const recovered = run(snapshots);
  expect(recovered.gainers.rows.map(row => row.symbol)).toEqual(["PEPG", "SMX", "OMH", "PXLW"]);
  expect(recovered.audit.every(row => row.gainerDisplayed && row.gainerFailures.length === 0)).toBe(true);
});

describe("Gainer membership and audit across data outages", () => {
  function fixture() {
    const engine = new LiveScannerEngine();
    const chosen = { ...config, gainers: { ...config.gainers, filters: { ...config.gainers.filters,
      regular: { ...config.gainers.filters.regular, minimumVolume: 100, minimumDollarVolume: 100,
        minimumSessionGain: 1, maximumSpreadPercent: 8 } } } };
    const snapshot = (elapsed: number, patch: Partial<NormalizedSnapshot> = {}): NormalizedSnapshot => ({
      ...normalized()[0], session: "regular", providerAt: NOW + elapsed, receivedAt: NOW + elapsed,
      baseline: 1, price: 2, volume: 10_000, dollarVolume: 20_000, bid: 1.99, ask: 2.01, ...patch,
    });
    const run = (elapsed: number, snapshots: readonly NormalizedSnapshot[]) => engine.evaluate({
      universe, tradingDate: universe.tradingDate, session: "regular", snapshots, configuration: chosen,
      now: NOW + elapsed, floats, news: new Map(),
    });
    return { engine, snapshot, run };
  }
  it("audits absent and stale retained observations without inventing fresh timestamps or Momentum", () => {
    const { snapshot, run } = fixture(); const first = snapshot(0);
    run(0, [first]);
    const absent = run(3_600_000, []);
    expect(absent.gainers.rows).toHaveLength(1);
    expect(absent.audit).toHaveLength(1);
    expect(absent.audit[0]).toMatchObject({ observation: first, gainerGain: 100, gainerRank: 1,
      gainerDisplayed: true, gainerRetained: true, gainerDataIssues: ["snapshot_unavailable"],
      momentumDisplayed: false, momentumRank: null, momentumScore: null });
    expect(absent.gainers.focus).toEqual([]);
    expect(JSON.parse(JSON.stringify(absent.audit))[0].observation.receivedAt).toBe(NOW);
    const stale = run(3_601_000, [first]);
    expect(stale.audit[0]).toMatchObject({ observation: first, gainerGain: 100, gainerDisplayed: true,
      gainerDataIssues: ["snapshot_stale"], momentumDisplayed: false });
  });
  it("records recalculated gain using a saved comparison with fresh price and a missing baseline", () => {
    const { snapshot, run } = fixture(); run(0, [snapshot(0)]);
    const result = run(1_000, [snapshot(1_000, { price: 2.5, baseline: null })]);
    expect(result.gainers.rows[0]).toMatchObject({ sessionGain: 150, comparisonPrice: 1, price: 2.5 });
    expect(result.audit[0]).toMatchObject({ gainerGain: 150, gainerComparisonPrice: 1, gainerDisplayed: true,
      gainerDataIssues: ["baseline_unavailable"], gainerRetained: true });
    expect(result.audit[0].observation.baseline).toBeNull();
    expect(result.audit[0].gainerFailures).not.toContain("gain_unavailable");
  });
  it("admits a NEW gainer with missing volume and quotes without inventing liquidity values", () => {
    const { snapshot, run } = fixture();
    const result = run(0, [snapshot(0, { volume: null, dollarVolume: null, bid: null, ask: null })]);
    expect(result.gainers.rows[0]).toMatchObject({ volume: null, dollarVolume: null, sessionGain: 100 });
    expect(result.audit[0].gainerFailures).toEqual([]);
    expect(result.audit[0].gainerDataIssues).toEqual(["volume_unavailable", "dollar_volume_unavailable", "spread_unavailable"]);
  });
  it("retains an actual wide spread for fifteen minutes with matching audit then removes it", () => {
    const { snapshot, run } = fixture(); run(0, [snapshot(0)]);
    const wide = (elapsed: number) => snapshot(elapsed, { bid: 1, ask: 2 });
    const retained = run(1_000, [wide(1_000)]);
    expect(retained.audit[0]).toMatchObject({ gainerDisplayed: true, gainerRetained: true });
    expect(retained.audit[0].gainerFailures).toContain("spread_above_maximum");
    expect(run(900_999, [wide(900_999)]).gainers.rows).toHaveLength(1);
    const expired = run(901_000, [wide(901_000)]);
    expect(expired.gainers.rows).toEqual([]);
    expect(expired.audit[0]).toMatchObject({ gainerDisplayed: false, gainerRank: null });
    expect(run(901_001, [snapshot(901_001)]).gainers.rows).toHaveLength(1);
  });
});
