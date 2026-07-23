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
  NORMALIZED_ANALYSIS_ARGUMENTS_VERSION,
  buildAnalysisRunContext,
  buildAnalysisRunReceipt,
  buildAnalyticalDiagnostics,
  buildAnalyticalEvidenceBundle,
  buildChartReadySeries,
  buildExactMetricValue,
  buildExactTable,
  buildToolRegistryEntry,
  buildToolRegistrySnapshot,
  buildNormalizedAnalysisArguments,
  createSyntheticInMemoryReadOnlySource,
  readAnalyticalDataset,
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
import { buildSyntheticGa0B1Authority } from "../../testing";

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
  const authority = buildSyntheticGa0B1Authority();
  const datasetResult = readAnalyticalDataset(createSyntheticInMemoryReadOnlySource(authority));
  if (!datasetResult.ok) throw new Error(datasetResult.error.code);
  const argumentSchemaDigest = identity("canonical_content", "argument_schema");
  const registryResult = buildToolRegistryEntry({
    schemaVersion: TOOL_REGISTRY_ENTRY_VERSION,
    toolKey: "contract_fixture_tool", toolVersion: "v1", descriptionCode: "fixture_contract_only",
    requiredEligibilityCapability: "closed_trade_analytics", argumentSchemaDigest,
    requiredRowFields: ["net_pnl", "session_date"], outputContracts: ["exact_table_v1"],
    evidencePolicyKey: "conservative_evidence", evidencePolicyVersion: "v1",
    toolPolicyKey: "fixture_exact_tool", toolPolicyVersion: "v1",
    minimumSamplePolicyState: "deferred_to_tool_slice", supportedCurrencies: ["USD"],
    supportedTimezones: ["UTC"], deprecationState: "active_contract", focusedTestKeys: ["fixture"],
    executableState: "contract_only_no_runner",
  });
  if (!registryResult.ok) throw new Error(registryResult.error.code);
  const argumentsResult = buildNormalizedAnalysisArguments({
    schemaVersion: NORMALIZED_ANALYSIS_ARGUMENTS_VERSION,
    argumentSchemaDigest,
    values: { comparison: "all_included" },
  });
  if (!argumentsResult.ok) throw new Error(argumentsResult.error.code);
  const contextResult = buildAnalysisRunContext({
    schemaVersion: ANALYSIS_RUN_CONTEXT_VERSION,
    snapshot: authority.snapshot,
    snapshotDependencies: authority.snapshotDependencies,
    canonicalFilter: authority.snapshotDependencies.filter,
    datasetReceipt: datasetResult.value,
    normalizedArguments: argumentsResult.value,
    registryEntry: registryResult.value,
  });
  if (!contextResult.ok) throw new Error(`${contextResult.error.code}:${contextResult.error.path}`);
  const context = contextResult.value;
  const evidenceResult = buildAnalyticalEvidenceBundle({
    schemaVersion: ANALYTICAL_EVIDENCE_BUNDLE_VERSION,
    evidenceKey: "fixture_evidence",
    runContext: context,
    comparisonGroupKey: "all_included",
    inclusionState: "included",
    candidateKeys: [datasetResult.value.rows[0].semanticRoundTripKey],
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
  return { authority, dataset: datasetResult.value, registry: registryResult.value, normalizedArguments: argumentsResult.value, context, evidence, value, table: tableResult.value };
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
    expect(buildExactMetricValue({ schemaVersion: EXACT_METRIC_VALUE_VERSION, metricKey: "missing_currency", kind: "exact_decimal", unit: "money", currency: null, value: "1" })).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_unit_mismatch" } });
    expect(buildExactMetricValue({ schemaVersion: EXACT_METRIC_VALUE_VERSION, metricKey: "false_currency", kind: "integer", unit: "trades", currency: "USD", value: "1" })).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_unit_mismatch" } });
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
      subjectGroupKey: "fixture_row",
      comparisonGroupKey: null,
      metricKey: "net_pnl",
      effectDerivation: { kind: "table_cell", targetRowKey: "fixture_row", targetColumnKey: "net_pnl", comparisonRowKey: null, comparisonColumnKey: null },
      confidenceEvidenceLabel: "insufficient",
      outlierSensitivityState: "not_evaluated",
      evidenceBundles: [evidence],
      allowedWordingCode: "fixture_no_real_conclusion",
    });
    expect(claimResult, claimResult.ok ? undefined : JSON.stringify(claimResult.error)).toMatchObject({ ok: true });
    if (!claimResult.ok) return;
    const claim = claimResult.value;
    expect(claim.exactEffect.metricDigest).toBe(table.rows[0].cells[0].metric.metricDigest);
    expect(claim).toMatchObject({ direction: "positive", targetSampleSize: "1", comparisonSampleSize: "0" });
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
      points: [{ pointKey: "fixture_point", sourceRowKey: "fixture_row", sourceColumnKey: "net_pnl", semanticOrder: "1", evidenceBundleDigest: evidence.bundleDigest }],
      accessibilitySummarySelections: [{ rowKey: "fixture_row", columnKey: "net_pnl" }],
      pointBudget: "1",
      downsamplingPolicy: "none_exact_points_only",
    });
    expect(seriesResult).toMatchObject({ ok: true });
    if (!seriesResult.ok) return;
    const series = seriesResult.value;
    expect(series.points[0].exactValue.metricDigest).toBe(table.rows[0].cells[0].metric.metricDigest);
    expect(series.accessibilitySummaryFacts[0].metricDigest).toBe(table.rows[0].cells[0].metric.metricDigest);
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
      tables: [table],
      claims: [claim],
      series: [series],
      evidenceBundles: [evidence],
      diagnostics,
    });
    expect(receiptResult).toMatchObject({ ok: true });
    if (!receiptResult.ok) return;
    const receipt = receiptResult.value;
    expect(receipt).toMatchObject({ runStatus: "completed", includedCount: "1", excludedCount: "0", limitationCodes: [] });
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
    const graph = { runContext: context, tables: [table], claims: [claim], series: [series], evidenceBundles: [evidence], diagnostics };
    expect(verifyAnalysisRunReceipt(receipt, graph)).toMatchObject({ ok: true });
    expect(verifyAnalysisRunReceipt(receipt, { ...graph, tables: [] })).toMatchObject({ ok: false });
    expect(Object.isFrozen(series.points[0].exactValue)).toBe(true);
  });

  it("rejects cross-artifact identity mismatches and post-construction nested mutation attempts", () => {
    const { authority, dataset, registry, context, evidence, table } = proofFixture();
    const foreignArguments = buildNormalizedAnalysisArguments({ schemaVersion: NORMALIZED_ANALYSIS_ARGUMENTS_VERSION, argumentSchemaDigest: registry.argumentSchemaDigest, values: { comparison: "foreign" } });
    if (!foreignArguments.ok) return;
    const foreignContextResult = buildAnalysisRunContext({
      schemaVersion: ANALYSIS_RUN_CONTEXT_VERSION,
      snapshot: authority.snapshot, snapshotDependencies: authority.snapshotDependencies,
      canonicalFilter: authority.snapshotDependencies.filter, datasetReceipt: dataset,
      normalizedArguments: foreignArguments.value, registryEntry: registry,
    });
    if (!foreignContextResult.ok) return;
    expect(verifyExactTable(table, foreignContextResult.value, [evidence])).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_reference_mismatch" } });
    expect(() => (table.rows[0].cells as unknown[]).push({})).toThrow();
    expect(verifyExactTable({ ...table, rows: [{ ...table.rows[0], cells: [{ ...table.rows[0].cells[0], metric: metric("net_pnl", "99") }] }] }, context, [evidence])).toMatchObject({ ok: false });
  });

  it("rejects caller-invented run, evidence, table, claim, series, and receipt facts", () => {
    const { authority, dataset, registry, normalizedArguments, context, evidence, table, value } = proofFixture();
    expect(buildAnalysisRunContext({
      schemaVersion: ANALYSIS_RUN_CONTEXT_VERSION,
      toolKey: registry.toolKey,
      snapshotDigest: context.snapshotDigest,
      filterDigest: context.filterDigest,
      datasetReceiptDigest: context.datasetReceiptDigest,
      normalizedArgumentsDigest: context.normalizedArgumentsDigest,
      eligibilityState: "eligible",
    })).toMatchObject({ ok: false });

    const foreignAuthority = buildSyntheticGa0B1Authority(undefined, { filterOverrides: { outcomeFilters: ["loss"] } });
    const foreignDataset = readAnalyticalDataset(createSyntheticInMemoryReadOnlySource(foreignAuthority));
    expect(foreignDataset.ok).toBe(true);
    if (!foreignDataset.ok) return;
    expect(buildAnalysisRunContext({
      schemaVersion: ANALYSIS_RUN_CONTEXT_VERSION,
      snapshot: authority.snapshot,
      snapshotDependencies: authority.snapshotDependencies,
      canonicalFilter: authority.snapshotDependencies.filter,
      datasetReceipt: foreignDataset.value,
      normalizedArguments,
      registryEntry: registry,
    })).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_reference_mismatch", path: "$.datasetReceipt" } });

    expect(buildAnalyticalEvidenceBundle({
      schemaVersion: ANALYTICAL_EVIDENCE_BUNDLE_VERSION,
      evidenceKey: "invented_member",
      runContext: context,
      comparisonGroupKey: null,
      inclusionState: "included",
      candidateKeys: ["round_trip:invented"],
    })).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_reference_mismatch", path: "$.candidateKeys" } });
    expect(buildAnalyticalEvidenceBundle({
      schemaVersion: ANALYTICAL_EVIDENCE_BUNDLE_VERSION,
      evidenceKey: "wrong_membership_state",
      runContext: context,
      comparisonGroupKey: null,
      inclusionState: "excluded",
      candidateKeys: [dataset.rows[0].semanticRoundTripKey],
    })).toMatchObject({ ok: false });

    expect(buildExactTable({
      schemaVersion: EXACT_TABLE_VERSION,
      tableKey: table.tableKey, tableVersion: table.tableVersion, runContext: context,
      titlePurposeCode: table.titlePurposeCode, currency: table.currency, timezone: table.timezone,
      dateBasis: table.dateBasis, denominatorPolicy: table.denominatorPolicy,
      columns: table.columns, rows: table.rows, summaryRows: table.summaryRows,
      includedCount: "99", excludedCount: table.excludedCount,
      coverageEligibilityState: table.coverageEligibilityState,
      limitationCodes: table.limitationCodes, evidenceBundles: [evidence],
    })).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_reference_mismatch", path: "$.scope" } });

    expect(buildValidatedClaim({
      schemaVersion: VALIDATED_CLAIM_VERSION,
      claimKey: "free_effect", claimVersion: "v1", claimType: "contract_fixture_only",
      runContext: context, table, subjectGroupKey: "fixture_row", comparisonGroupKey: null,
      metricKey: "net_pnl", effectDerivation: { kind: "table_cell", targetRowKey: "fixture_row", targetColumnKey: "net_pnl", comparisonRowKey: null, comparisonColumnKey: null },
      exactEffect: metric("net_pnl", "999"),
      confidenceEvidenceLabel: "insufficient", outlierSensitivityState: "not_evaluated",
      evidenceBundles: [evidence], allowedWordingCode: "fixture_no_real_conclusion",
    })).toMatchObject({ ok: false, error: { code: "ti_v3_validation_extra_field" } });

    expect(buildChartReadySeries({
      schemaVersion: CHART_READY_SERIES_VERSION,
      seriesKey: "free_accessibility", seriesVersion: "v1", approvedVisualPurpose: "fixture_contract_validation",
      allowedVisualTemplateKeys: ["accessible_table_bar"], runContext: context, sourceTable: table,
      evidenceBundles: [evidence], xDomain: "fixture_groups", unit: "money", currency: "USD",
      timezone: "UTC", dateBasis: "trade_close_date", zeroBaselineRequired: true,
      denominatorPolicy: "all_included_trades",
      points: [{ pointKey: "fixture_point", sourceRowKey: "fixture_row", sourceColumnKey: "net_pnl", semanticOrder: "1", evidenceBundleDigest: evidence.bundleDigest }],
      accessibilitySummarySelections: [{ rowKey: "fixture_row", columnKey: "net_pnl" }],
      accessibilitySummaryFacts: [value], pointBudget: "1", downsamplingPolicy: "none_exact_points_only",
    })).toMatchObject({ ok: false, error: { code: "ti_v3_validation_extra_field" } });

    const diagnosticsResult = buildAnalyticalDiagnostics({ schemaVersion: ANALYTICAL_DIAGNOSTICS_VERSION, runContext: context, entries: [] });
    expect(diagnosticsResult.ok).toBe(true);
    if (!diagnosticsResult.ok) return;
    expect(buildAnalysisRunReceipt({
      schemaVersion: ANALYSIS_RUN_RECEIPT_VERSION, runContext: context,
      tables: [table], claims: [], series: [], evidenceBundles: [evidence], diagnostics: diagnosticsResult.value,
      includedCount: "999",
    })).toMatchObject({ ok: false, error: { code: "ti_v3_validation_extra_field" } });
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
      toolPolicyKey: "future_fixture_policy",
      toolPolicyVersion: "v1",
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
