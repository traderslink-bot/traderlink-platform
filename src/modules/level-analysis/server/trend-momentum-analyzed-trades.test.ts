import assert from "node:assert/strict";
import { test } from "node:test";
import { pageSavedAnalyzedTrades } from "./trend-momentum-analyzed-trades";
import type { SavedPatternTrade } from "../../../lib/trade-candle-analysis/trend-momentum-patterns";
import { createJournalAnalyzedTradesOfflineViewModel } from "../../journal-analytics/contracts/journal-analytics-offline-view-contracts";

function trade(id: string, alignment: "above" | "below" | null): SavedPatternTrade {
  const events = [1, 2].map((sequence) => ({ eventId: `${id}-e${sequence}`, sequence, kind: sequence === 1 ? "entry" : "final_exit", executedAtUtc: `2026-09-11T14:0${sequence}:00Z`, priceDecimal: "10" }));
  return { tradeId: id, analysisVersionId: "revision", representativeRoundTripId: "member", symbol: "TEST", direction: "long", closeDate: "2026-09-11", trackerDate: "2026-09-11",
    openedAtUtc: events[0]!.executedAtUtc, closedAtUtc: events[1]!.executedAtUtc, pnlDecimal: "5", returnPercentDecimal: "10",
    analyzed: { eventSnapshots: events.map((event) => ({ event })), trendMomentum: alignment ? { executions: events.map((event) => ({ eventId: event.eventId, executedAtUtc: event.executedAtUtc, oneMinute: { alignment }, fiveMinute: { alignment: "below" }, sessionVwap: null })) } : undefined } } as unknown as SavedPatternTrade;
}
const base = { query: new URLSearchParams("basis=gross"), timezone: "America/New_York", scopeIdentity: "owner-account-USD", pageSize: 25, cursor: null, ticker: "" };

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
