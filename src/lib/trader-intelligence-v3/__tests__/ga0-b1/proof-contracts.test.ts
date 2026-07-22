import { describe, expect, it } from "vitest";

import {
  ANALYSIS_RUN_CONTEXT_VERSION,
  ANALYSIS_RUN_RECEIPT_VERSION,
  ANALYTICAL_DIAGNOSTICS_VERSION,
  ANALYTICAL_EVIDENCE_BUNDLE_VERSION,
  CHART_READY_SERIES_VERSION,
  EXACT_METRIC_VALUE_VERSION,
  EXACT_TABLE_VERSION,
  TOOL_REGISTRY_ENTRY_VERSION,
  TOOL_REGISTRY_SNAPSHOT_VERSION,
  VALIDATED_CLAIM_VERSION,
  buildAnalysisRunContext,
  buildAnalysisRunReceipt,
  buildAnalyticalDiagnostics,
  buildAnalyticalEvidenceBundle,
  buildChartReadySeries,
  buildExactMetricValue,
  buildExactTable,
  buildToolRegistryEntry,
  buildToolRegistrySnapshot,
  buildValidatedClaim,
  verifyAnalysisRunContext,
  verifyAnalysisRunReceipt,
  verifyAnalyticalDiagnostics,
  verifyAnalyticalEvidenceBundle,
  verifyChartReadySeries,
  verifyExactMetricValue,
  verifyExactTable,
  verifyToolRegistrySnapshot,
  verifyValidatedClaim,
} from "../../analytics";
import { createCanonicalContentIdentity } from "../../domain";

function identity(domain: Parameters<typeof createCanonicalContentIdentity>[0], value: string) {
  const result = createCanonicalContentIdentity(domain, "v1", { value });
  if (!result.ok) throw new Error(result.error.code);
  return result.value.identifier;
}

