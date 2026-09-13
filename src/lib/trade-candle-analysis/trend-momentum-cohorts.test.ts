import assert from "node:assert/strict";
import { test } from "node:test";
import { buildIndicatorCohorts, DEFAULT_INDICATOR_FILTERS, parseIndicatorConditions } from "./trend-momentum-cohorts";
import type { TrendMomentumProjection, TrendMomentumRecord } from "./trend-momentum-analytics";

function record(tradeId: string, executionId: string, alignment: string | null, rsiBand: string | null): TrendMomentumRecord {
  return { tradeId, executionId, executionKind: "add", executionPriceDecimal: "10", pnlDecimal: "10", returnPercentDecimal: "5",
    context: { oneMinute: { alignment, rsiBand }, sessionVwap: { value: 10 } } } as unknown as TrendMomentumRecord;
}
test("conditions match one execution; trade cohorts and outcomes remain exclusive", () => {
  const records = [record("a", "a1", "above", "below_30"), record("a", "a2", "below", "above_70"),
    record("b", "b1", "below", null), record("c", "c1", "above", "above_70"), record("c", "c2", "above", "above_70")];
  const projection = { records, trades: ["a", "b", "c", "d"].map((tradeId) => ({ tradeId })) } as unknown as TrendMomentumProjection;
  const result = buildIndicatorCohorts(projection, "1m", "add", { ...DEFAULT_INDICATOR_FILTERS, alignment: "above", rsiBand: "above_70" });
  assert.equal(result.matching.summary.tradeCount, 1);
  assert.equal(result.matching.summary.occurrenceCount, 2);
  assert.equal(result.matching.summary.totalPnlDecimal, "10");
  assert.equal(result.matching.summary.averageReturnPercent, 5);
  assert.deepEqual(result.nonmatching.rows.map((row) => row.tradeId), ["a", "a"]);
  assert.deepEqual(result.unknown.rows.map((row) => row.tradeId), ["b"]);
  assert.deepEqual(result.outsideTradeIds, ["d"]);
});
test("known matching execution wins over another unknown execution", () => {
  const records = [record("a", "a1", "above", "above_70"), record("a", "a2", null, null)];
  const projection = { records, trades: [{ tradeId: "a" }] } as unknown as TrendMomentumProjection;
  const result = buildIndicatorCohorts(projection, "1m", "add", { ...DEFAULT_INDICATOR_FILTERS, alignment: "above", rsiBand: "above_70" });
  assert.equal(result.matching.summary.tradeCount, 1);
  assert.equal(result.matching.rows.length, 1);
  assert.equal(result.unknown.summary.tradeCount, 0);
});
test("URL conditions accept known values only", () => {
  assert.deepEqual(parseIndicatorConditions(new URLSearchParams("indicator_alignment=invalid&indicator_rsiBand=above_70")),
    { ...DEFAULT_INDICATOR_FILTERS, rsiBand: "above_70" });
});
