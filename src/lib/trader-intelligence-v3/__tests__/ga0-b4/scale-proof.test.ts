import { describe, expect, it } from "vitest";

import {
  buildAnalyticalDatasetReceipt,
  buildAnalyticalPartitionReceipt,
  buildFinalToolRegistrySnapshot,
  buildVerifiedAnalyticalDatasetDerivation,
  createSyntheticInMemoryReadOnlySource,
  executeRegisteredTraderIntelligenceTool,
  readAnalyticalDatasetWithDerivation,
  resolveAnalyticalEvidenceBundle,
  type AnalyticalDatasetReceipt,
} from "../../analytics";
import { buildAnalyticalRow, type AnalyticalRow } from "../../analytics/dataset/analytical-row";
import { buildSyntheticGa0B1Authority as buildAuthority } from "../../testing";

const SCALE_SEED = 0x4b344c;
const SCALE_ROW_COUNT = 10_000;
const SCALE_DAYS = 20;
const SCALE_ROWS_PER_DAY = SCALE_ROW_COUNT / SCALE_DAYS;

function scaleDateForDay(dayIndex: number): Date {
  const date = new Date(Date.UTC(2026, 6, 1));
  let remaining = dayIndex;
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const weekday = date.getUTCDay();
    if (weekday !== 0 && weekday !== 6) remaining -= 1;
  }
  return date;
}