function metric(metricKey = "net_pnl", value = "4.5", currency: string | null = "USD") {
  const result = buildExactMetricValue({
    schemaVersion: EXACT_METRIC_VALUE_VERSION,
    metricKey,
    kind: "exact_decimal",
    unit: "money",
    currency,
    value,
  });
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

function proofFixture() {
  const contextResult = buildAnalysisRunContext({
    schemaVersion: ANALYSIS_RUN_CONTEXT_VERSION,
    toolKey: "contract_fixture_tool",
    toolVersion: "v1",
    toolPolicyVersion: "v1",
    snapshotDigest: identity("analysis_snapshot", "snapshot"),
    filterDigest: identity("canonical_filter", "filter"),
    datasetReceiptDigest: identity("analytical_dataset", "dataset"),
    normalizedArgumentsDigest: identity("canonical_content", "arguments"),
    eligibilityState: "eligible",
  });
  if (!contextResult.ok) throw new Error(contextResult.error.code);
  const context = contextResult.value;
  const evidenceResult = buildAnalyticalEvidenceBundle({
    schemaVersion: ANALYTICAL_EVIDENCE_BUNDLE_VERSION,
    evidenceKey: "fixture_evidence",
    runContext: context,
    comparisonGroupKey: "all_included",
    inclusionState: "included",
    roundTripKeys: ["round_trip:one"],
    occurrenceKeys: ["occurrence:one"],
    limitationCodes: [],
  });
  if (!evidenceResult.ok) throw new Error(evidenceResult.error.code);
  const evidence = evidenceResult.value;
  const value = metric();
  const tableResult = buildExactTable({
    schemaVersion: EXACT_TABLE_VERSION,
    tableKey: "fixture_exact_table",
    tableVersion: "v1",
    runContext: context,
    titlePurposeCode: "fixture_contract_validation",
    currency: "USD",
    timezone: "UTC",
    dateBasis: "trade_close_date",
    denominatorPolicy: "all_included_trades",
    columns: [{ columnKey: "net_pnl", valueKind: "exact_decimal", unit: "money" }],
    rows: [{ rowKey: "fixture_row", cells: [{ columnKey: "net_pnl", metric: value }], evidenceBundleDigest: evidence.bundleDigest }],
    summaryRows: [],
    includedCount: "1",
    excludedCount: "0",
    coverageEligibilityState: "eligible",
    limitationCodes: [],
    evidenceBundles: [evidence],
  });
  if (!tableResult.ok) throw new Error(tableResult.error.code);
  return { context, evidence, value, table: tableResult.value };
}

describe("GA0-B1 exact metric contract", () => {
  it.each([
    [{ kind: "exact_decimal", value: "1.25", unit: "money", currency: "USD" }],
    [{ kind: "exact_ratio", value: null, numerator: "1", denominator: "3", unit: "money_per_trade", currency: "USD" }],
    [{ kind: "integer", value: "12", unit: "trades", currency: null }],
    [{ kind: "duration", value: null, nanoseconds: "1000", unit: "nanoseconds", currency: null }],
    [{ kind: "timestamp", value: "2026-07-18T14:00:00.000000000Z", timezone: "UTC", dateBasis: "trade_close_date", unit: "timestamp", currency: null }],
    [{ kind: "date", value: "2026-07-18", timezone: "UTC", dateBasis: "trade_close_date", unit: "date", currency: null }],
    [{ kind: "enum", value: "friday", unit: "weekday", currency: null }],
    [{ kind: "unavailable", value: null, reasonCode: "ti_v3_fixture_unavailable", unit: "money", currency: "USD" }],
  ])("builds and re-verifies exact metric kind %#", (fields) => {
    const built = buildExactMetricValue({ schemaVersion: EXACT_METRIC_VALUE_VERSION, metricKey: "fixture_metric", ...fields });
    expect(built).toMatchObject({ ok: true });
    if (built.ok) {
      expect(verifyExactMetricValue(built.value)).toMatchObject({ ok: true });
      expect(Object.isFrozen(built.value)).toBe(true);
    }
  });

  it("rejects malformed ratios, unknown fields, unsafe objects, cycles, symbols, and digest tampering", () => {
    expect(buildExactMetricValue({ schemaVersion: EXACT_METRIC_VALUE_VERSION, metricKey: "bad", kind: "exact_ratio", unit: "ratio", currency: null, value: null, numerator: "2", denominator: "4" })).toMatchObject({ ok: false });
    expect(buildExactMetricValue({ schemaVersion: EXACT_METRIC_VALUE_VERSION, metricKey: "bad", kind: "integer", unit: "count", currency: null, value: "1", extra: "no" })).toMatchObject({ ok: false, error: { code: "ti_v3_validation_extra_field" } });
    const accessor = Object.defineProperty({}, "schemaVersion", { enumerable: true, get: () => EXACT_METRIC_VALUE_VERSION });
    expect(buildExactMetricValue(accessor)).toMatchObject({ ok: false });
    const cyclic: Record<string, unknown> = { schemaVersion: EXACT_METRIC_VALUE_VERSION };
    cyclic.self = cyclic;
    expect(buildExactMetricValue(cyclic)).toMatchObject({ ok: false });
    const symbol = { schemaVersion: EXACT_METRIC_VALUE_VERSION, [Symbol("bad")]: "bad" };
    expect(buildExactMetricValue(symbol)).toMatchObject({ ok: false });
    expect(buildExactMetricValue(new Proxy({}, {}))).toMatchObject({ ok: false });
    const value = metric();
    expect(verifyExactMetricValue({ ...value, value: "9" })).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_digest_mismatch" } });
  });
});

describe("GA0-B1 acyclic proof artifacts", () => {
  it("builds context -> evidence/table/claim/series/diagnostics -> final receipt without a digest cycle", () => {
    const { context, evidence, value, table } = proofFixture();
    const claimResult = buildValidatedClaim({
      schemaVersion: VALIDATED_CLAIM_VERSION,
      claimKey: "fixture_claim",
      claimVersion: "v1",
      claimType: "contract_fixture_only",
      runContext: context,
      table,
      subjectGroupKey: "fixture_subject",
      comparisonGroupKey: null,
      metricKey: "net_pnl",
      direction: "positive",
      exactEffect: value,
      targetSampleSize: "1",
      comparisonSampleSize: "0",
      confidenceEvidenceLabel: "insufficient",
      outlierSensitivityState: "not_evaluated",
      evidenceBundles: [evidence],
      evidenceBundleDigests: [evidence.bundleDigest],
      counterexampleEvidenceBundleDigests: [],
      limitationCodes: ["ti_v3_fixture_contract_only"],
      allowedWordingCode: "fixture_no_real_conclusion",
    });
    expect(claimResult).toMatchObject({ ok: true });
    if (!claimResult.ok) return;
    const claim = claimResult.value;
    const seriesResult = buildChartReadySeries({
      schemaVersion: CHART_READY_SERIES_VERSION,
      seriesKey: "fixture_series",
      seriesVersion: "v1",
      approvedVisualPurpose: "fixture_contract_validation",
      allowedVisualTemplateKeys: ["accessible_table_bar"],
      runContext: context,
      sourceTable: table,
      evidenceBundles: [evidence],
      xDomain: "fixture_groups",
      unit: "money",
      currency: "USD",
      timezone: "UTC",
      dateBasis: "trade_close_date",
      zeroBaselineRequired: true,
      denominatorPolicy: "all_included_trades",
      points: [{ pointKey: "fixture_point", sourceRowKey: "fixture_row", sourceColumnKey: "net_pnl", semanticOrder: "1", sampleSize: "1", evidenceBundleDigest: evidence.bundleDigest }],
      includedCount: "1",
      excludedCount: "0",
      accessibilitySummaryFacts: [value],
      pointBudget: "1",
      downsamplingPolicy: "none_exact_points_only",
      limitationCodes: [],
    });
    expect(seriesResult).toMatchObject({ ok: true });
    if (!seriesResult.ok) return;
    const series = seriesResult.value;
    expect(series.points[0].exactValue.metricDigest).toBe(table.rows[0].cells[0].metric.metricDigest);
    const diagnosticsResult = buildAnalyticalDiagnostics({
      schemaVersion: ANALYTICAL_DIAGNOSTICS_VERSION,
      runContext: context,
      entries: [{ diagnosticKey: "fixture_contract_only", severity: "info", code: "ti_v3_fixture_contract_only", affectedKeys: ["fixture_claim"] }],
    });
    expect(diagnosticsResult).toMatchObject({ ok: true });
    if (!diagnosticsResult.ok) return;
    const diagnostics = diagnosticsResult.value;
    const receiptResult = buildAnalysisRunReceipt({
      schemaVersion: ANALYSIS_RUN_RECEIPT_VERSION,
      runContext: context,
      runStatus: "limited",
      tableDigests: [table.tableDigest],
      claimDigests: [claim.claimDigest],
      seriesDigests: [series.seriesDigest],
      evidenceBundleDigests: [evidence.bundleDigest],
      includedCount: "1",
      excludedCount: "0",
      limitationCodes: ["ti_v3_fixture_contract_only"],
      diagnosticsDigest: diagnostics.diagnosticsDigest,
    });
    expect(receiptResult).toMatchObject({ ok: true });
    if (!receiptResult.ok) return;
    const receipt = receiptResult.value;
    expect("runDigest" in context).toBe(false);
    expect("runDigest" in evidence).toBe(false);
    expect("runDigest" in table).toBe(false);
    expect("runDigest" in claim).toBe(false);
    expect("runDigest" in series).toBe(false);
    expect(receipt.runContextDigest).toBe(context.runContextDigest);
    expect(verifyAnalysisRunContext(context)).toMatchObject({ ok: true });
    expect(verifyAnalyticalEvidenceBundle(evidence, context)).toMatchObject({ ok: true });
    expect(verifyExactTable(table, context, [evidence])).toMatchObject({ ok: true });
    expect(verifyValidatedClaim(claim, context, table, [evidence])).toMatchObject({ ok: true });
    expect(verifyChartReadySeries(series, context, table, [evidence])).toMatchObject({ ok: true });
    expect(verifyAnalyticalDiagnostics(diagnostics, context)).toMatchObject({ ok: true });
    const expectedArtifacts = {
      tableDigests: [table.tableDigest],
      claimDigests: [claim.claimDigest],
      seriesDigests: [series.seriesDigest],
      evidenceBundleDigests: [evidence.bundleDigest],
      diagnosticsDigest: diagnostics.diagnosticsDigest,
    };
    expect(verifyAnalysisRunReceipt(receipt, context, expectedArtifacts)).toMatchObject({ ok: true });
    expect(verifyAnalysisRunReceipt(receipt, context, {
      ...expectedArtifacts,
      tableDigests: [identity("exact_table", "foreign")],
    })).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_reference_mismatch" } });
    expect(Object.isFrozen(series.points[0].exactValue)).toBe(true);
  });

  it("rejects cross-artifact identity mismatches and post-construction nested mutation attempts", () => {
    const { context, evidence, table } = proofFixture();
    const foreignContextResult = buildAnalysisRunContext({
      schemaVersion: ANALYSIS_RUN_CONTEXT_VERSION,
      toolKey: "foreign_tool", toolVersion: "v1", toolPolicyVersion: "v1",
      snapshotDigest: context.snapshotDigest, filterDigest: context.filterDigest,
      datasetReceiptDigest: context.datasetReceiptDigest,
      normalizedArgumentsDigest: identity("canonical_content", "foreign"), eligibilityState: "eligible",
    });
    if (!foreignContextResult.ok) return;
    expect(verifyExactTable(table, foreignContextResult.value, [evidence])).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_reference_mismatch" } });
    expect(() => (table.rows[0].cells as unknown[]).push({})).toThrow();
    expect(verifyExactTable({ ...table, rows: [{ ...table.rows[0], cells: [{ ...table.rows[0].cells[0], metric: metric("net_pnl", "99") }] }] }, context, [evidence])).toMatchObject({ ok: false });
  });
});

describe("GA0-B1 contract-only tool registry", () => {
  it("registers metadata without exposing a runner or B2 policy implementation", () => {
    const entryResult = buildToolRegistryEntry({
      schemaVersion: TOOL_REGISTRY_ENTRY_VERSION,
      toolKey: "future_contract_fixture",
      toolVersion: "v1",
      descriptionCode: "fixture_contract_only",
      requiredEligibilityCapability: "closed_trade_analytics",
      argumentSchemaDigest: identity("canonical_content", "argument_schema"),
      requiredRowFields: ["net_pnl", "session_date"],
      outputContracts: ["exact_table_v1", "validated_claim_v1"],
      evidencePolicyKey: "conservative_evidence",
      evidencePolicyVersion: "v1",
      minimumSamplePolicyState: "deferred_to_tool_slice",
      supportedCurrencies: ["USD", "CAD"],
      supportedTimezones: ["UTC", "America/New_York"],
      deprecationState: "active_contract",
      focusedTestKeys: ["fixture_contract_validation"],
      executableState: "contract_only_no_runner",
    });
    expect(entryResult).toMatchObject({ ok: true });
    if (!entryResult.ok) return;
    expect(Object.keys(entryResult.value)).not.toContain("run");
    const snapshotResult = buildToolRegistrySnapshot({
      schemaVersion: TOOL_REGISTRY_SNAPSHOT_VERSION,
      registryKey: "ga0_b1_contract_registry",
      registryVersion: "v1",
      entries: [entryResult.value],
    });
    expect(snapshotResult).toMatchObject({ ok: true });
    if (snapshotResult.ok) expect(verifyToolRegistrySnapshot(snapshotResult.value)).toMatchObject({ ok: true });
  });
});
