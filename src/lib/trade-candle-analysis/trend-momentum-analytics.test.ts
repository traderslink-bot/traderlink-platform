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

test("aggregate payload keeps execution context once without modifying saved analysis", () => {
  const executedAtUtc = "2026-09-11T14:00:00Z";
  const contexts = Array.from({ length: 40 }, (_, i) => ({ eventId: `event-${i}`, executedAtUtc,
    oneMinute: { alignment: "above", rsiBand: "above_70", historyBars: 200 }, fiveMinute: null, sessionVwap: null }));
  const analysis = { eventSnapshots: contexts.map((event, sequence) => ({ event: { eventId: event.eventId,
    executedAtUtc, sequence, kind: sequence === 0 ? "entry" : "add", priceDecimal: "10" } })),
    trendMomentum: { executions: contexts, duringTrade: { oneMinute: null, fiveMinute: null },
      chartSeries: { oneMinute: [{ privateChart: true }], fiveMinute: [] } } };
  const source = { ...record("one-trade", "5", "initial"), analysis } as unknown as Parameters<typeof buildTrendMomentumProjection>[0][number];
  const result = buildTrendMomentumProjection([source]);
  assert.equal(result.records.length, 40);
  assert.deepEqual(result.records.map((row) => row.context), contexts);
  assert.deepEqual(result.trades[0].indicators!.executions, []);
  assert.equal(source.analysis!.trendMomentum!.executions.length, 40);
  assert.equal("chartSeries" in result.trades[0].indicators!, false);
  assert.equal(summarizeIndicatorRecords(result.records).tradeCount, 1);
  assert.equal(summarizeIndicatorRecords(result.records).totalPnlDecimal, "5");
  const duplicate = { ...result, trades: result.trades.map((trade) => ({ ...trade, indicators: { ...trade.indicators, executions: contexts } })) };
  assert.ok(Buffer.byteLength(JSON.stringify(result)) < Buffer.byteLength(JSON.stringify(duplicate)));
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

test("large saved-trade population preserves counts and excludes chart payloads", () => {
  const executedAtUtc = "2026-09-11T14:00:00Z";
  const contexts = Array.from({ length: 20 }, (_, i) => ({ eventId: `event-${i}`, executedAtUtc,
    oneMinute: { alignment: "above", rsiBand: "above_70", historyBars: 200 }, fiveMinute: null, sessionVwap: null }));
  const analysis = { eventSnapshots: contexts.map((event, sequence) => ({ event: { eventId:event.eventId,executedAtUtc,sequence,
    kind:sequence===0?"entry":"add",priceDecimal:"10" } })), trendMomentum: { executions:contexts,
      duringTrade:{oneMinute:null,fiveMinute:null},chartSeries:{oneMinute:[{chartOnlyEvidence:true}],fiveMinute:[]} } };
  const rows = Array.from({length:500},(_,i)=>({...record(`trade-${i}`,"5",`initial-${i}`),analysis})) as unknown as Parameters<typeof buildTrendMomentumProjection>[0];
  const projection = buildTrendMomentumProjection(rows);
  assert.equal(projection.trades.length,500);
  assert.equal(projection.records.length,10000);
  const summary = summarizeIndicatorRecords(projection.records);
  assert.equal(summary.tradeCount,500);
  assert.equal(summary.totalPnlDecimal,"2500");
  const serialized = JSON.stringify(projection);
  assert.doesNotMatch(serialized,/chartOnlyEvidence|chartSeries/);
  assert.ok(projection.trades.every(trade=>trade.indicators?.executions.length===0));
  assert.equal(analysis.trendMomentum.executions.length,20);
  console.info("Synthetic 500-trade / 10000-execution projection bytes:",Buffer.byteLength(serialized));
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
  const source = record("a", null, "1");
  const identity = { tradeId: source.tradeId, pnlDecimal: source.pnlDecimal,
    representativeRoundTripId: source.representativeRoundTripId, symbol: source.symbol,
    direction: source.direction, closeDate: source.closeDate, trackerDate: source.trackerDate,
    executionPriceDecimal: source.executionPriceDecimal };
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
