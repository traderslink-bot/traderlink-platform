import type { CanonicalContentDigest } from "../../domain/identity";
import {
  verifyAnalysisRunContext,
  verifyAnalysisRunReceipt,
  verifyAnalyticalDiagnostics,
  verifyAnalyticalEvidenceBundle,
  verifyChartReadySeries,
  verifyExactTable,
  verifyValidatedClaim,
  type AnalysisRunArtifactGraph,
  type AnalysisRunContext,
  type AnalyticalDiagnostics,
  type AnalyticalEvidenceBundle,
  type AnalysisRunReceipt,
  type ChartReadySeries,
  type ExactTable,
  type ValidatedClaim,
} from "../contracts";

export interface CrossArtifactConsistencyInput {
  readonly runContext: AnalysisRunContext;
  readonly tables: readonly ExactTable[];
  readonly claims: readonly ValidatedClaim[];
  readonly series: readonly ChartReadySeries[];
  readonly evidenceBundles: readonly AnalyticalEvidenceBundle[];
  readonly diagnostics: AnalyticalDiagnostics;
  readonly receipt: AnalysisRunReceipt;
  readonly expectedToolKey?: string;
}

export interface CrossArtifactConsistencyReport {
  readonly valid: true;
  readonly runContextDigest: CanonicalContentDigest;
  readonly tableCount: number;
  readonly claimCount: number;
  readonly seriesCount: number;
  readonly evidenceBundleCount: number;
  readonly diagnosticCount: number;
}

export interface CrossArtifactConsistencyFailure {
  readonly code: string;
  readonly path: string;
}

function failure(code: string, path: string): { readonly ok: false; readonly error: CrossArtifactConsistencyFailure } {
  return { ok: false, error: { code, path } };
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

/** Re-verifies the complete artifact graph and then checks semantic links. */
export function validateCrossArtifactConsistency(
  input: CrossArtifactConsistencyInput,
): { readonly ok: true; readonly value: CrossArtifactConsistencyReport } | { readonly ok: false; readonly error: CrossArtifactConsistencyFailure } {
  const context = verifyAnalysisRunContext(input.runContext);
  if (!context.ok) return failure("ti_v3_consistency_run_context_invalid", "$.runContext");
  if (input.expectedToolKey !== undefined && context.value.toolKey !== input.expectedToolKey) return failure("ti_v3_consistency_tool_mismatch", "$.runContext.toolKey");
  if (!unique(input.tables.map((table) => table.tableDigest))) return failure("ti_v3_consistency_duplicate_table", "$.tables");
  if (!unique(input.claims.map((claim) => claim.claimDigest))) return failure("ti_v3_consistency_duplicate_claim", "$.claims");
  if (!unique(input.series.map((series) => series.seriesDigest))) return failure("ti_v3_consistency_duplicate_series", "$.series");
  if (!unique(input.evidenceBundles.map((bundle) => bundle.bundleDigest))) return failure("ti_v3_consistency_duplicate_evidence", "$.evidenceBundles");

  for (let index = 0; index < input.evidenceBundles.length; index += 1) {
    const verified = verifyAnalyticalEvidenceBundle(input.evidenceBundles[index], context.value);
    if (!verified.ok) return failure("ti_v3_consistency_evidence_invalid", `$.evidenceBundles[${index}]${verified.error.path.slice(1)}`);
  }
  for (let index = 0; index < input.tables.length; index += 1) {
    const table = verifyExactTable(input.tables[index], context.value, input.evidenceBundles);
    if (!table.ok) return failure("ti_v3_consistency_table_invalid", `$.tables[${index}]${table.error.path.slice(1)}`);
    if (table.value.runContextDigest !== context.value.runContextDigest) return failure("ti_v3_consistency_mixed_run_context", `$.tables[${index}]`);
  }
  for (let index = 0; index < input.claims.length; index += 1) {
    const claim = input.claims[index];
    const table = input.tables.find((candidate) => candidate.tableDigest === claim.tableDigest);
    if (table === undefined) return failure("ti_v3_consistency_claim_table_missing", `$.claims[${index}].tableDigest`);
    const verified = verifyValidatedClaim(claim, context.value, table, input.evidenceBundles, input.tables);
    if (!verified.ok) return failure("ti_v3_consistency_claim_invalid", `$.claims[${index}]${verified.error.path.slice(1)}`);
    const columnExists = table.columns.some((column) => column.columnKey === claim.metricKey);
    if (!columnExists) return failure("ti_v3_consistency_claim_metric_missing", `$.claims[${index}].metricKey`);
    const effect = claim.effectDerivation;
    const effectRow = table.rows.find((row) => row.rowKey === effect.targetRowKey);
    if (effectRow === undefined || !effectRow.cells.some((cell) => cell.columnKey === effect.targetColumnKey)) return failure("ti_v3_consistency_claim_effect_missing", `$.claims[${index}].effectDerivation`);
  }
  for (let index = 0; index < input.series.length; index += 1) {
    const series = input.series[index];
    const table = input.tables.find((candidate) => candidate.tableDigest === series.sourceTableDigest);
    if (table === undefined) return failure("ti_v3_consistency_series_table_missing", `$.series[${index}].sourceTableDigest`);
    const verified = verifyChartReadySeries(series, context.value, table, input.evidenceBundles);
    if (!verified.ok) return failure("ti_v3_consistency_series_invalid", `$.series[${index}]${verified.error.path.slice(1)}`);
    let previousOrder: bigint | null = null;
    for (const [pointIndex, point] of series.points.entries()) {
      const row = table.rows.find((candidate) => candidate.rowKey === point.sourceRowKey);
      if (row === undefined || !row.cells.some((cell) => cell.columnKey === point.sourceColumnKey)) return failure("ti_v3_consistency_series_source_missing", `$.series[${index}].points[${pointIndex}]`);
      const order = BigInt(point.semanticOrder);
      if (previousOrder !== null && order <= previousOrder) return failure("ti_v3_consistency_series_order_invalid", `$.series[${index}].points[${pointIndex}].semanticOrder`);
      previousOrder = order;
    }
  }
  const diagnostics = verifyAnalyticalDiagnostics(input.diagnostics, context.value);
  if (!diagnostics.ok) return failure("ti_v3_consistency_diagnostics_invalid", "$.diagnostics");
  const graph: AnalysisRunArtifactGraph = {
    runContext: context.value,
    tables: input.tables,
    claims: input.claims,
    series: input.series,
    evidenceBundles: input.evidenceBundles,
    diagnostics: input.diagnostics,
  };
  const receipt = verifyAnalysisRunReceipt(input.receipt, graph);
  if (!receipt.ok) return failure("ti_v3_consistency_receipt_invalid", `$.receipt${receipt.error.path.slice(1)}`);
  if (receipt.value.runStatus === "completed" && input.claims.length === 0 && context.value.eligibilityState !== "blocked") return failure("ti_v3_consistency_completed_claim_contract", "$.receipt.runStatus");
  return {
    ok: true,
    value: Object.freeze({
      valid: true,
      runContextDigest: context.value.runContextDigest,
      tableCount: input.tables.length,
      claimCount: input.claims.length,
      seriesCount: input.series.length,
      evidenceBundleCount: input.evidenceBundles.length,
      diagnosticCount: input.diagnostics.entries.length,
    }),
  };
}
