import { describe, expect, it } from "vitest";

import {
  buildAnalyticalDatasetReceipt,
  buildAnalyticalPartitionReceipt,
  buildAnalyticalRow,
  buildSyntheticQueryFixture,
  buildVerifiedAnalyticalDatasetDerivation,
  createInMemoryVerifiedTradeQueryDatasetSource,
  executeTradeQuery,
  tradeQueryAuthorityInput,
  type AnalyticalRow,
  type ExactMetricValue,
  type TradeQueryResultRow,
} from "../../analytics";

function metric(row: TradeQueryResultRow, key: string): ExactMetricValue {
  const found = row.metrics.find((item) => item.metricKey === key);
  if (found === undefined) throw new Error(`missing metric ${key}`);
  return found;
}

function buildCompletionChronologyFixture(reverseRows = false) {
  const base = buildSyntheticQueryFixture();
  const template = base.derived.datasetReceipt.rows[0];
  const trades = [
    { key: "completion_a", entry: "09:00:00", exit: "12:00:00", pnl: "4", direction: "long" as const },
    { key: "completion_b", entry: "10:00:00", exit: "11:00:00", pnl: "-2", direction: "short" as const },
    { key: "completion_c", entry: "10:30:00", exit: "11:30:00", pnl: "-3", direction: "short" as const },
    { key: "completion_d", entry: "11:15:00", exit: "12:00:00", pnl: "5", direction: "long" as const },
  ];
  const rows: AnalyticalRow[] = trades.map((trade, index) => {
    const { rowDigest: _rowDigest, ...content } = template;
    void _rowDigest;
    const built = buildAnalyticalRow({
      ...content,
      semanticRoundTripKey: trade.key,
      supportingOccurrenceKeys: template.supportingExecutionDigests.map((_, occurrence) =>
        `${trade.key}_occurrence_${occurrence + 1}`),
      sequenceInPartition: String(index + 1),
      stableInstrumentKey: template.stableInstrumentKey,
      displayedSymbol: trade.direction === "long" ? "LONG" : "SHORT",
      direction: trade.direction,
      firstEntryAt: `2026-07-01T${trade.entry}.000000000Z`,
      finalExitAt: `2026-07-01T${trade.exit}.000000000Z`,
      sessionDate: "2026-07-01",
      weekday: "wednesday",
      grossPnl: trade.pnl,
      signedCharges: "0",
      netPnl: trade.pnl,
      entryNotional: { state: "available", amount: "100", currency: "USD" },
      shareQuantity: { state: "available", quantity: "100" },
    });
    if (!built.ok) throw new Error(`${built.error.code}:${built.error.path}`);
    return built.value;
  });
  const dataset = buildAnalyticalDatasetReceipt({
    schemaVersion: base.derived.datasetReceipt.schemaVersion,
    snapshotDigest: base.derived.datasetReceipt.snapshotDigest,
    manifestDigest: base.derived.datasetReceipt.manifestDigest,
    filterDigest: base.derived.datasetReceipt.filterDigest,
    analysisCutoffAt: base.derived.datasetReceipt.analysisCutoffAt,
    correctionCutoffAt: base.derived.datasetReceipt.correctionCutoffAt,
    correctionResultDigest: base.derived.datasetReceipt.correctionResultDigest,
    eligibilitySetDigest: base.derived.datasetReceipt.eligibilitySetDigest,
    retrospectivePolicyDigest: base.derived.datasetReceipt.retrospectivePolicyDigest,
    evidenceNamespace: base.derived.datasetReceipt.evidenceNamespace,
    occurrenceInventoryDigest: base.derived.datasetReceipt.occurrenceInventoryDigest,
    roundTripInventoryDigest: base.derived.datasetReceipt.roundTripInventoryDigest,
    adapterKey: base.derived.datasetReceipt.adapterKey,
    adapterVersion: base.derived.datasetReceipt.adapterVersion,
    derivationPolicyKey: base.derived.datasetReceipt.derivationPolicyKey,
    derivationPolicyVersion: base.derived.datasetReceipt.derivationPolicyVersion,
    rows: reverseRows ? [...rows].reverse() : rows,
    excludedCandidates: [],
    limitations: [],
  });
  if (!dataset.ok) throw new Error(`${dataset.error.code}:${dataset.error.path}`);
  const derived = buildVerifiedAnalyticalDatasetDerivation(dataset.value);
  if (!derived.ok) throw new Error(`${derived.error.code}:${derived.error.path}`);
  const partition = buildAnalyticalPartitionReceipt({
    schemaVersion: "ti_v3_analytical_partition_v1",
    datasetReceipt: derived.value.datasetReceipt,
    currency: "USD",
  });
  if (!partition.ok) throw new Error(`${partition.error.code}:${partition.error.path}`);
  return {
    source: createInMemoryVerifiedTradeQueryDatasetSource(derived.value),
    partition: partition.value,
    plan: (grouping: "aggregate" | "direction") => ({
      ...base.plan({
        grouping: grouping === "aggregate" ? { kind: "aggregate" } : { kind: "direction" },
        metrics: ["longest_winning_trade_streak", "longest_losing_trade_streak"],
      }),
      authority: tradeQueryAuthorityInput({
        datasetReceipt: derived.value.datasetReceipt,
        datasetDerivationReceipt: derived.value.derivationReceipt,
        partitionReceipt: partition.value,
      }),
    }),
  };
}

describe("GA1-A completed-trade streak chronology", () => {
  it("uses final-exit chronology with semantic-key ties for overlapping trades", () => {
    const fixture = buildCompletionChronologyFixture();
    const aggregate = executeTradeQuery({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan("aggregate"),
    });
    expect(aggregate, JSON.stringify(aggregate)).toMatchObject({ ok: true });
    if (!aggregate.ok) return;
    expect(metric(aggregate.value.rows[0], "longest_winning_trade_streak")).toMatchObject({ value: "2" });
    expect(metric(aggregate.value.rows[0], "longest_losing_trade_streak")).toMatchObject({ value: "2" });

    const grouped = executeTradeQuery({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan("direction"),
    });
    expect(grouped, JSON.stringify(grouped)).toMatchObject({ ok: true });
    if (!grouped.ok) return;
    expect(grouped.value.rows.map((row) => [
      row.groupIdentity,
      metric(row, "longest_winning_trade_streak"),
      metric(row, "longest_losing_trade_streak"),
    ])).toMatchObject([
      ["direction:long", { value: "2" }, { value: "0" }],
      ["direction:short", { value: "0" }, { value: "2" }],
    ]);
  });

  it("is invariant to source permutation for aggregate and grouped execution", () => {
    const normal = buildCompletionChronologyFixture(false);
    const reversed = buildCompletionChronologyFixture(true);
    for (const grouping of ["aggregate", "direction"] as const) {
      const first = executeTradeQuery({
        source: normal.source, partitionReceipt: normal.partition, queryPlan: normal.plan(grouping),
      });
      const second = executeTradeQuery({
        source: reversed.source, partitionReceipt: reversed.partition, queryPlan: reversed.plan(grouping),
      });
      expect(first, JSON.stringify(first)).toMatchObject({ ok: true });
      expect(second, JSON.stringify(second)).toMatchObject({ ok: true });
      if (first.ok && second.ok) expect(second.value.resultDigest).toBe(first.value.resultDigest);
    }
  });
});
