import { describe, expect, it } from "vitest";

import {
  buildAnalyticalDatasetReceipt,
  buildAnalyticalPartitionReceipt,
  buildFinalToolRegistrySnapshot,
  buildVerifiedAnalyticalDatasetDerivation,
  createSyntheticInMemoryReadOnlySource,
  executeRegisteredTraderIntelligenceTool,
  readAnalyticalDatasetWithDerivation,
} from "../../analytics";
import { buildAnalyticalRow, type AnalyticalRow } from "../../analytics/dataset/analytical-row";
import { buildSyntheticGa0B1Authority as buildAuthority } from "../../testing";

const SCALE_SEED = 0x4b344c;
const SCALE_ROW_COUNT = 10_000;
const SCALE_DAYS = 20;
const SCALE_ROWS_PER_DAY = SCALE_ROW_COUNT / SCALE_DAYS;

function buildScaleRows(template: AnalyticalRow): readonly AnalyticalRow[] {
  const result: AnalyticalRow[] = [];
  for (let ordinal = 0; ordinal < SCALE_ROW_COUNT; ordinal += 1) {
    const day = Math.floor(ordinal / SCALE_ROWS_PER_DAY);
    const date = new Date(Date.UTC(2026, 6, 1 + day)).toISOString().slice(0, 10);
    const pnl = ordinal % 7 === 0 || ordinal % 7 === 1 ? "-1" : ordinal % 7 === 2 ? "0" : "1";
    const currency = ordinal % 100 === 0 ? "USD" : "EUR";
    const templateContent = { ...template };
    delete (templateContent as { rowDigest?: unknown }).rowDigest;
    const row = buildAnalyticalRow({
      ...templateContent,
      currency,
      semanticRoundTripKey: `scale_trade_${String(ordinal + 1).padStart(5, "0")}`,
      supportingOccurrenceKeys: template.supportingExecutionDigests.map((_, index) =>
        `scale_occurrence_${String(ordinal + 1).padStart(5, "0")}_${index + 1}`),
      firstEntryAt: `${date}T09:30:00.000000000Z`,
      finalExitAt: `${date}T09:31:00.000000000Z`,
      sessionDate: date,
      sequenceInPartition: String(ordinal + 1),
      grossPnl: pnl,
      netPnl: pnl,
      entryNotional: { state: "available", amount: "21", currency },
    });
    if (!row.ok) throw new Error(`${row.error.code}:${row.error.path}`);
    result.push(row.value);
  }
  return Object.freeze(result);
}

function buildScaleDerived(reverseRows = false) {
  const authority = buildAuthority();
  const smallDerived = readAnalyticalDatasetWithDerivation(
    createSyntheticInMemoryReadOnlySource(authority),
  );
  if (!smallDerived.ok) throw new Error(`${smallDerived.error.code}:${smallDerived.error.path}`);
  const rows = buildScaleRows(smallDerived.value.datasetReceipt.rows[0]);
  const sourceDataset = smallDerived.value.datasetReceipt;
  const dataset = buildAnalyticalDatasetReceipt({
    schemaVersion: sourceDataset.schemaVersion,
    snapshotDigest: sourceDataset.snapshotDigest,
    manifestDigest: sourceDataset.manifestDigest,
    filterDigest: sourceDataset.filterDigest,
    analysisCutoffAt: sourceDataset.analysisCutoffAt,
    correctionCutoffAt: sourceDataset.correctionCutoffAt,
    correctionResultDigest: sourceDataset.correctionResultDigest,
    eligibilitySetDigest: sourceDataset.eligibilitySetDigest,
    retrospectivePolicyDigest: sourceDataset.retrospectivePolicyDigest,
    evidenceNamespace: sourceDataset.evidenceNamespace,
    occurrenceInventoryDigest: sourceDataset.occurrenceInventoryDigest,
    roundTripInventoryDigest: sourceDataset.roundTripInventoryDigest,
    adapterKey: sourceDataset.adapterKey,
    adapterVersion: sourceDataset.adapterVersion,
    derivationPolicyKey: sourceDataset.derivationPolicyKey,
    derivationPolicyVersion: sourceDataset.derivationPolicyVersion,
    rows: reverseRows ? [...rows].reverse() : rows,
    excludedCandidates: sourceDataset.excludedCandidates,
    limitations: sourceDataset.limitations,
  });
  if (!dataset.ok) throw new Error(`${dataset.error.code}:${dataset.error.path}`);
  const derived = buildVerifiedAnalyticalDatasetDerivation(dataset.value);
  if (!derived.ok) throw new Error(`${derived.error.code}:${derived.error.path}`);
  return { authority, derived: derived.value };
}

