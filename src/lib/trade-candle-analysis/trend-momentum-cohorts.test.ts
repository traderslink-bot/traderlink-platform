import assert from "node:assert/strict";
import { test } from "node:test";
import { buildIndicatorCohorts, buildIndicatorSupportingPage, DEFAULT_INDICATOR_FILTERS, parseIndicatorConditions } from "./trend-momentum-cohorts";
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

test("supporting pages keep complete counts and stable execution ties with bounded limits", () => {
  const records = Array.from({ length: 31 }, (_, i) => ({ ...record("a", `execution-${String(i).padStart(2, "0")}`, "above", "above_70"),
    direction: "long" as const, executedAtUtc: "2026-09-11T14:00:00.000Z", executionSequence: i }));
  const projection = { records: [...records].reverse(), trades: [{ tradeId: "a", direction: "long" }] } as unknown as TrendMomentumProjection;
  const query = new URLSearchParams("indicator_execution=add");
  const first = buildIndicatorSupportingPage(projection, query, "long");
  assert.equal(first.rows.length, 25);
  assert.equal(first.totalRows, 31);
  assert.equal(first.totalTrades, 1);
  assert.equal(first.rows[0].executionId, "execution-00");
  query.set("indicator_page", "2");
  const second = buildIndicatorSupportingPage(projection, query, "long");
  assert.equal(second.rows.length, 6);
  assert.equal(second.rows[0].executionId, "execution-25");
  assert.equal(new Set([...first.rows, ...second.rows].map((row) => row.executionId)).size, 31);
  query.set("indicator_page", "999");
  query.set("indicator_size", "10000000");
  assert.equal(buildIndicatorSupportingPage(projection, query, "long").page, 2);
  assert.equal(buildIndicatorSupportingPage(projection, query, "long").pageSize, 25);
  assert.equal(buildIndicatorSupportingPage(projection, query, "short").totalRows, 0);
  const changed = buildIndicatorSupportingPage({ ...projection, records: records.slice(0, 1) }, query, "long");
  assert.equal(changed.page, 1);
  assert.equal(changed.totalRows, 1);
});
