import { describe, expect, it } from "vitest";

import {
  ANALYSIS_RUN_CONTEXT_VERSION,
  ANALYSIS_RUN_RECEIPT_VERSION,
  ANALYTICAL_DIAGNOSTICS_VERSION,
  ANALYTICAL_DATASET_VERSION,
  ANALYTICAL_ROW_VERSION,
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
  buildAnalyticalDatasetReceipt,
  buildAnalyticalEvidenceBundle,
  buildAnalyticalPartitionReceipt,
  buildAnalyticalRow,
  buildChartReadySeries,
  buildExactMetricValue,
  buildExactTable,
  buildToolRegistryEntry,
  buildToolRegistrySnapshot,
  buildNormalizedAnalysisArguments,
  createSyntheticInMemoryReadOnlySource,
  readAnalyticalDatasetWithDerivation,
  rehydrateAnalyticalDatasetDerivation,
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
import {
  buildSyntheticCanonicalExecution,
  buildSyntheticGa0B1Authority,
  buildSyntheticGa0B1ClosedExecutions,
} from "../../testing";

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

function ratioMetric(
  metricKey: string,
  numerator: string,
  denominator: string,
) {
  const result = buildExactMetricValue({
    schemaVersion: EXACT_METRIC_VALUE_VERSION,
    metricKey,
    kind: "exact_ratio",
    unit: "ratio",
    currency: null,
    value: null,
    numerator,
    denominator,
  });
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

function proofFixture() {
  const authority = buildSyntheticGa0B1Authority();
  const datasetResult = readAnalyticalDatasetWithDerivation(
    createSyntheticInMemoryReadOnlySource(authority),
  );
  if (!datasetResult.ok) throw new Error(datasetResult.error.code);
  const dataset = datasetResult.value.datasetReceipt;
  const partitionResult = buildAnalyticalPartitionReceipt({
    schemaVersion: "ti_v3_analytical_partition_v1",
    datasetReceipt: dataset,
    currency: "USD",
  });
  if (!partitionResult.ok) throw new Error(partitionResult.error.code);
  const argumentSchemaDigest = identity("canonical_content", "argument_schema");
  const registryResult = buildToolRegistryEntry({
    schemaVersion: TOOL_REGISTRY_ENTRY_VERSION,
    toolKey: "contract_fixture_tool", toolVersion: "v1", descriptionCode: "fixture_contract_only",
    requiredEligibilityCapability: "closed_trade_analytics", argumentSchemaDigest,
    requiredRowFields: ["net_pnl", "session_date"],
    outputContracts: [
      "exact_table_v1", "validated_claim_v1", "chart_ready_series_v1",
      "analytical_evidence_bundle_v1",
    ],
    blockedArtifactPolicy: "diagnostics_only",
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
    datasetReceipt: dataset,
    datasetDerivationReceipt: datasetResult.value.derivationReceipt,
    partitionReceipt: partitionResult.value,
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
    candidateKeys: [dataset.rows[0].semanticRoundTripKey],
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
  return { authority, dataset, derivation: datasetResult.value.derivationReceipt, partition: partitionResult.value, registry: registryResult.value, normalizedArguments: argumentsResult.value, context, evidence, value, table: tableResult.value };
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
    const { context, evidence, table } = proofFixture();
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
    const { authority, dataset, derivation, partition, registry, context, evidence, table } = proofFixture();
    const foreignArguments = buildNormalizedAnalysisArguments({ schemaVersion: NORMALIZED_ANALYSIS_ARGUMENTS_VERSION, argumentSchemaDigest: registry.argumentSchemaDigest, values: { comparison: "foreign" } });
    if (!foreignArguments.ok) return;
    const foreignContextResult = buildAnalysisRunContext({
      schemaVersion: ANALYSIS_RUN_CONTEXT_VERSION,
      snapshot: authority.snapshot, snapshotDependencies: authority.snapshotDependencies,
      canonicalFilter: authority.snapshotDependencies.filter, datasetReceipt: dataset,
      datasetDerivationReceipt: derivation,
      partitionReceipt: partition,
      normalizedArguments: foreignArguments.value, registryEntry: registry,
    });
    if (!foreignContextResult.ok) return;
    expect(verifyExactTable(table, foreignContextResult.value, [evidence])).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_reference_mismatch" } });
    expect(() => (table.rows[0].cells as unknown[]).push({})).toThrow();
    expect(verifyExactTable({ ...table, rows: [{ ...table.rows[0], cells: [{ ...table.rows[0].cells[0], metric: metric("net_pnl", "99") }] }] }, context, [evidence])).toMatchObject({ ok: false });
  });

  it("admits datasets only through exact read-model derivation or replay", () => {
    const fixture = proofFixture();
    const row = fixture.dataset.rows[0];
    const { rowDigest: _rowDigest, ...rowContent } = row;
    void _rowDigest;
    const changedRow = buildAnalyticalRow({
      ...rowContent,
      schemaVersion: ANALYTICAL_ROW_VERSION,
      netPnl: "99",
    });
    expect(changedRow).toMatchObject({ ok: true });
    if (!changedRow.ok) return;
    const {
      receiptDigest: _receiptDigest,
      currencyPartitions: _currencyPartitions,
      candidateCount: _candidateCount,
      includedCount: _includedCount,
      excludedCount: _excludedCount,
      exclusionCountsByReason: _reasonCounts,
      ...datasetContent
    } = fixture.dataset;
    void _receiptDigest;
    void _currencyPartitions;
    void _candidateCount;
    void _includedCount;
    void _excludedCount;
    void _reasonCounts;
    const forged = buildAnalyticalDatasetReceipt({
      ...datasetContent,
      schemaVersion: ANALYTICAL_DATASET_VERSION,
      rows: [changedRow.value],
    });
    expect(forged).toMatchObject({ ok: true });
    if (!forged.ok) return;
    expect(buildAnalysisRunContext({
      schemaVersion: ANALYSIS_RUN_CONTEXT_VERSION,
      snapshot: fixture.authority.snapshot,
      snapshotDependencies: fixture.authority.snapshotDependencies,
      canonicalFilter: fixture.authority.snapshotDependencies.filter,
      datasetReceipt: forged.value,
      datasetDerivationReceipt: fixture.derivation,
      partitionReceipt: fixture.partition,
      normalizedArguments: fixture.normalizedArguments,
      registryEntry: fixture.registry,
    })).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_reference_mismatch",
        path: "$.datasetDerivationReceipt",
      },
    });
    const persistedReceipt = JSON.parse(
      JSON.stringify(fixture.derivation),
    ) as unknown;
    expect(rehydrateAnalyticalDatasetDerivation(
      persistedReceipt,
      createSyntheticInMemoryReadOnlySource(fixture.authority),
    )).toMatchObject({
      ok: true,
      value: {
        datasetReceipt: { receiptDigest: fixture.dataset.receiptDigest },
      },
    });
  });

  it("derives exact reduced ratio differences and directions", () => {
    const { context, evidence } = proofFixture();
    const table = buildExactTable({
      schemaVersion: EXACT_TABLE_VERSION,
      tableKey: "ratio_table",
      tableVersion: "v1",
      runContext: context,
      titlePurposeCode: "ratio_contract_validation",
      currency: "USD",
      timezone: "UTC",
      dateBasis: "trade_close_date",
      denominatorPolicy: "all_included_trades",
      columns: [{
        columnKey: "expectancy",
        valueKind: "exact_ratio",
        unit: "ratio",
      }],
      rows: [
        {
          rowKey: "target",
          cells: [{
            columnKey: "expectancy",
            metric: ratioMetric("expectancy", "1", "3"),
          }],
          evidenceBundleDigest: evidence.bundleDigest,
        },
        {
          rowKey: "comparison",
          cells: [{
            columnKey: "expectancy",
            metric: ratioMetric("expectancy", "1", "6"),
          }],
          evidenceBundleDigest: evidence.bundleDigest,
        },
      ],
      summaryRows: [],
      includedCount: "1",
      excludedCount: "0",
      coverageEligibilityState: "eligible",
      limitationCodes: [],
      evidenceBundles: [evidence],
    });
    expect(table).toMatchObject({ ok: true });
    if (!table.ok) return;
    const claim = buildValidatedClaim({
      schemaVersion: VALIDATED_CLAIM_VERSION,
      claimKey: "ratio_difference",
      claimVersion: "v1",
      claimType: "contract_fixture_only",
      runContext: context,
      table: table.value,
      subjectGroupKey: "target",
      comparisonGroupKey: "comparison",
      metricKey: "expectancy",
      effectDerivation: {
        kind: "difference",
        targetRowKey: "target",
        targetColumnKey: "expectancy",
        comparisonRowKey: "comparison",
        comparisonColumnKey: "expectancy",
      },
      confidenceEvidenceLabel: "insufficient",
      outlierSensitivityState: "not_evaluated",
      evidenceBundles: [evidence],
      allowedWordingCode: "contract_only",
    });
    expect(claim).toMatchObject({
      ok: true,
      value: {
        direction: "positive",
        exactEffect: {
          kind: "exact_ratio",
          numerator: "1",
          denominator: "6",
        },
      },
    });
  });

  it("binds evidence and counts to exactly one currency partition", () => {
    const cadExecutions = [
      buildSyntheticCanonicalExecution({
        stableInstrumentKey: "instrument_synthetic_cad_equity",
        rawBrokerSymbol: "SYNC",
        currency: "CAD",
        charges: [{ kind: "commission", amount: "0.1", currency: "CAD" }],
        executionId: "CAD-BUY",
        orderId: "CAD-ORDER-1",
        brokerExecutionIndex: "3",
        brokerFillSequence: "3",
        originalSourceRowLocator: {
          kind: "row_number",
          value: "3",
          rowOrderPreserved: true,
        },
        executedAt: "2026-07-18T15:00:00.000000000Z",
        side: "buy",
        quantity: "4",
        price: "2",
      }),
      buildSyntheticCanonicalExecution({
        stableInstrumentKey: "instrument_synthetic_cad_equity",
        rawBrokerSymbol: "SYNC",
        currency: "CAD",
        charges: [{ kind: "commission", amount: "0.1", currency: "CAD" }],
        executionId: "CAD-SELL",
        orderId: "CAD-ORDER-2",
        brokerExecutionIndex: "4",
        brokerFillSequence: "4",
        originalSourceRowLocator: {
          kind: "row_number",
          value: "4",
          rowOrderPreserved: true,
        },
        executedAt: "2026-07-18T16:00:00.000000000Z",
        side: "sell",
        quantity: "4",
        price: "3",
      }),
    ];
    const authority = buildSyntheticGa0B1Authority([
      ...buildSyntheticGa0B1ClosedExecutions(),
      ...cadExecutions,
    ]);
    const derived = readAnalyticalDatasetWithDerivation(
      createSyntheticInMemoryReadOnlySource(authority),
    );
    expect(derived).toMatchObject({ ok: true });
    if (!derived.ok) return;
    const partition = buildAnalyticalPartitionReceipt({
      schemaVersion: "ti_v3_analytical_partition_v1",
      datasetReceipt: derived.value.datasetReceipt,
      currency: "USD",
    });
    expect(partition).toMatchObject({ ok: true });
    if (!partition.ok) return;
    const argumentSchemaDigest = identity("canonical_content", "partition_args");
    const registry = buildToolRegistryEntry({
      schemaVersion: TOOL_REGISTRY_ENTRY_VERSION,
      toolKey: "partition_fixture_tool",
      toolVersion: "v1",
      descriptionCode: "partition_fixture",
      requiredEligibilityCapability: "closed_trade_analytics",
      argumentSchemaDigest,
      requiredRowFields: ["net_pnl"],
      outputContracts: ["exact_table_v1", "analytical_evidence_bundle_v1"],
      blockedArtifactPolicy: "diagnostics_only",
      evidencePolicyKey: "conservative_evidence",
      evidencePolicyVersion: "v1",
      toolPolicyKey: "partition_fixture",
      toolPolicyVersion: "v1",
      minimumSamplePolicyState: "deferred_to_tool_slice",
      supportedCurrencies: ["CAD", "USD"],
      supportedTimezones: ["UTC"],
      deprecationState: "active_contract",
      focusedTestKeys: ["partition_fixture"],
      executableState: "contract_only_no_runner",
    });
    const args = buildNormalizedAnalysisArguments({
      schemaVersion: NORMALIZED_ANALYSIS_ARGUMENTS_VERSION,
      argumentSchemaDigest,
      values: {},
    });
    if (!registry.ok || !args.ok) return;
    const context = buildAnalysisRunContext({
      schemaVersion: ANALYSIS_RUN_CONTEXT_VERSION,
      snapshot: authority.snapshot,
      snapshotDependencies: authority.snapshotDependencies,
      canonicalFilter: authority.snapshotDependencies.filter,
      datasetReceipt: derived.value.datasetReceipt,
      datasetDerivationReceipt: derived.value.derivationReceipt,
      partitionReceipt: partition.value,
      normalizedArguments: args.value,
      registryEntry: registry.value,
    });
    expect(context).toMatchObject({ ok: true });
    if (!context.ok) return;
    const cadRow = derived.value.datasetReceipt.rows.find(
      (row) => row.currency === "CAD",
    );
    expect(cadRow).toBeDefined();
    if (cadRow === undefined) return;
    expect(buildAnalyticalEvidenceBundle({
      schemaVersion: ANALYTICAL_EVIDENCE_BUNDLE_VERSION,
      evidenceKey: "foreign_currency_evidence",
      runContext: context.value,
      comparisonGroupKey: null,
      inclusionState: "included",
      candidateKeys: [cadRow.semanticRoundTripKey],
    })).toMatchObject({
      ok: false,
      error: { code: "ti_v3_analytics_contract_reference_mismatch" },
    });
  });

  it("rejects a completed empty graph against registry outputs", () => {
    const { context } = proofFixture();
    const diagnostics = buildAnalyticalDiagnostics({
      schemaVersion: ANALYTICAL_DIAGNOSTICS_VERSION,
      runContext: context,
      entries: [],
    });
    expect(diagnostics).toMatchObject({ ok: true });
    if (!diagnostics.ok) return;
    expect(buildAnalysisRunReceipt({
      schemaVersion: ANALYSIS_RUN_RECEIPT_VERSION,
      runContext: context,
      tables: [],
      claims: [],
      series: [],
      evidenceBundles: [],
      diagnostics: diagnostics.value,
    })).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_reference_mismatch",
        path: "$.artifacts",
      },
    });
  });

  it("rejects caller-invented run, evidence, table, claim, series, and receipt facts", () => {
    const {
      authority, dataset, partition, registry, normalizedArguments,
      context, evidence, table, value,
    } = proofFixture();
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
    const foreignDataset = readAnalyticalDatasetWithDerivation(
      createSyntheticInMemoryReadOnlySource(foreignAuthority),
    );
    expect(foreignDataset.ok).toBe(true);
    if (!foreignDataset.ok) return;
    expect(buildAnalysisRunContext({
      schemaVersion: ANALYSIS_RUN_CONTEXT_VERSION,
      snapshot: authority.snapshot,
      snapshotDependencies: authority.snapshotDependencies,
      canonicalFilter: authority.snapshotDependencies.filter,
      datasetReceipt: foreignDataset.value.datasetReceipt,
      datasetDerivationReceipt: foreignDataset.value.derivationReceipt,
      partitionReceipt: partition,
      normalizedArguments,
      registryEntry: registry,
    })).toMatchObject({
      ok: false,
      error: { code: "ti_v3_analytics_contract_digest_mismatch" },
    });

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
      blockedArtifactPolicy: "diagnostics_only",
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
