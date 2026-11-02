// @vitest-environment node
import { describe, expect, it } from "vitest";
import { SnapshotSessionQualifier } from "./session-qualification";
import { normalizeSnapshotBatch } from "./snapshots";
import { RollingActivityBook } from "./activity";
import { LiveScannerEngine } from "./engine";
import { initialConfiguration } from "./settings";
import type { DailyUniverse } from "./contracts";
import quoteFixture from "./fixtures/moomoo-after-hours-quote-20261012.json";
import { LiveScannerFeed } from "./server/live-feed";
import type { ScannerAuditCycle } from "./audit/contracts";

const DATE = "2026-11-02", CLOSE = Date.parse("2026-11-02T21:00:00Z"), NOW = CLOSE + 5 * 60000;
const day = { date: DATE, verified: true, open: true, regularCloseEastern: "16:00" as const, extendedCloseEastern: "20:00" as const };
function raw(volume = 100000, patch: Record<string, unknown> = {}) {
  return { code: "US.TEST", data_date: DATE, update_time: CLOSE, last_price: 1, prev_close_price: 0.9,
    volume: 2000000, turnover: 2000000, after_price: 1.1, after_volume: volume, after_turnover: volume * 1.1,
    bid_price: 1.099, ask_price: 1.101, total_market_val: 10000000, ...patch };
}
const payload = (...rows: Record<string, unknown>[]) => ({ ret_code: 0, data: { snapshot_list: rows } });
function observe(q: SnapshotSessionQualifier, at = NOW, volume = 100000, patch: Record<string, unknown> = {}) {
  return q.observe("after_hours", { payload: payload(raw(volume, patch)), receivedAt: at, requestedSymbols: ["TEST"], tradingDate: DATE, day });
}
function normalize(q: SnapshotSessionQualifier, at: number, volume: number, patch: Record<string, unknown> = {}) {
  const body = payload(raw(volume, patch)), qualification = q.observe("after_hours", {
    payload: body, receivedAt: at, requestedSymbols: ["TEST"], tradingDate: DATE, day });
  return normalizeSnapshotBatch({ requestedSymbols: ["TEST"], payload: body, session: "after_hours", tradingDate: DATE, receivedAt: at, qualification });
}

