import assert from "node:assert/strict";
import { test } from "vitest";
import { TRADE_INDICATOR_CALCULATION_VERSION } from "../../../lib/trade-candle-analysis/trend-momentum-version";
import { pageSavedAnalyzedTrades } from "./trend-momentum-analyzed-trades";
import type { SavedPatternTrade } from "../../../lib/trade-candle-analysis/trend-momentum-patterns";
import { createJournalAnalyzedTradesOfflineViewModel } from "../../journal-analytics/contracts/journal-analytics-offline-view-contracts";
import { duringStudyTradeQuery } from "../../../lib/trade-candle-analysis/trend-momentum-during-study";

function trade(id: string, alignment: "above" | "below" | null): SavedPatternTrade {
  const events = [1, 2].map((sequence) => ({ eventId: `${id}-e${sequence}`, sequence, kind: sequence === 1 ? "entry" : "final_exit", executedAtUtc: `2026-09-11T14:0${sequence}:00Z`, priceDecimal: "10" }));
  return { tradeId: id, analysisVersionId: "revision", representativeRoundTripId: id, symbol: "TEST", direction: "long", closeDate: "2026-09-11", trackerDate: "2026-09-11",
    openedAtUtc: events[0]!.executedAtUtc, closedAtUtc: events[1]!.executedAtUtc, pnlDecimal: "5", returnPercentDecimal: "10",
    analyzed: { eventSnapshots: events.map((event) => ({ event })), trendMomentum: alignment ? { calculationVersion: TRADE_INDICATOR_CALCULATION_VERSION, executions: events.map((event) => ({ eventId: event.eventId, executedAtUtc: event.executedAtUtc, oneMinute: { alignment }, fiveMinute: { alignment: "below" }, sessionVwap: null })) } : undefined } } as unknown as SavedPatternTrade;
}
const base = { query: new URLSearchParams("basis=gross"), timezone: "America/New_York", scopeIdentity: "owner-account-USD", pageSize: 25, cursor: null, ticker: "" };

function duringTrade(id: string, firstBand: string | null, coverage = "complete"): SavedPatternTrade {
  const source = trade(id, "above");
  const episodes = [0, 1].map((i) => ({ reference: "ema9", at: 100 + i * 100, cycle: i, price: 10,
    firstEventCoverage: coverage, recovery: "observed_reclaim", reclaimedAt: 150 + i * 100, reclaimPrice: 11,
    lossContext: firstBand === null && i === 0 ? null : { context: { rsiBand: i === 0 ? firstBand : "above_70" } },
    reclaimStudy: { context: { rsiBand: "above_70" } },
  }));
  return { ...source, analyzed: { ...source.analyzed, trendMomentum: { ...source.analyzed.trendMomentum,
    duringTrade: { oneMinute: { episodes } } } } } as unknown as SavedPatternTrade;
}

test("during drilldown uses first-event groups, not execution or later-event matches", () => {
  const sources = [duringTrade("match", "above_70"), duringTrade("nonmatch", "below_30"), duringTrade("missing", null), duringTrade("incomplete", "above_70", "incomplete")];
  const query = new URLSearchParams(duringStudyTradeQuery(new URLSearchParams("indicator_during_rsiBand=above_70&indicator_alignment=below&cursor=old&basis=net"), "long", "matching"));
  assert.equal(query.has("cursor"), false); assert.equal(query.get("basis"), "net");
  const result = pageSavedAnalyzedTrades(sources, { ...base, query });
  assert.deepEqual(result.rows.map((row) => row.roundTripId), ["match"]);
  assert.match(result.indicatorSummary!, /First reference loss/);
  query.set("indicator_during_group", "nonmatching");
  assert.deepEqual(pageSavedAnalyzedTrades(sources, { ...base, query }).rows.map((row) => row.roundTripId), ["nonmatch"]);
  query.set("indicator_during_group", "unknown");
  assert.deepEqual(pageSavedAnalyzedTrades(sources, { ...base, query }).rows.map((row) => row.roundTripId), ["missing"]);
  query.set("indicator_during_group", "matching"); query.set("indicator_coverage", "incomplete");
  assert.deepEqual(pageSavedAnalyzedTrades(sources, { ...base, query }).rows.map((row) => row.roundTripId), ["incomplete"]);
  query.set("indicator_coverage", "complete"); query.set("indicator_event", "reclaim");
  assert.equal(pageSavedAnalyzedTrades(sources, { ...base, query }).totalRowCount, 3);
  query.set("indicator_interval", "5m");
  assert.equal(pageSavedAnalyzedTrades(sources, { ...base, query }).totalRowCount, 0);
});

