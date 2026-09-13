import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeIndicatorEpisodes } from "./trend-momentum-episodes";
import { buildTrendMomentumProjection, selectIndicatorStudy, selectIndicatorReclaimStudy, summarizeIndicatorRecords, summarizeIndicatorStudy,
  type TrendMomentumRecord, type TrendMomentumProjection } from "./trend-momentum-analytics";

const record = (tradeId: string, pnlDecimal: string | null, executionId: string): TrendMomentumRecord => ({
  tradeId, pnlDecimal, executionId, representativeRoundTripId: tradeId, symbol: "TEST", direction: "long",
  closeDate: "2026-09-11", trackerDate: "2026-09-11", executionKind: "initial_entry",
  executedAtUtc: "2026-09-11T14:00:00Z", executionSequence: 1, context: null,
  executionPriceDecimal: "10",
});

test("first reclaim stays first across position cycles even when its older saved context is missing", () => {
  const at = 1_800_000_000;
  const during = analyzeIndicatorEpisodes({
    observations: [[0, 10.2], [1, 9.8], [3, 10.2], [6, 10.2], [7, 9.8], [9, 10.3]].map(([minute, close]) =>
      ({ at: at + minute * 60, close, ema9: 10, ema20: 9, vwap: null, rsi14: 55 })),
    oneMinuteCloses: [], cycles: [{ openedAt: at, closedAt: at + 240, closingPrice: 10.2 },
      { openedAt: at + 360, closedAt: at + 600, closingPrice: 10.4 }],
    completedRanges: [{ start: at, endExclusive: at + 600 }], resetTimes: [], direction: "long",
  });
  const projection = { trades: [{ tradeId: "combined", indicators: { duringTrade: { oneMinute: {
    ...during, episodes: during.episodes.map((episode) => episode.cycle === 0 ? { ...episode, reclaimStudy: undefined } : episode),
  } } } }] } as unknown as TrendMomentumProjection;
  assert.equal(selectIndicatorReclaimStudy(projection, "1m", "ema9", false).length, 2);
  const first = selectIndicatorReclaimStudy(projection, "1m", "ema9", true);
  assert.equal(first.length, 1);
  assert.equal(first[0].episode.reclaimedAt, at + 180);
  assert.equal(first[0].observation, null);
  assert.equal(first.filter((row) => row.observation !== null).length, 0);
});
test("whole-trade outcomes count once despite repeated executions and preserve unknown Net", () => {
  const result = summarizeIndicatorRecords([record("a", "10.25", "1"), record("a", "10.25", "2"),
    record("b", "-2.25", "3"), record("c", null, "4")]);
  assert.equal(result.tradeCount, 3);
  assert.equal(result.occurrenceCount, 4);
  assert.equal(result.pnlTradeCount, 2);
  assert.equal(result.totalPnlDecimal, "8");
  assert.equal(result.averagePnlDecimal, "4");
  assert.equal(result.winRatePercent, 50);
  assert.equal(summarizeIndicatorRecords([record("c", null, "4")]).totalPnlDecimal, null);
  assert.throws(() => summarizeIndicatorRecords([record("a", "1", "1"), record("a", "2", "2")]));
});
test("unanalysed trades remain in coverage instead of disappearing", () => {
  const { context: _context, executionId: _id, executionKind: _kind, executedAtUtc: _at,
    executionSequence: _sequence, ...identity } = record("a", null, "1");
  const projection = buildTrendMomentumProjection([{ ...identity, analysis: null }]);
  assert.equal(projection.tradeCount, 1);
  assert.equal(projection.analyzedTradeCount, 0);
  assert.equal(projection.records.length, 0);
  assert.equal(projection.trades[0].unavailableReason, "not_yet_analyzed");
  assert.throws(() => buildTrendMomentumProjection([{ ...identity, analysis: null }, { ...identity, analysis: null }]));
});
test("first-event selection precedes filters and unknown recovery is excluded from rate", () => {
  const at = 1_800_000_000;
  const episodes = analyzeIndicatorEpisodes({
    observations: [10.2, 10.2, 9.8, 10.2, 9.8, 10.2].map((close, i) => ({ at: at + i * 60,
      close, ema9: 10, ema20: 9, vwap: null, rsi14: 55 })),
    oneMinuteCloses: [], cycles: [{ openedAt: at, closedAt: at + 600, closingPrice: 10 }],
    completedRanges: [{ start: at, endExclusive: at + 600 }], resetTimes: [], direction: "long",
  });
  const projection = { trades: [{ tradeId: "a", indicators: { duringTrade: { oneMinute: episodes } } }] } as unknown as TrendMomentumProjection;
  const first = selectIndicatorStudy(projection, "1m", "ema9", true);
  const all = selectIndicatorStudy(projection, "1m", "ema9", false);
  assert.equal(all.length, 2);
  assert.equal(first.length, 1);
  assert.equal(first[0].episode.at, at + 120);
  assert.equal(first.filter((r) => r.episode.at > at + 120).length, 0);
  const summary = summarizeIndicatorStudy([all[0], { ...all[1], episode: { ...all[1].episode, recovery: "unknown" } }]);
  assert.equal(summary.tradeCount, 1);
  assert.equal(summary.occurrenceCount, 2);
  assert.equal(summary.recordedReclaimRate, 100);
  assert.equal(summary.unknown, 1);
  for (const horizon of summary.horizons) assert.equal(Object.values(horizon.counts).reduce((a, b) => a + b, 0), 2);
});