describe("existing-response post-market qualification", () => {
  it("covers the recorded quote-endpoint frozen-close example through an explicitly adapted snapshot envelope", () => {
    const q = new SnapshotSessionQualifier(), results = quoteFixture.records.map(record => {
      const quote = record.quote, date = quote.data_date;
      const body = payload({ code: quote.code, data_date: date, update_time: quote.data_time,
        last_price: quote.last_price, prev_close_price: quote.prev_close_price, volume: quote.volume, turnover: quote.turnover,
        after_price: quote.after_market.price, after_volume: quote.after_market.volume, after_turnover: quote.after_market.turnover });
      const qualification = q.observe("after_hours", { payload: body, receivedAt: Date.parse(record.receivedAt),
        requestedSymbols: ["SMTK"], tradingDate: date, day: { ...day, date } });
      return normalizeSnapshotBatch({ payload: body, receivedAt: Date.parse(record.receivedAt),
        requestedSymbols: ["SMTK"], tradingDate: date, session: "after_hours", qualification });
    });
    expect(results[0].snapshots).toHaveLength(0);
    expect(results[1].snapshots[0]).toMatchObject({ price: 1.5479, volume: 965123,
      providerAt: quoteFixture.records[0].quote.data_time, priceTimeBasis: "session_observation" });
    expect(Date.parse(quoteFixture.records[1].receivedAt) - results[1].snapshots[0].providerAt).toBeGreaterThan(30000);
  });
  it("waits for genuine increasing after-hours counters, not a hard-coded off flag", () => {
    const q = new SnapshotSessionQualifier();
    expect(observe(q).sessionCountersVerified).toBe(false);
    const result = observe(q, NOW + 10000, 110000);
    expect(result.sessionCountersVerified).toBe(true);
    expect(result.sessionTimestampVerified).toBe(true);
    expect(result.priceTimeBasis).toBe("session_observation");
    expect(result.sessionEvidence).toMatchObject({ symbol: "TEST", qualified: true, providerAt: CLOSE, receivedAt: NOW + 10000 });
  });
  it("does not invent new activity from identical or simultaneous responses", () => {
    const q = new SnapshotSessionQualifier(); observe(q);
    expect(observe(q).sessionCountersVerified).toBe(false);
    expect(observe(q, NOW + 10000).sessionCountersVerified).toBe(false);
    expect(observe(q, NOW + 20000, 100001, { after_turnover: 110000 }).sessionCountersVerified).toBe(false);
  });
  it("does not require a regular-hours print before a genuine new after-hours runner", () => {
    const q = new SnapshotSessionQualifier(), earlierPriceTime = CLOSE - 9 * 3600000;
    observe(q, NOW, 100000, { update_time: earlierPriceTime });
    expect(observe(q, NOW + 10000, 110000, { update_time: earlierPriceTime }).sessionCountersVerified).toBe(true);
  });
  it.each([{ after_price: 0 }, { after_volume: 0 }, { after_turnover: 0 }, { after_volume: "110000" },
    { data_date: "2026-10-30" }, { update_time: NOW + 20000 }, { update_time: CLOSE - 86400000 }])("does not qualify invalid session fields %j", patch => {
    const q = new SnapshotSessionQualifier(); observe(q);
    expect(observe(q, NOW + 10000, 110000, patch).sessionCountersVerified).toBe(false);
  });
  it("does not use duplicate, unrelated or provider-rejected rows as evidence", () => {
    const q = new SnapshotSessionQualifier(); observe(q);
    for (const body of [payload(raw(110000), raw(110000)), payload(raw(110000, { code: "US.OTHER" })), { ret_code: -11, ret_msg: "rate limit exceeded" }]) {
      expect(q.observe("after_hours", { payload: body, receivedAt: NOW + 10000, requestedSymbols: ["TEST"], tradingDate: DATE, day }).sessionCountersVerified).toBe(false);
    }
  });
  it("requires continuous evidence after a gap and resets its proof on a new trading date", () => {
    const q = new SnapshotSessionQualifier(); observe(q);
    expect(observe(q, NOW + 31000, 110000).sessionCountersVerified).toBe(false);
    expect(observe(q, NOW + 41000, 120000).sessionCountersVerified).toBe(true);
    const next = "2026-11-03", at = NOW + 86400000;
    expect(q.observe("after_hours", { payload: payload(raw(1000, { data_date: next, update_time: CLOSE + 86400000 })),
      receivedAt: at, requestedSymbols: ["TEST"], tradingDate: next, day: { ...day, date: next } }).sessionCountersVerified).toBe(false);
  });
  it("does not qualify outside the verified market session, including weekends and holidays", () => {
    const q = new SnapshotSessionQualifier(); observe(q); observe(q, NOW + 10000, 110000);
    for (const calendar of [{ ...day, open: false }, { ...day, verified: false }]) {
      expect(q.observe("after_hours", { payload: payload(raw(120000)), receivedAt: NOW + 20000,
        requestedSymbols: ["TEST"], tradingDate: DATE, day: calendar }).sessionCountersVerified).toBe(false);
    }
    expect(observe(new SnapshotSessionQualifier(), CLOSE - 1000).sessionCountersVerified).toBe(false);
    expect(observe(new SnapshotSessionQualifier(), CLOSE + 4 * 3600000).sessionCountersVerified).toBe(false);
  });
  it("respects early-close calendars without changing regular or premarket qualification", () => {
    const q = new SnapshotSessionQualifier(), early = Date.parse("2026-11-02T18:05:00Z"), close = early - 300000;
    const context = { requestedSymbols: ["TEST"], tradingDate: DATE,
      day: { ...day, regularCloseEastern: "13:00" as const, extendedCloseEastern: "17:00" as const } };
    expect(q.observe("after_hours", { ...context, receivedAt: early, payload: payload(raw(100000, { update_time: close })) }).sessionCountersVerified).toBe(false);
    expect(q.observe("after_hours", { ...context, receivedAt: early + 10000, payload: payload(raw(110000, { update_time: close })) }).sessionCountersVerified).toBe(true);
    expect(q.observe("regular", { ...context, receivedAt: early, payload: payload(raw()) }).sessionTimestampVerified).toBe(true);
    expect(q.observe("premarket", { ...context, receivedAt: early, payload: payload(raw()) }).sessionTimestampVerified).toBe(false);
  });
  it("retains the real provider clock and uses after-hours fields, never regular-session values", () => {
    const q = new SnapshotSessionQualifier(); normalize(q, NOW, 100000);
    const result = normalize(q, NOW + 10000, 110000), snapshot = result.snapshots[0];
    expect(snapshot).toMatchObject({ providerAt: CLOSE, receivedAt: NOW + 10000, price: 1.1,
      volume: 110000, dollarVolume: 110000 * 1.1, baseline: 0.9, priceTimeBasis: "session_observation" });
    expect(normalize(q, NOW + 20000, 120000, { after_price: 0 }).snapshots).toHaveLength(0);
  });
  it("warms up rolling windows from real session observations while preserving a frozen regular-close clock", () => {
    const q = new SnapshotSessionQualifier(), book = new RollingActivityBook();
    normalize(q, NOW - 10000, 99000);
    for (let seconds = 0; seconds <= 600; seconds += 10) {
      const result = normalize(q, NOW + seconds * 1000, 100000 + seconds * 100,
        { after_price: 1.1 + seconds / 100000 });
      expect(result.snapshots).toHaveLength(1);
      expect(book.observe(result.snapshots[0])).toBe(true);
    }
    const metrics = book.metrics("TEST", NOW + 600000);
    expect(metrics.oneMinuteVolume).toBe(6000);
    expect(metrics.fiveMinuteVolume).toBe(30000);
    expect(metrics.volumeAcceleration).toBeCloseTo(1);
    expect(metrics.fiveMinuteVolumeSpike).toBeCloseTo(1);
    expect(metrics.oneMinuteGain).toBeCloseTo((1.106 / 1.1054 - 1) * 100);
    expect(book.metrics("TEST", NOW + 616000).oneMinuteVolume).toBeNull();
  });
  it("keeps day gainers and renewed momentum independent through the real engine path", () => {
    const q = new SnapshotSessionQualifier(), engine = new LiveScannerEngine();
    const universe: DailyUniverse = { version: 1, tradingDate: DATE, acceptedAtUtc: new Date(NOW).toISOString(),
      lastCollectionAtUtc: new Date(NOW).toISOString(), latestUploadCount: 1, sourceHashes: ["a".repeat(64)],
      stocks: [{ symbol: "TEST", exchange: "NASDAQ", marketCapAtCollection: 10000000 }] };
    const configuration = { ...initialConfiguration(), enabled: true };
    normalize(q, NOW - 10000, 99000);
    let result: ReturnType<LiveScannerEngine["evaluate"]> | undefined;
    for (let seconds = 0; seconds <= 600; seconds += 10) {
      const snapshots = normalize(q, NOW + seconds * 1000, 100000 + seconds * 1000,
        { after_price: 1.1 + Math.max(0, seconds - 500) / 1000 }).snapshots;
      result = engine.evaluate({ universe, tradingDate: DATE, session: "after_hours", snapshots,
        now: NOW + seconds * 1000, configuration, floats: new Map([["TEST", { shares: 1000000, retrievedAtUtc: new Date(NOW).toISOString() }]]), news: new Map() });
    }
    expect(result!.gainers.rows[0].providerAtUtc).toBe(new Date(CLOSE).toISOString());
    expect(result!.momentum.rows[0].activity.oneMinuteGain).toBeGreaterThan(2.5);
    expect(result!.momentum.rows[0].priceTimeBasis).toBe("session_observation");
  });
  it("uses only the existing feed requests and preserves the qualification witness in audit evidence", async () => {
    const q = new SnapshotSessionQualifier(), cycles: ScannerAuditCycle[] = [];
    let at = NOW, volume = 100000, requests = 0;
    const universe: DailyUniverse = { version: 1, tradingDate: DATE, acceptedAtUtc: new Date(NOW).toISOString(),
      lastCollectionAtUtc: new Date(NOW).toISOString(), latestUploadCount: 1, sourceHashes: ["b".repeat(64)],
      stocks: [{ symbol: "TEST", exchange: "NASDAQ", marketCapAtCollection: 10000000 }] };
    const feed = new LiveScannerFeed({ configuration: async () => ({ ...initialConfiguration(), enabled: true }),
      marketDay: async () => day, universe: async () => universe, reserveScannerBudget: async () => {},
      snapshotPass: async batches => { requests++; return batches.map(requestedSymbols => ({ requestedSymbols,
        payload: payload(raw(volume)), requestedAt: at, receivedAt: at })); },
      floats: async () => new Map([["TEST", { shares: 1000000, retrievedAtUtc: new Date(NOW).toISOString() }]]),
      news: async () => new Map(), qualification: (session, context) => q.observe(session, context),
      audit: { enqueue: cycle => { cycles.push(cycle); } }, now: () => at });
    expect((await feed.scanOnce()).receivedCount).toBe(0);
    expect(cycles[0].batches[0].sessionEvidence?.qualified).toBe(false);
    at += 10000; volume += 10000;
    const model = await feed.scanOnce();
    expect(model.receivedCount).toBe(1);
    expect(model.gainers.rows[0].price).toBe(1.1);
    expect(cycles[1].batches[0].sessionEvidence?.qualified).toBe(true);
    expect(requests).toBe(2);
  });
});
