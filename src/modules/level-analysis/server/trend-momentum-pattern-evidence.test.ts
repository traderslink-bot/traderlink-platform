import assert from "node:assert/strict";
import { test } from "vitest";
import { pageSavedPatternEvidence, patternEvidenceRow, resolveSavedPatternEvidence } from "./trend-momentum-pattern-evidence";
import type { SavedPatternObservation } from "../../../lib/trade-candle-analysis/trend-momentum-patterns";
import { createJournalTradeAnalyzerOfflineViewModel } from "../../journal-analytics/contracts/journal-analytics-offline-view-contracts";

const rows = Array.from({ length: 27 }, (_, index) => ({ occurrenceKey: `trade:revision:${index}`, tradeId: "group", representativeRoundTripId: "member", analysisVersionId: "revision", eventId: `e${index}`,
  eventSequence: index, eventKind: index === 0 ? "temporary_flat" : "entry", executedAtUtc: "2026-09-11T14:00:00Z", patternSequence: 0,
  pattern: "hammer", direction: "long", symbol: "TEST", timeframe: "1m", candlesBeforeExecution: 1,
  pnlDecimal: "7", returnPercentDecimal: "10", indicatorFilterContext: null,
})) as unknown as SavedPatternObservation[];
const options = { filters: { interval: "1m", alignment: "any", rsiBand: "any" }, pattern: "hammer", ticker: "", direction: "long",
  timeframe: "all", execution: "all", location: "all", pageSize: 25, cursor: null, currency: "USD", timezone: "America/New_York", selectionIdentity: "scope:dates:basis" } as const;

test("bounded evidence pages retain full totals and stable exact occurrence references", () => {
  const first = pageSavedPatternEvidence(rows, options);
  assert.equal(first.rows.length, 25);
  assert.equal(first.totalRowCount, 27);
  assert.equal(first.rows[0]!.eventKind, "temporary_flat");
  const second = pageSavedPatternEvidence(rows, { ...options, cursor: first.continuationCursor });
  assert.equal(second.rows.length, 2);
  assert.equal(second.continuationCursor, null);
  assert.notEqual(first.rows.at(-1)!.occurrenceRef, second.rows[0]!.occurrenceRef);
  assert.equal(resolveSavedPatternEvidence(rows, first.rows[0]!.occurrenceRef).occurrenceKey, rows[0]!.occurrenceKey);
});

test("changed scope, filters, results and revision invalidate cursors or references", () => {
  const first = pageSavedPatternEvidence(rows, options);
  assert.throws(() => pageSavedPatternEvidence(rows, { ...options, cursor: first.continuationCursor, selectionIdentity: "other-account" }));
  assert.throws(() => pageSavedPatternEvidence(rows, { ...options, cursor: first.continuationCursor, execution: "entry" }));
  assert.throws(() => pageSavedPatternEvidence(rows.map((row) => ({ ...row, pnlDecimal: "8" })), { ...options, cursor: first.continuationCursor }));
  assert.throws(() => resolveSavedPatternEvidence(rows.slice(1), first.rows[0]!.occurrenceRef));
  assert.throws(() => resolveSavedPatternEvidence(rows, "not-json"));
});

test("same indicator conditions apply to paged evidence and missing data remains excluded only when required", () => {
  assert.equal(patternEvidenceRow(rows[0]!, "CAD").roundTripId, "member");
  assert.equal(rows[0]!.tradeId, "group");
  assert.equal(pageSavedPatternEvidence(rows, { ...options, filters: { ...options.filters, alignment: "above" } }).totalRowCount, 0);
  assert.equal(pageSavedPatternEvidence(rows, { ...options, execution: "exit" }).totalRowCount, 1);
  assert.equal(patternEvidenceRow({ ...rows[0]!, pnlDecimal: null }, "CAD").resultDecimal, null);
});

test("offline pattern records redact saved trade, execution and revision identifiers without mutating source", () => {
  const privateRow = { ...rows[0]!, tradeId: "private-trade", representativeRoundTripId: "private-member", analysisVersionId: "private-revision", eventId: "private-event", occurrenceKey: "private-compound-key" };
  const model = { patternObservations: [privateRow], eventPaths: [], executionContextRows: [], excursions: [], greenToRedOpportunity: { rows: [] },
    meaningfulProfit: { rows: [] }, profitZones: { recordsByDirection: { long: [], short: [] } }, scalingOut: { rows: [] }, trades: [] };
  const saved = createJournalTradeAnalyzerOfflineViewModel({ model, dateRange: { kind: "all", startDate: null, endDate: null }, evidenceQuery: {}, view: "candle-patterns",
    selectionQuery: "movement_alignment=above&indicator_event=reclaim&trade=private-trade&cursor=private-cursor" } as unknown as Parameters<typeof createJournalTradeAnalyzerOfflineViewModel>[0]);
  assert.ok(!JSON.stringify(saved).includes("private-"));
  assert.equal(saved.model.patternObservations![0]!.pattern, privateRow.pattern);
  assert.equal(new URLSearchParams(saved.selectionQuery).get("movement_alignment"), "above");
  assert.equal(new URLSearchParams(saved.selectionQuery).get("indicator_event"), "reclaim");
  assert.equal(privateRow.tradeId, "private-trade");
});