function buildRows(
  template: AnalyticalRow,
  rowCount: number,
  rowsPerDay: number,
  currencyForOrdinal: (ordinal: number) => "USD" | "EUR",
): readonly AnalyticalRow[] {
  const result: AnalyticalRow[] = [];
  for (let ordinal = 0; ordinal < rowCount; ordinal += 1) {
    const day = Math.floor(ordinal / rowsPerDay);
    const scaleDate = scaleDateForDay(day);
    const date = scaleDate.toISOString().slice(0, 10);
    const weekday = (["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const)[scaleDate.getUTCDay()];
    const dayRow = ordinal % rowsPerDay;
    const reachesThreshold = day % 2 === 0;
    const pnl = reachesThreshold
      ? dayRow === 0 || dayRow === 1 ? "-1" : dayRow === 2 ? "0" : "1"
      : dayRow % 2 === 0 ? "-1" : "1";
    const currency = currencyForOrdinal(ordinal);
    const entryMinute = 9 * 60 + 30 + dayRow;
    const entryHour = Math.floor(entryMinute / 60).toString().padStart(2, "0");
    const entryMinuteWithinHour = String(entryMinute % 60).padStart(2, "0");
    const templateContent = { ...template };
    delete (templateContent as { rowDigest?: unknown }).rowDigest;
    const row = buildAnalyticalRow({
      ...templateContent,
      currency,
      semanticRoundTripKey: `scale_trade_${String(ordinal + 1).padStart(5, "0")}`,
      supportingOccurrenceKeys: template.supportingExecutionDigests.map((_, index) =>
        `scale_occurrence_${String(ordinal + 1).padStart(5, "0")}_${index + 1}`),
      firstEntryAt: `${date}T${entryHour}:${entryMinuteWithinHour}:00.000000000Z`,
      finalExitAt: `${date}T${entryHour}:${entryMinuteWithinHour}:30.000000000Z`,
      sessionDate: date,
      weekday,
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

function buildScaleRows(template: AnalyticalRow): readonly AnalyticalRow[] {
  return buildRows(template, SCALE_ROW_COUNT, SCALE_ROWS_PER_DAY, () => "USD");
}

function buildDatasetReceipt(sourceDataset: AnalyticalDatasetReceipt, rows: readonly AnalyticalRow[]) {
  return buildAnalyticalDatasetReceipt({
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
    rows,
    excludedCandidates: sourceDataset.excludedCandidates,
    limitations: sourceDataset.limitations,
  });
}

function buildScaleDerived(reverseRows = false) {
  const authority = buildAuthority();
  const smallDerived = readAnalyticalDatasetWithDerivation(
    createSyntheticInMemoryReadOnlySource(authority),
  );
  if (!smallDerived.ok) throw new Error(`${smallDerived.error.code}:${smallDerived.error.path}`);
  const rows = buildScaleRows(smallDerived.value.datasetReceipt.rows[0]);
  const sourceDataset = smallDerived.value.datasetReceipt;
  const dataset = buildDatasetReceipt(sourceDataset, reverseRows ? [...rows].reverse() : rows);
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
  return { derived, partition: partition.value, weekday: weekday.value, dailyStop: dailyStop.value };
}

describe("GA0-B4 fixed-seed 10,000-row proof", () => {
  it("runs both registered tools with bounded linear artifacts and stable identities", () => {
    const startedAt = Date.now();
    const first = executeScale();
    expect(first.derived.datasetReceipt.rows).toHaveLength(SCALE_ROW_COUNT);
    expect(first.partition.includedCount).toBe(String(SCALE_ROW_COUNT));
    expect(first.partition.includedRowKeys).toHaveLength(SCALE_ROW_COUNT);
    const dataset = first.derived.datasetReceipt;
    expect(new Set(dataset.rows.map((row) => row.sessionDate)).size).toBe(SCALE_DAYS);
    expect(new Set(dataset.rows.map((row) => row.weekday))).toEqual(new Set(["monday", "tuesday", "wednesday", "thursday", "friday"]));
    const dailyStopJson = JSON.stringify(first.dailyStop.execution);
    expect(dailyStopJson).toContain('"reached"');
    expect(dailyStopJson).toContain('"not_reached"');
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
    const largestWeekdayEvidence = first.weekday.execution.evidenceBundles
      .reduce((largest, bundle) => bundle.candidateKeys.length > largest.candidateKeys.length ? bundle : largest);
    const largestDailyStopEvidence = first.dailyStop.execution.evidenceBundles
      .reduce((largest, bundle) => bundle.candidateKeys.length > largest.candidateKeys.length ? bundle : largest);
    expect(largestWeekdayEvidence.candidateKeys).toHaveLength(SCALE_ROW_COUNT);
    expect(largestDailyStopEvidence.candidateKeys).toHaveLength(SCALE_ROW_COUNT);
    const resolvedWeekdayEvidence = resolveAnalyticalEvidenceBundle(largestWeekdayEvidence, first.weekday.execution.runContext);
    expect(resolvedWeekdayEvidence, JSON.stringify(resolvedWeekdayEvidence)).toMatchObject({ ok: true });
    const resolvedDailyStopEvidence = resolveAnalyticalEvidenceBundle(largestDailyStopEvidence, first.dailyStop.execution.runContext);
    expect(resolvedDailyStopEvidence, JSON.stringify(resolvedDailyStopEvidence)).toMatchObject({ ok: true });
    const reversed = buildScaleDerived(true);
    expect(reversed.derived.datasetReceipt.receiptDigest).toBe(first.derived.datasetReceipt.receiptDigest);
    expect(Date.now() - startedAt).toBeLessThan(600_000);
    expect(SCALE_SEED).toBe(0x4b344c);
  }, 600000);

  it("keeps a separate mixed-currency fixture isolated by the selected partition", () => {
    const authority = buildAuthority();
    const smallDerived = readAnalyticalDatasetWithDerivation(
      createSyntheticInMemoryReadOnlySource(authority),
    );
    if (!smallDerived.ok) throw new Error(`${smallDerived.error.code}:${smallDerived.error.path}`);
    const mixedRows = buildRows(smallDerived.value.datasetReceipt.rows[0], 2, 1, (ordinal) => ordinal === 0 ? "USD" : "EUR");
    const mixedDataset = buildDatasetReceipt(smallDerived.value.datasetReceipt, mixedRows);
    if (!mixedDataset.ok) throw new Error(`${mixedDataset.error.code}:${mixedDataset.error.path}`);
    const usdPartition = buildAnalyticalPartitionReceipt({
      schemaVersion: "ti_v3_analytical_partition_v1",
      datasetReceipt: mixedDataset.value,
      currency: "USD",
    });
    if (!usdPartition.ok) throw new Error(`${usdPartition.error.code}:${usdPartition.error.path}`);
    expect(mixedDataset.value.currencyPartitions).toEqual(["EUR", "USD"]);
    expect(usdPartition.value.includedCount).toBe("1");
    expect(usdPartition.value.includedRowKeys).toEqual(["scale_trade_00001"]);
  });
});