test("during pagination rejects changed event conditions even when matching trades stay the same", () => {
  const sources = Array.from({ length: 27 }, (_, i) => duringTrade(`during-${i}`, "above_70"));
  const query = new URLSearchParams("indicator_study=during");
  const first = pageSavedAnalyzedTrades(sources, { ...base, query });
  assert.equal(pageSavedAnalyzedTrades(sources, { ...base, query, cursor: first.continuationCursor }).rows.length, 2);
  query.set("indicator_event", "reclaim");
  assert.throws(() => pageSavedAnalyzedTrades(sources, { ...base, query, cursor: first.continuationCursor }));
});

test("analyzed index counts saved trades once, restores selected group, and links the matching execution", () => {
  const trades = [trade("matching", "above"), trade("outside", "below"), trade("missing", null)];
  assert.equal(pageSavedAnalyzedTrades(trades, base).totalRowCount, 3);
  const query = new URLSearchParams("basis=gross&indicator_alignment=above&indicator_execution=initial_entry");
  const result = pageSavedAnalyzedTrades(trades, { ...base, query });
  assert.equal(result.totalRowCount, 1);
  assert.equal(result.rows[0]!.roundTripId, "matching");
  assert.equal(result.rows[0]!.executionCount, 2);
  assert.equal(result.rows[0]!.firstExecutionId, "matching-e1");
  assert.ok(result.indicatorSummary!.includes("EMA9 vs EMA20: above"));
  query.set("indicator_group", "unknown");
  assert.equal(pageSavedAnalyzedTrades(trades, { ...base, query }).rows[0]!.roundTripId, "missing");
  query.set("indicator_group", "nonmatching");
  assert.equal(pageSavedAnalyzedTrades(trades, { ...base, query }).rows[0]!.roundTripId, "outside");
});

test("pagination ignores transport cursor parameters but rejects scope and result changes", () => {
  const trades = Array.from({ length: 27 }, (_, i) => trade(`trade-${i}`, null));
  const first = pageSavedAnalyzedTrades(trades, base);
  assert.equal(first.rows.length, 25);
  const query = new URLSearchParams(base.query); query.set("cursor", first.continuationCursor!); query.set("pageSize", "25");
  assert.equal(pageSavedAnalyzedTrades(trades, { ...base, query, cursor: first.continuationCursor }).rows.length, 2);
  assert.throws(() => pageSavedAnalyzedTrades(trades, { ...base, query, cursor: first.continuationCursor, scopeIdentity: "other-account" }));
  assert.throws(() => pageSavedAnalyzedTrades(trades.map((t) => ({ ...t, analysisVersionId: "new-revision" })), { ...base, cursor: first.continuationCursor }));
});

test("offline index retains inclusion explanation but strips trade and execution identifiers", () => {
  const page = pageSavedAnalyzedTrades([trade("private-id", "above")], { ...base, query: new URLSearchParams("indicator_alignment=above") });
  const saved = createJournalAnalyzedTradesOfflineViewModel({ page, currency: "USD", moneyBasis: "gross", dateRange: { kind: "all", startDate: null, endDate: null } });
  assert.ok(saved.page!.rows[0]!.whyIncluded);
  assert.ok(saved.page!.indicatorSummary);
  assert.ok(!JSON.stringify(saved).includes("private-id"));
  assert.equal(saved.page!.continuationCursor, null);
});

test("indicator context from a different execution time cannot qualify a saved trade", () => {
  const source = trade("time-bound", "above");
  const indicators = source.analyzed.trendMomentum!;
  const changed = { ...source, analyzed: { ...source.analyzed, trendMomentum: { ...indicators, executions: indicators.executions.map((event) => ({ ...event, executedAtUtc: "2026-09-11T13:00:00Z" })) } } };
  const result = pageSavedAnalyzedTrades([changed], { ...base, query: new URLSearchParams("indicator_alignment=above") });
  assert.equal(result.totalRowCount, 0);
});