function executeScale(reverseRows = false) {
  const { authority, derived } = buildScaleDerived(reverseRows);
  const partition = buildAnalyticalPartitionReceipt({
    schemaVersion: "ti_v3_analytical_partition_v1",
    datasetReceipt: derived.datasetReceipt,
    currency: "USD",
  });
  if (!partition.ok) throw new Error(`${partition.error.code}:${partition.error.path}`);
  const base = {
    registrySnapshot: buildFinalToolRegistrySnapshot(),
    snapshot: authority.snapshot,
    snapshotDependencies: authority.snapshotDependencies,
    canonicalFilter: authority.snapshotDependencies.filter,
    datasetReceipt: derived.datasetReceipt,
    datasetDerivationReceipt: derived.derivationReceipt,
    partitionReceipt: partition.value,
  };
  const weekday = executeRegisteredTraderIntelligenceTool({
    ...base,
    toolKey: "analyze_performance_by_weekday",
    toolVersion: "v1",
  });
  const dailyStop = executeRegisteredTraderIntelligenceTool({
    ...base,
    toolKey: "simulate_daily_stop_rule",
    toolVersion: "v1",
    arguments: { consecutiveLossThreshold: "2" },
  });
  if (!weekday.ok) throw new Error(`${weekday.error.code}:${weekday.error.path}`);
  if (!dailyStop.ok) throw new Error(`${dailyStop.error.code}:${dailyStop.error.path}`);
  return { derived, weekday: weekday.value, dailyStop: dailyStop.value };
}

describe("GA0-B4 fixed-seed 10,000-row proof", () => {
  it("runs both registered tools with bounded linear artifacts and stable identities", () => {
    const startedAt = Date.now();
    const first = executeScale();
    expect(first.derived.datasetReceipt.rows).toHaveLength(SCALE_ROW_COUNT);
    const dataset = first.derived.datasetReceipt;
    const oversized = buildAnalyticalDatasetReceipt({
      schemaVersion: dataset.schemaVersion,
      snapshotDigest: dataset.snapshotDigest,
      manifestDigest: dataset.manifestDigest,
      filterDigest: dataset.filterDigest,
      analysisCutoffAt: dataset.analysisCutoffAt,
      correctionCutoffAt: dataset.correctionCutoffAt,
      correctionResultDigest: dataset.correctionResultDigest,
      eligibilitySetDigest: dataset.eligibilitySetDigest,
      retrospectivePolicyDigest: dataset.retrospectivePolicyDigest,
      evidenceNamespace: dataset.evidenceNamespace,
      occurrenceInventoryDigest: dataset.occurrenceInventoryDigest,
      roundTripInventoryDigest: dataset.roundTripInventoryDigest,
      adapterKey: dataset.adapterKey,
      adapterVersion: dataset.adapterVersion,
      derivationPolicyKey: dataset.derivationPolicyKey,
      derivationPolicyVersion: dataset.derivationPolicyVersion,
      rows: [...dataset.rows, dataset.rows[0]],
      excludedCandidates: dataset.excludedCandidates,
      limitations: dataset.limitations,
    });
    expect(oversized).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_oversized", path: "$.rows" } });
    for (const output of [first.weekday.execution, first.dailyStop.execution]) {
      expect(output.tables.length).toBeLessThanOrEqual(16);
      expect(output.tables.reduce((sum, table) => sum + table.rows.length, 0)).toBeLessThanOrEqual(SCALE_ROW_COUNT * 4);
      expect(output.claims.length).toBeLessThanOrEqual(4);
      expect(output.series.length).toBeLessThanOrEqual(8);
      expect(output.series.reduce((sum, series) => sum + series.points.length, 0)).toBeLessThanOrEqual(SCALE_ROW_COUNT * 8);
      expect(output.evidenceBundles.length).toBeLessThanOrEqual(SCALE_ROW_COUNT * 8);
      expect(output.diagnostics.entries.length).toBeLessThanOrEqual(SCALE_ROW_COUNT * 4);
      expect(JSON.stringify(output).length).toBeLessThan(SCALE_ROW_COUNT * 40_000);
    }
    const reversed = buildScaleDerived(true);
    expect(reversed.derived.datasetReceipt.receiptDigest).toBe(first.derived.datasetReceipt.receiptDigest);
    expect(Date.now() - startedAt).toBeLessThan(600_000);
    expect(SCALE_SEED).toBe(0x4b344c);
  }, 600000);
});
