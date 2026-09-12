import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeIndicatorEpisodes, type IndicatorObservation } from "./trend-momentum-episodes";
const base = 1_800_000_000;
const o = (minute: number, close: number): IndicatorObservation =>
  ({ at: base + minute * 60, close, ema9: 10, ema20: 9, vwap: 10, rsi14: 55 });
function run(observations: IndicatorObservation[], overrides: Partial<Parameters<typeof analyzeIndicatorEpisodes>[0]> = {}) {
  return analyzeIndicatorEpisodes({ observations, oneMinuteCloses: [o(7, 10.4)],
    cycles: [{ openedAt: base, closedAt: base + 600, closingPrice: 10.5 }],
    completedRanges: [{ start: base - 60, endExclusive: base + 3600 }], resetTimes: [], direction: "long", ...overrides });
}
test("loss, neutral closes and reclaim form one uninterrupted episode", () => {
  const result = run([o(0, 10.1), o(1, 10.1), o(2, 9.9), o(3, 10), o(4, 9.8), o(5, 10.2)]);
  const episodes = result.episodes.filter((e) => e.reference === "ema9");
  assert.equal(episodes.length, 1);
  assert.equal(episodes[0].recovery, "observed_reclaim");
  assert.equal(episodes[0].reclaimedAt, base + 300);
  assert.equal(episodes[0].firstEventCoverage, "complete");
  assert.equal(episodes[0].ema20SideAtLoss, "above");
  assert.equal(episodes[0].horizons[0].status, "measured");
  assert.ok(Math.abs(episodes[0].horizons[0].changePerShare! - 0.5) < 1e-12);
  assert.equal(episodes[0].horizons[1].status, "closed_before_horizon");
});
test("session interruption cannot be repaired by a later reclaim", () => {
  const result = run([o(0, 10.1), o(1, 10.1), o(2, 9.9), o(5, 10.2)], { resetTimes: [base + 180] });
  assert.equal(result.episodes.find((e) => e.reference === "ema9")!.recovery, "unknown");
});
test("incomplete earlier context remains separate even when recovery is observed", () => {
  const result = run([{ ...o(0, 10.1), ema9: null }, o(1, 10.1), o(2, 9.9), o(3, 10.2)]);
  const episode = result.episodes.find((e) => e.reference === "ema9")!;
  assert.equal(episode.firstEventCoverage, "incomplete");
  assert.equal(episode.recovery, "observed_reclaim");
});
test("short studies mirror loss and return without renaming raw price direction", () => {
  const result = run([o(0, 9.8), o(1, 9.8), o(2, 10.2), o(3, 9.8)], { direction: "short" });
  const episode = result.episodes.find((e) => e.reference === "ema9")!;
  assert.equal(episode.lossSide, "above");
  assert.equal(episode.recovery, "observed_reclaim");
});
test("exact closure at horizon takes precedence over a missing endpoint", () => {
  const result = run([o(0, 10.1), o(1, 10.1), o(2, 9.9)], {
    cycles: [{ openedAt: base, closedAt: base + 420, closingPrice: 9.5 }], oneMinuteCloses: [] });
  const episode = result.episodes.find((e) => e.reference === "ema9")!;
  assert.equal(episode.horizons[0].status, "closed_at_horizon");
  assert.equal(episode.recovery, "no_recorded_reclaim_before_closure");
});
test("RSI neutral midpoint touches do not create extra crossings", () => {
  const result = run([o(0, 10), { ...o(1, 10), rsi14: 49 }, { ...o(2, 10), rsi14: 50 },
    { ...o(3, 10), rsi14: 49 }, { ...o(4, 10), rsi14: 51 }]);
  assert.deepEqual(result.crossings.filter((c) => c.kind === "rsi_midpoint").map((c) => c.side), ["below", "above"]);
});

test("the first held close can lose the valid side already known at entry", () => {
  const result = run([o(0, 10.2), o(1, 9.8), o(2, 10.2)]);
  const episode = result.episodes.find((e) => e.reference === "ema9")!;
  assert.equal(episode.at, base + 60);
  assert.equal(episode.previousSideAt, base);
  assert.equal(episode.firstEventCoverage, "complete");
  assert.equal(episode.recovery, "observed_reclaim");
  const missing = run([o(1, 9.8), o(2, 10.2)]);
  assert.equal(missing.episodes.filter((e) => e.reference === "ema9").length, 0);
});
