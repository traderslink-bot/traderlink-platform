import assert from "node:assert/strict";
import { test } from "vitest";
import { savedPatternObservations, summarizeSavedPatterns, type SavedPatternTrade } from "./trend-momentum-patterns";

const at = Date.parse("2026-09-11T14:00:30Z") / 1000;
const pattern = { availableAtExecution: true, candlesBeforeExecution: 1, kind: "hammer", knownAtTime: at - 30, time: at - 90, timeframe: "1m" };
function trade(id: string, pnl: string | null): SavedPatternTrade {
  return { tradeId: id, analysisVersionId: "revision", representativeRoundTripId: "member", symbol: "TEST", direction: "long", closeDate: "2026-09-11", trackerDate: "2026-09-11", pnlDecimal: pnl, returnPercentDecimal: null,
    analyzed: { eventSnapshots: [1, 2].map((sequence) => ({ event: { eventId: `e${sequence}`, sequence, kind: "entry", executedAtUtc: new Date(at * 1000).toISOString() }, patterns: [pattern] })) } } as unknown as SavedPatternTrade;
}
const any = { interval: "1m", alignment: "any", rsiBand: "any" } as const;

test("multiple entries within one saved trade contribute occurrences but only one financial result", () => {
  const observations = savedPatternObservations([trade("group", "12"), trade("other", "-4"), trade("missing", null)]);
  const result = summarizeSavedPatterns(observations, any).rows[0]!;
  assert.equal(result.occurrenceCount, 6);
  assert.equal(result.tradeCount, 3);
  assert.equal(result.pnlTradeCount, 2);
  assert.equal(result.totalPnlDecimal, "8");
  assert.equal(result.averagePnlDecimal, "4");
  assert.equal(result.winRatePercent, 50);
  assert.equal(new Set(observations.map((row) => row.occurrenceKey)).size, 6);
});

test("future and unavailable patterns are excluded without changing before-execution labels", () => {
  const source = trade("group", "1");
  const event = source.analyzed.eventSnapshots[0]!;
  const analyzed = { eventSnapshots: [{ ...event, patterns: [pattern, { ...pattern, knownAtTime: at + 1 }, { ...pattern, availableAtExecution: false }, { ...pattern, timeframe: "15m" }] }] } as unknown as SavedPatternTrade["analyzed"];
  const observations = savedPatternObservations([{ ...source, analyzed }]);
  assert.equal(observations.length, 1);
  assert.equal(observations[0]!.candlesBeforeExecution, 1);
  assert.equal(summarizeSavedPatterns(observations, any).rows[0]!.location, "Before execution");
  assert.throws(() => savedPatternObservations([source, source]), /duplicate_saved_pattern_trade/);
});

test("missing execution indicator context is separate from matching and financial zero", () => {
  const observations = savedPatternObservations([trade("unknown", null)]);
  const filtered = summarizeSavedPatterns(observations, { ...any, alignment: "above" });
  assert.equal(filtered.unavailableOccurrenceCount, 2);
  assert.equal(filtered.matching.length, 0);
  assert.equal(filtered.nonmatchingOccurrenceCount, 0);
  const summary = summarizeSavedPatterns(observations, any).rows[0]!;
  assert.equal(summary.totalPnlDecimal, null);
  assert.equal(summary.winRatePercent, null);
});
