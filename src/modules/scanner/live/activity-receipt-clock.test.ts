// @vitest-environment node
import { describe, expect, it } from "vitest";
import { RollingActivityBook } from "./activity";
import type { NormalizedSnapshot } from "./contracts";
import fixture from "./fixtures/moomoo-receipt-clock-20261102.json";

const NOW = Date.parse("2026-11-02T19:00:00Z");
function row(at: number, patch: Partial<NormalizedSnapshot> = {}): NormalizedSnapshot {
  return { symbol: "TEST", company: "Synthetic fixture", session: "regular", tradingDate: "2026-11-02",
    providerAt: at, receivedAt: at, price: 1, baseline: 0.9, volume: 1000000, dollarVolume: 2000000,
    bid: 0.999, ask: 1.001, marketCap: 10000000, dayHigh: 1.2, dayLow: 0.8, providerVolumeRatio: 2, ...patch };
}
function fill(book: RollingActivityBook, last = 120) {
  for (let seconds = 0; seconds <= last; seconds += 10) {
    // Two genuine HTTP observations per unchanged last-price timestamp.
    expect(book.observe(row(NOW + seconds * 1000, {
      providerAt: NOW + Math.floor(seconds / 20) * 20000,
      volume: 1000000 + seconds * 100, dollarVolume: 2000000 + seconds * 200,
    }))).toBe(true);
  }
}

describe("Moomoo receipt-clock rolling activity", () => {
  it("accepts increasing counters at an unchanged last-price time and uses actual elapsed observation time", () => {
    const book = new RollingActivityBook(); fill(book, 600);
    const metrics = book.metrics("TEST", NOW + 600000);
    expect(metrics.oneMinuteVolume).toBe(6000);
    expect(metrics.oneMinuteDollarVolume).toBe(12000);
    expect(metrics.oneMinuteGain).toBe(0);
    expect(metrics.fiveMinuteVolume).toBe(30000);
    expect(metrics.volumeAcceleration).toBeCloseTo(1);
    expect(metrics.fiveMinuteVolumeSpike).toBeCloseTo(1);
  });
  it("does not manufacture volume or momentum from identical snapshots", () => {
    const book = new RollingActivityBook();
    for (let seconds = 0; seconds <= 600; seconds += 10) {
      book.observe(row(NOW + seconds * 1000, { providerAt: NOW + Math.floor(seconds / 20) * 20000 }));
    }
    const metrics = book.metrics("TEST", NOW + 600000);
    expect(metrics.oneMinuteGain).toBe(0);
    expect(metrics.fiveMinuteGain).toBe(0);
    expect(metrics.oneMinuteVolume).toBe(0);
    expect(metrics.volumeAcceleration).toBeNull();
  });
  it("recovers from a real receipt gap without inventing the missing interval", () => {
    const book = new RollingActivityBook(); fill(book);
    expect(book.metrics("TEST", NOW + 120000).oneMinuteVolume).toBe(6000);
    book.observe(row(NOW + 140000, { volume: 1014000, dollarVolume: 2028000 }));
    expect(book.metrics("TEST", NOW + 140000).oneMinuteVolume).toBeNull();
    for (let seconds = 150; seconds <= 200; seconds += 10) {
      book.observe(row(NOW + seconds * 1000, { volume: 1000000 + seconds * 100, dollarVolume: 2000000 + seconds * 200 }));
    }
    expect(book.metrics("TEST", NOW + 200000).oneMinuteVolume).toBe(6000);
  });
  it("still withholds old prices, old receipts and future timestamps", () => {
    const book = new RollingActivityBook(); fill(book);
    expect(book.metrics("TEST", NOW + 136000).oneMinuteVolume).toBeNull();
    expect(book.metrics("TEST", NOW + 119999).oneMinuteVolume).toBeNull();
    const oldPrice = new RollingActivityBook();
    for (let seconds = 0; seconds <= 70; seconds += 10) {
      oldPrice.observe(row(NOW + seconds * 1000, { providerAt: NOW + seconds * 1000 - 40000 }));
    }
    expect(oldPrice.metrics("TEST", NOW + 70000).oneMinuteVolume).toBeNull();
  });
  it("rejects conflicting identical receipt times and identical-price-clock price changes", () => {
    for (const patch of [{ volume: 1000001 }, { price: 1.01, receivedAt: NOW + 1000 }]) {
      const book = new RollingActivityBook();
      book.observe(row(NOW));
      expect(book.observe(row(NOW))).toBe(true);
      expect(book.observe(row(NOW, patch))).toBe(false);
      expect(book.metrics("TEST", NOW + 1000).oneMinuteGain).toBeNull();
    }
  });
  it("does not erase good history on an out-of-order response", () => {
    const book = new RollingActivityBook(); fill(book);
    expect(book.observe(row(NOW + 110000))).toBe(false);
    expect(book.metrics("TEST", NOW + 120000).oneMinuteVolume).toBe(6000);
  });
  it("resets decreasing counters, trading dates and sessions", () => {
    for (const patch of [{ volume: 10 }, { dollarVolume: 10 }, { tradingDate: "2026-11-03" }, { session: "after_hours" as const }]) {
      const book = new RollingActivityBook(); fill(book);
      book.observe(row(NOW + 130000, { providerAt: NOW + 120000, volume: 1013000, dollarVolume: 2026000, ...patch }));
      expect(book.metrics("TEST", NOW + 130000).oneMinuteVolume).toBeNull();
    }
  });
  it("keeps unavailable counters unavailable rather than substituting zero", () => {
    const book = new RollingActivityBook();
    for (let seconds = 0; seconds <= 70; seconds += 10) book.observe(row(NOW + seconds * 1000, { volume: null, dollarVolume: null }));
    const metrics = book.metrics("TEST", NOW + 70000);
    expect(metrics.oneMinuteGain).toBe(0);
    expect(metrics.oneMinuteVolume).toBeNull();
    expect(metrics.oneMinuteDollarVolume).toBeNull();
  });
  it("replays the actual saved observations and independently reconciles each last one/five-minute window", () => {
    const book = new RollingActivityBook();
    for (const observation of fixture.observations) expect(book.observe(row(observation.receivedAt, {
      ...observation, session: observation.session as "regular",
    }))).toBe(true);
    for (const symbol of new Set(fixture.observations.map(observation => observation.symbol))) {
      const history = fixture.observations.filter(observation => observation.symbol === symbol), last = history.at(-1)!;
      const metrics = book.metrics(symbol, last.receivedAt);
      for (const [duration, volumeKey, gainKey] of [[60000, "oneMinuteVolume", "oneMinuteGain"], [300000, "fiveMinuteVolume", "fiveMinuteGain"]] as const) {
        const reference = history.filter(observation => observation.receivedAt <= last.receivedAt - duration).at(-1)!;
        expect(last.receivedAt - duration - reference.receivedAt).toBeLessThanOrEqual(10000);
        expect(metrics[volumeKey]).toBe(last.volume! - reference.volume!);
        expect(metrics[gainKey]).toBeCloseTo((last.price / reference.price - 1) * 100, 10);
      }
    }
    const pairs = fixture.observations.map((observation, index) => ({ observation,
      previous: fixture.observations.slice(0, index).findLast(item => item.symbol === observation.symbol) }));
    expect(pairs.some(({ observation, previous }) => previous && observation.providerAt === previous.providerAt
      && observation.receivedAt > previous.receivedAt && observation.volume! > previous.volume!)).toBe(true);
  });
});
