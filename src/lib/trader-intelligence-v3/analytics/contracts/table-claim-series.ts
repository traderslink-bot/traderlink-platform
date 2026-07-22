import { compareUnicodeCodePoints } from "../../domain/canonical";
import { parseCurrencyCode, type CurrencyCode, type ExactResult } from "../../domain/exact";
import type { CanonicalContentDigest } from "../../domain/identity";
import {
  GA0_B1_CONTRACT_LIMITS,
  contractFailure,
  finalizeContentAddressedAuthority,
  validateCanonicalCount,
  validateClaimedDigest,
  validateContractKey,
  validateContractRecord,
  validateDigestArray,
  validateReasonCodes,
  validateTimezone,
  validateUnit,
  type AnalyticalContractFailure,
} from "./contract-validation";
import { verifyExactMetricValue, type ExactMetricValue } from "./exact-metric";
import {
  verifyAnalyticalEvidenceBundle,
  type AnalyticalEvidenceBundle,
} from "./evidence-diagnostics";
import { verifyAnalysisRunContext, type AnalysisRunContext } from "./run-context";

export const EXACT_TABLE_VERSION = "ti_v3_exact_table_v1" as const;
export const VALIDATED_CLAIM_VERSION = "ti_v3_validated_claim_v1" as const;
export const CHART_READY_SERIES_VERSION = "ti_v3_chart_ready_series_v1" as const;

export interface ExactTableColumn {
  readonly columnKey: string;
  readonly valueKind: ExactMetricValue["kind"];
  readonly unit: string;
}

export interface ExactTableCell {
  readonly columnKey: string;
  readonly metric: ExactMetricValue;
}

export interface ExactTableRow {
  readonly rowKey: string;
  readonly cells: readonly ExactTableCell[];
  readonly evidenceBundleDigest: CanonicalContentDigest;
}

export interface ExactTable {
  readonly schemaVersion: typeof EXACT_TABLE_VERSION;
  readonly tableKey: string;
  readonly tableVersion: string;
  readonly runContextDigest: CanonicalContentDigest;
  readonly snapshotDigest: CanonicalContentDigest;
  readonly filterDigest: CanonicalContentDigest;
  readonly titlePurposeCode: string;
  readonly currency: CurrencyCode | null;
  readonly timezone: string;
  readonly dateBasis: string;
  readonly denominatorPolicy: string;
  readonly columns: readonly ExactTableColumn[];
  readonly rows: readonly ExactTableRow[];
  readonly summaryRows: readonly ExactTableRow[];
  readonly includedCount: string;
  readonly excludedCount: string;
  readonly coverageEligibilityState: "eligible" | "limited" | "blocked";
  readonly limitationCodes: readonly string[];
  readonly tableDigest: CanonicalContentDigest;
}

export interface ValidatedClaim {
  readonly schemaVersion: typeof VALIDATED_CLAIM_VERSION;
  readonly claimKey: string;
  readonly claimVersion: string;
  readonly claimType: string;
  readonly runContextDigest: CanonicalContentDigest;
  readonly tableDigest: CanonicalContentDigest;
  readonly subjectGroupKey: string;
  readonly comparisonGroupKey: string | null;
  readonly metricKey: string;
  readonly direction: "positive" | "negative" | "flat" | "unavailable";
  readonly exactEffect: ExactMetricValue;
  readonly targetSampleSize: string;
  readonly comparisonSampleSize: string;
  readonly confidenceEvidenceLabel: "insufficient" | "descriptive" | "tentative" | "unavailable";
  readonly outlierSensitivityState: "not_evaluated" | "stable" | "sensitive" | "unavailable";
  readonly evidenceBundleDigests: readonly CanonicalContentDigest[];
  readonly counterexampleEvidenceBundleDigests: readonly CanonicalContentDigest[];
  readonly limitationCodes: readonly string[];
  readonly allowedWordingCode: string;
  readonly claimDigest: CanonicalContentDigest;
}

export interface ChartReadySeriesPoint {
  readonly pointKey: string;
  readonly sourceRowKey: string;
  readonly sourceColumnKey: string;
  readonly semanticOrder: string;
  readonly exactValue: ExactMetricValue;
  readonly sampleSize: string;
  readonly evidenceBundleDigest: CanonicalContentDigest;
}

export interface ChartReadySeries {
  readonly schemaVersion: typeof CHART_READY_SERIES_VERSION;
  readonly seriesKey: string;
  readonly seriesVersion: string;
  readonly approvedVisualPurpose: string;
  readonly allowedVisualTemplateKeys: readonly string[];
  readonly runContextDigest: CanonicalContentDigest;
  readonly sourceTableDigest: CanonicalContentDigest;
  readonly xDomain: string;
  readonly unit: string;
  readonly currency: CurrencyCode | null;
  readonly timezone: string;
  readonly dateBasis: string;
  readonly zeroBaselineRequired: boolean;
  readonly denominatorPolicy: string;
  readonly points: readonly ChartReadySeriesPoint[];
  readonly includedCount: string;
  readonly excludedCount: string;
  readonly accessibilitySummaryFacts: readonly ExactMetricValue[];
  readonly pointBudget: string;
  readonly downsamplingPolicy: "none_exact_points_only";
  readonly limitationCodes: readonly string[];
  readonly tableAlternativeDigest: CanonicalContentDigest;
  readonly seriesDigest: CanonicalContentDigest;
}

function parseCurrency(input: unknown, path: string): ExactResult<CurrencyCode | null, AnalyticalContractFailure> {
  if (input === null) return { ok: true, value: null };
  const currency = parseCurrencyCode(input);
  return currency.ok ? currency : contractFailure("ti_v3_analytics_contract_invalid", path);
}

function evidenceCatalog(
  inputs: readonly AnalyticalEvidenceBundle[],
  context: AnalysisRunContext,
): ExactResult<ReadonlyMap<CanonicalContentDigest, AnalyticalEvidenceBundle>, AnalyticalContractFailure> {
  const values = new Map<CanonicalContentDigest, AnalyticalEvidenceBundle>();
  for (let index = 0; index < inputs.length; index += 1) {
    const evidence = verifyAnalyticalEvidenceBundle(inputs[index], context);
    if (!evidence.ok) return contractFailure(evidence.error.code, `$.evidenceBundles[${index}]${evidence.error.path.slice(1)}`);
    if (values.has(evidence.value.bundleDigest)) return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.evidenceBundles");
    values.set(evidence.value.bundleDigest, evidence.value);
  }
  return { ok: true, value: values };
}

function parseColumns(input: unknown): ExactResult<readonly ExactTableColumn[], AnalyticalContractFailure> {
  if (!Array.isArray(input) || input.length === 0 || input.length > GA0_B1_CONTRACT_LIMITS.maximumColumns) return contractFailure("ti_v3_analytics_contract_oversized", "$.columns");
  const columns: ExactTableColumn[] = [];
  const kinds = new Set<ExactMetricValue["kind"]>(["exact_decimal", "exact_ratio", "integer", "duration", "timestamp", "date", "enum", "unavailable"]);
  for (let index = 0; index < input.length; index += 1) {
    const path = `$.columns[${index}]`;
    const record = validateContractRecord(input[index], ["columnKey", "valueKind", "unit"], [], path);
    if (!record.ok) return record;
    const key = validateContractKey(record.value.columnKey, `${path}.columnKey`);
    const unit = validateUnit(record.value.unit, `${path}.unit`);
    if (!key.ok) return key;
    if (!unit.ok) return unit;
    if (typeof record.value.valueKind !== "string" || !kinds.has(record.value.valueKind as ExactMetricValue["kind"])) return contractFailure("ti_v3_analytics_contract_invalid", `${path}.valueKind`);
    columns.push(Object.freeze({ columnKey: key.value, valueKind: record.value.valueKind as ExactMetricValue["kind"], unit: unit.value }));
  }
  if (new Set(columns.map((column) => column.columnKey)).size !== columns.length) return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.columns");
  return { ok: true, value: Object.freeze(columns) };
}

function parseRows(
  input: unknown,
  path: string,
  columns: readonly ExactTableColumn[],
  currency: CurrencyCode | null,
  evidence: ReadonlyMap<CanonicalContentDigest, AnalyticalEvidenceBundle>,
): ExactResult<readonly ExactTableRow[], AnalyticalContractFailure> {
  if (!Array.isArray(input) || input.length > GA0_B1_CONTRACT_LIMITS.maximumRows) return contractFailure("ti_v3_analytics_contract_oversized", path);
  const rows: ExactTableRow[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const rowPath = `${path}[${index}]`;
    const record = validateContractRecord(input[index], ["rowKey", "cells", "evidenceBundleDigest"], [], rowPath);
    if (!record.ok) return record;
    const rowKey = validateContractKey(record.value.rowKey, `${rowPath}.rowKey`);
    if (!rowKey.ok) return rowKey;
    const evidenceDigest = validateClaimedDigest(record.value.evidenceBundleDigest, `${rowPath}.evidenceBundleDigest`, "analytical_evidence_bundle");
    if (!evidenceDigest.ok || !evidence.has(evidenceDigest.value)) return contractFailure("ti_v3_analytics_contract_reference_mismatch", `${rowPath}.evidenceBundleDigest`);
    if (!Array.isArray(record.value.cells) || record.value.cells.length !== columns.length) return contractFailure("ti_v3_analytics_contract_reference_mismatch", `${rowPath}.cells`);
    const cells: ExactTableCell[] = [];
    for (let cellIndex = 0; cellIndex < record.value.cells.length; cellIndex += 1) {
      const cellPath = `${rowPath}.cells[${cellIndex}]`;
      const cell = validateContractRecord(record.value.cells[cellIndex], ["columnKey", "metric"], [], cellPath);
      if (!cell.ok) return cell;
      const expectedColumn = columns[cellIndex];
      if (cell.value.columnKey !== expectedColumn.columnKey) return contractFailure("ti_v3_analytics_contract_reference_mismatch", `${cellPath}.columnKey`);
      const metric = verifyExactMetricValue(cell.value.metric);
      if (!metric.ok) return contractFailure(metric.error.code, `${cellPath}.metric${metric.error.path.slice(1)}`);
      if (metric.value.kind !== expectedColumn.valueKind || metric.value.unit !== expectedColumn.unit || (metric.value.currency !== null && metric.value.currency !== currency)) return contractFailure("ti_v3_analytics_contract_unit_mismatch", `${cellPath}.metric`);
      cells.push(Object.freeze({ columnKey: expectedColumn.columnKey, metric: metric.value }));
    }
    rows.push(Object.freeze({ rowKey: rowKey.value, cells: Object.freeze(cells), evidenceBundleDigest: evidenceDigest.value }));
  }
  if (new Set(rows.map((row) => row.rowKey)).size !== rows.length) return contractFailure("ti_v3_analytics_contract_duplicate_identity", path);
  return { ok: true, value: Object.freeze(rows) };
}

export function buildExactTable(
  input: unknown,
): ExactResult<ExactTable, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "tableKey", "tableVersion", "runContext", "titlePurposeCode",
    "currency", "timezone", "dateBasis", "denominatorPolicy", "columns", "rows",
    "summaryRows", "includedCount", "excludedCount", "coverageEligibilityState",
    "limitationCodes", "evidenceBundles",
  ]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== EXACT_TABLE_VERSION) return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  const context = verifyAnalysisRunContext(record.value.runContext);
  if (!context.ok) return contractFailure(context.error.code, `$.runContext${context.error.path.slice(1)}`);
  const tableKey = validateContractKey(record.value.tableKey, "$.tableKey");
  const tableVersion = validateContractKey(record.value.tableVersion, "$.tableVersion");
  const purpose = validateContractKey(record.value.titlePurposeCode, "$.titlePurposeCode");
  const timezone = validateTimezone(record.value.timezone, "$.timezone");
  const dateBasis = validateContractKey(record.value.dateBasis, "$.dateBasis");
  const denominator = validateContractKey(record.value.denominatorPolicy, "$.denominatorPolicy");
  if (!tableKey.ok) return tableKey; if (!tableVersion.ok) return tableVersion; if (!purpose.ok) return purpose;
  if (!timezone.ok) return timezone; if (!dateBasis.ok) return dateBasis; if (!denominator.ok) return denominator;
  const currency = parseCurrency(record.value.currency, "$.currency");
  if (!currency.ok) return currency;
  const columns = parseColumns(record.value.columns); if (!columns.ok) return columns;
  if (!Array.isArray(record.value.evidenceBundles)) return contractFailure("ti_v3_analytics_contract_invalid", "$.evidenceBundles");
  const evidence = evidenceCatalog(record.value.evidenceBundles as readonly AnalyticalEvidenceBundle[], context.value); if (!evidence.ok) return evidence;
  const rows = parseRows(record.value.rows, "$.rows", columns.value, currency.value, evidence.value); if (!rows.ok) return rows;
  const summaryRows = parseRows(record.value.summaryRows, "$.summaryRows", columns.value, currency.value, evidence.value); if (!summaryRows.ok) return summaryRows;
  if (rows.value.some((row) => summaryRows.value.some((summary) => summary.rowKey === row.rowKey))) return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.summaryRows");
  const included = validateCanonicalCount(record.value.includedCount, "$.includedCount");
  const excluded = validateCanonicalCount(record.value.excludedCount, "$.excludedCount");
  if (!included.ok) return included; if (!excluded.ok) return excluded;
  if (record.value.coverageEligibilityState !== "eligible" && record.value.coverageEligibilityState !== "limited" && record.value.coverageEligibilityState !== "blocked") return contractFailure("ti_v3_analytics_contract_invalid", "$.coverageEligibilityState");
  const limitations = validateReasonCodes(record.value.limitationCodes, "$.limitationCodes"); if (!limitations.ok) return limitations;
  if (record.value.coverageEligibilityState === "eligible" && limitations.value.length > 0) return contractFailure("ti_v3_analytics_contract_invalid", "$.limitationCodes");
  return finalizeContentAddressedAuthority("exact_table", {
    schemaVersion: EXACT_TABLE_VERSION, tableKey: tableKey.value, tableVersion: tableVersion.value,
    runContextDigest: context.value.runContextDigest, snapshotDigest: context.value.snapshotDigest,
    filterDigest: context.value.filterDigest, titlePurposeCode: purpose.value, currency: currency.value,
    timezone: timezone.value, dateBasis: dateBasis.value, denominatorPolicy: denominator.value,
    columns: columns.value, rows: rows.value, summaryRows: summaryRows.value,
    includedCount: included.value, excludedCount: excluded.value,
    coverageEligibilityState: record.value.coverageEligibilityState,
    limitationCodes: limitations.value,
  }, "tableDigest") as ExactResult<ExactTable, AnalyticalContractFailure>;
}

export function verifyExactTable(
  input: unknown,
  runContext: AnalysisRunContext,
  evidenceBundles: readonly AnalyticalEvidenceBundle[],
): ExactResult<ExactTable, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "tableKey", "tableVersion", "runContextDigest", "snapshotDigest",
    "filterDigest", "titlePurposeCode", "currency", "timezone", "dateBasis",
    "denominatorPolicy", "columns", "rows", "summaryRows", "includedCount",
    "excludedCount", "coverageEligibilityState", "limitationCodes", "tableDigest",
  ]);
  if (!record.ok) return record;
  const context = verifyAnalysisRunContext(runContext);
  if (!context.ok || record.value.runContextDigest !== context.value.runContextDigest || record.value.snapshotDigest !== context.value.snapshotDigest || record.value.filterDigest !== context.value.filterDigest) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$");
  const digest = validateClaimedDigest(record.value.tableDigest, "$.tableDigest", "exact_table"); if (!digest.ok) return digest;
  const { tableDigest: _tableDigest, runContextDigest: _contextDigest, snapshotDigest: _snapshotDigest, filterDigest: _filterDigest, ...content } = record.value;
  void _tableDigest; void _contextDigest; void _snapshotDigest; void _filterDigest;
  const rebuilt = buildExactTable({ ...content, runContext: context.value, evidenceBundles });
  if (!rebuilt.ok || rebuilt.value.tableDigest !== digest.value) return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.tableDigest");
  return rebuilt;
}

export function buildValidatedClaim(input: unknown): ExactResult<ValidatedClaim, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "claimKey", "claimVersion", "claimType", "runContext", "table",
    "subjectGroupKey", "comparisonGroupKey", "metricKey", "direction", "exactEffect",
    "targetSampleSize", "comparisonSampleSize", "confidenceEvidenceLabel",
    "outlierSensitivityState", "evidenceBundles", "evidenceBundleDigests",
    "counterexampleEvidenceBundleDigests", "limitationCodes", "allowedWordingCode",
  ]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== VALIDATED_CLAIM_VERSION) return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  const context = verifyAnalysisRunContext(record.value.runContext); if (!context.ok) return context;
  if (!Array.isArray(record.value.evidenceBundles)) return contractFailure("ti_v3_analytics_contract_invalid", "$.evidenceBundles");
  const bundles = record.value.evidenceBundles as readonly AnalyticalEvidenceBundle[];
  const table = verifyExactTable(record.value.table, context.value, bundles); if (!table.ok) return table;
  const keys = ["claimKey", "claimVersion", "claimType", "subjectGroupKey", "metricKey", "allowedWordingCode"] as const;
  const parsed = new Map<string, string>();
  for (const key of keys) { const value = validateContractKey(record.value[key], `$.${key}`); if (!value.ok) return value; parsed.set(key, value.value); }
  let comparisonGroupKey: string | null = null;
  if (record.value.comparisonGroupKey !== null) { const value = validateContractKey(record.value.comparisonGroupKey, "$.comparisonGroupKey"); if (!value.ok) return value; comparisonGroupKey = value.value; }
  if (record.value.direction !== "positive" && record.value.direction !== "negative" && record.value.direction !== "flat" && record.value.direction !== "unavailable") return contractFailure("ti_v3_analytics_contract_invalid", "$.direction");
  const effect = verifyExactMetricValue(record.value.exactEffect); if (!effect.ok) return effect;
  if (effect.value.metricKey !== parsed.get("metricKey")) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.exactEffect.metricKey");
  const target = validateCanonicalCount(record.value.targetSampleSize, "$.targetSampleSize"); const comparison = validateCanonicalCount(record.value.comparisonSampleSize, "$.comparisonSampleSize");
  if (!target.ok) return target; if (!comparison.ok) return comparison;
  if (record.value.confidenceEvidenceLabel !== "insufficient" && record.value.confidenceEvidenceLabel !== "descriptive" && record.value.confidenceEvidenceLabel !== "tentative" && record.value.confidenceEvidenceLabel !== "unavailable") return contractFailure("ti_v3_analytics_contract_invalid", "$.confidenceEvidenceLabel");
  if (record.value.outlierSensitivityState !== "not_evaluated" && record.value.outlierSensitivityState !== "stable" && record.value.outlierSensitivityState !== "sensitive" && record.value.outlierSensitivityState !== "unavailable") return contractFailure("ti_v3_analytics_contract_invalid", "$.outlierSensitivityState");
  const evidence = validateDigestArray(record.value.evidenceBundleDigests, "$.evidenceBundleDigests", "analytical_evidence_bundle"); const counter = validateDigestArray(record.value.counterexampleEvidenceBundleDigests, "$.counterexampleEvidenceBundleDigests", "analytical_evidence_bundle");
  if (!evidence.ok) return evidence; if (!counter.ok) return counter;
  const catalog = evidenceCatalog(bundles, context.value); if (!catalog.ok) return catalog;
  if ([...evidence.value, ...counter.value].some((digest) => !catalog.value.has(digest))) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.evidenceBundleDigests");
  const limitations = validateReasonCodes(record.value.limitationCodes, "$.limitationCodes"); if (!limitations.ok) return limitations;
  return finalizeContentAddressedAuthority("validated_claim", {
    schemaVersion: VALIDATED_CLAIM_VERSION, claimKey: parsed.get("claimKey") as string,
    claimVersion: parsed.get("claimVersion") as string, claimType: parsed.get("claimType") as string,
    runContextDigest: context.value.runContextDigest, tableDigest: table.value.tableDigest,
    subjectGroupKey: parsed.get("subjectGroupKey") as string, comparisonGroupKey,
    metricKey: parsed.get("metricKey") as string, direction: record.value.direction,
    exactEffect: effect.value, targetSampleSize: target.value, comparisonSampleSize: comparison.value,
    confidenceEvidenceLabel: record.value.confidenceEvidenceLabel,
    outlierSensitivityState: record.value.outlierSensitivityState,
    evidenceBundleDigests: evidence.value, counterexampleEvidenceBundleDigests: counter.value,
    limitationCodes: limitations.value, allowedWordingCode: parsed.get("allowedWordingCode") as string,
  }, "claimDigest") as ExactResult<ValidatedClaim, AnalyticalContractFailure>;
}

export function verifyValidatedClaim(input: unknown, runContext: AnalysisRunContext, table: ExactTable, evidenceBundles: readonly AnalyticalEvidenceBundle[]): ExactResult<ValidatedClaim, AnalyticalContractFailure> {
  const record = validateContractRecord(input, ["schemaVersion", "claimKey", "claimVersion", "claimType", "runContextDigest", "tableDigest", "subjectGroupKey", "comparisonGroupKey", "metricKey", "direction", "exactEffect", "targetSampleSize", "comparisonSampleSize", "confidenceEvidenceLabel", "outlierSensitivityState", "evidenceBundleDigests", "counterexampleEvidenceBundleDigests", "limitationCodes", "allowedWordingCode", "claimDigest"]);
  if (!record.ok) return record;
  const context = verifyAnalysisRunContext(runContext); if (!context.ok || record.value.runContextDigest !== context.value.runContextDigest) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.runContextDigest");
  const verifiedTable = verifyExactTable(table, context.value, evidenceBundles); if (!verifiedTable.ok || record.value.tableDigest !== verifiedTable.value.tableDigest) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.tableDigest");
  const digest = validateClaimedDigest(record.value.claimDigest, "$.claimDigest", "validated_claim"); if (!digest.ok) return digest;
  const { claimDigest: _claimDigest, runContextDigest: _runContextDigest, tableDigest: _tableDigest, ...content } = record.value; void _claimDigest; void _runContextDigest; void _tableDigest;
  const rebuilt = buildValidatedClaim({ ...content, runContext: context.value, table: verifiedTable.value, evidenceBundles });
  if (!rebuilt.ok || rebuilt.value.claimDigest !== digest.value) return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.claimDigest");
  return rebuilt;
}

export function buildChartReadySeries(input: unknown): ExactResult<ChartReadySeries, AnalyticalContractFailure> {
  const record = validateContractRecord(input, ["schemaVersion", "seriesKey", "seriesVersion", "approvedVisualPurpose", "allowedVisualTemplateKeys", "runContext", "sourceTable", "evidenceBundles", "xDomain", "unit", "currency", "timezone", "dateBasis", "zeroBaselineRequired", "denominatorPolicy", "points", "includedCount", "excludedCount", "accessibilitySummaryFacts", "pointBudget", "downsamplingPolicy", "limitationCodes"]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== CHART_READY_SERIES_VERSION) return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  const context = verifyAnalysisRunContext(record.value.runContext); if (!context.ok) return context;
  if (!Array.isArray(record.value.evidenceBundles)) return contractFailure("ti_v3_analytics_contract_invalid", "$.evidenceBundles");
  const bundles = record.value.evidenceBundles as readonly AnalyticalEvidenceBundle[];
  const table = verifyExactTable(record.value.sourceTable, context.value, bundles); if (!table.ok) return table;
  const keys = ["seriesKey", "seriesVersion", "approvedVisualPurpose", "xDomain", "dateBasis", "denominatorPolicy"] as const;
  const parsed = new Map<string, string>(); for (const key of keys) { const value = validateContractKey(record.value[key], `$.${key}`); if (!value.ok) return value; parsed.set(key, value.value); }
  const templates = Array.isArray(record.value.allowedVisualTemplateKeys) ? record.value.allowedVisualTemplateKeys : null; if (templates === null || templates.length > 32) return contractFailure("ti_v3_analytics_contract_invalid", "$.allowedVisualTemplateKeys");
  const templateKeys: string[] = []; for (let index = 0; index < templates.length; index += 1) { const value = validateContractKey(templates[index], `$.allowedVisualTemplateKeys[${index}]`); if (!value.ok) return value; templateKeys.push(value.value); }
  if (new Set(templateKeys).size !== templateKeys.length) return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.allowedVisualTemplateKeys");
  const unit = validateUnit(record.value.unit, "$.unit"); const currency = parseCurrency(record.value.currency, "$.currency"); const timezone = validateTimezone(record.value.timezone, "$.timezone");
  if (!unit.ok) return unit; if (!currency.ok) return currency; if (!timezone.ok) return timezone;
  if (typeof record.value.zeroBaselineRequired !== "boolean") return contractFailure("ti_v3_analytics_contract_invalid", "$.zeroBaselineRequired");
  if (!Array.isArray(record.value.points) || record.value.points.length > GA0_B1_CONTRACT_LIMITS.maximumSeriesPoints) return contractFailure("ti_v3_analytics_contract_oversized", "$.points");
  const evidence = evidenceCatalog(bundles, context.value); if (!evidence.ok) return evidence;
  const tableRows = [...table.value.rows, ...table.value.summaryRows]; const points: ChartReadySeriesPoint[] = [];
  for (let index = 0; index < record.value.points.length; index += 1) {
    const path = `$.points[${index}]`; const point = validateContractRecord(record.value.points[index], ["pointKey", "sourceRowKey", "sourceColumnKey", "semanticOrder", "sampleSize", "evidenceBundleDigest"], [], path); if (!point.ok) return point;
    const pointKey = validateContractKey(point.value.pointKey, `${path}.pointKey`); const rowKey = validateContractKey(point.value.sourceRowKey, `${path}.sourceRowKey`); const columnKey = validateContractKey(point.value.sourceColumnKey, `${path}.sourceColumnKey`); const order = validateCanonicalCount(point.value.semanticOrder, `${path}.semanticOrder`); const sample = validateCanonicalCount(point.value.sampleSize, `${path}.sampleSize`);
    if (!pointKey.ok) return pointKey; if (!rowKey.ok) return rowKey; if (!columnKey.ok) return columnKey; if (!order.ok) return order; if (!sample.ok) return sample;
    const row = tableRows.find((item) => item.rowKey === rowKey.value); const cell = row?.cells.find((item) => item.columnKey === columnKey.value); if (cell === undefined) return contractFailure("ti_v3_analytics_contract_reference_mismatch", path);
    if (cell.metric.unit !== unit.value || (cell.metric.currency !== null && cell.metric.currency !== currency.value)) return contractFailure("ti_v3_analytics_contract_unit_mismatch", path);
    const evidenceDigest = validateClaimedDigest(point.value.evidenceBundleDigest, `${path}.evidenceBundleDigest`, "analytical_evidence_bundle"); if (!evidenceDigest.ok || !evidence.value.has(evidenceDigest.value) || row?.evidenceBundleDigest !== evidenceDigest.value) return contractFailure("ti_v3_analytics_contract_reference_mismatch", `${path}.evidenceBundleDigest`);
    points.push(Object.freeze({ pointKey: pointKey.value, sourceRowKey: rowKey.value, sourceColumnKey: columnKey.value, semanticOrder: order.value, exactValue: cell.metric, sampleSize: sample.value, evidenceBundleDigest: evidenceDigest.value }));
  }
  if (new Set(points.map((point) => point.pointKey)).size !== points.length || new Set(points.map((point) => point.semanticOrder)).size !== points.length) return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.points");
  points.sort((left, right) => BigInt(left.semanticOrder) < BigInt(right.semanticOrder) ? -1 : BigInt(left.semanticOrder) > BigInt(right.semanticOrder) ? 1 : compareUnicodeCodePoints(left.pointKey, right.pointKey));
  const included = validateCanonicalCount(record.value.includedCount, "$.includedCount"); const excluded = validateCanonicalCount(record.value.excludedCount, "$.excludedCount"); const pointBudget = validateCanonicalCount(record.value.pointBudget, "$.pointBudget"); if (!included.ok) return included; if (!excluded.ok) return excluded; if (!pointBudget.ok || BigInt(pointBudget.value) < BigInt(points.length)) return contractFailure("ti_v3_analytics_contract_count_invalid", "$.pointBudget");
  if (record.value.downsamplingPolicy !== "none_exact_points_only") return contractFailure("ti_v3_analytics_contract_invalid", "$.downsamplingPolicy");
  if (!Array.isArray(record.value.accessibilitySummaryFacts) || record.value.accessibilitySummaryFacts.length > 32) return contractFailure("ti_v3_analytics_contract_oversized", "$.accessibilitySummaryFacts");
  const facts: ExactMetricValue[] = []; for (let index = 0; index < record.value.accessibilitySummaryFacts.length; index += 1) { const fact = verifyExactMetricValue(record.value.accessibilitySummaryFacts[index]); if (!fact.ok) return fact; facts.push(fact.value); }
  const limitations = validateReasonCodes(record.value.limitationCodes, "$.limitationCodes"); if (!limitations.ok) return limitations;
  return finalizeContentAddressedAuthority("chart_ready_series", {
    schemaVersion: CHART_READY_SERIES_VERSION, seriesKey: parsed.get("seriesKey") as string, seriesVersion: parsed.get("seriesVersion") as string,
    approvedVisualPurpose: parsed.get("approvedVisualPurpose") as string, allowedVisualTemplateKeys: Object.freeze(templateKeys), runContextDigest: context.value.runContextDigest,
    sourceTableDigest: table.value.tableDigest, xDomain: parsed.get("xDomain") as string, unit: unit.value, currency: currency.value, timezone: timezone.value,
    dateBasis: parsed.get("dateBasis") as string, zeroBaselineRequired: record.value.zeroBaselineRequired,
    denominatorPolicy: parsed.get("denominatorPolicy") as string, points: Object.freeze(points), includedCount: included.value, excludedCount: excluded.value,
    accessibilitySummaryFacts: Object.freeze(facts), pointBudget: pointBudget.value, downsamplingPolicy: "none_exact_points_only" as const,
    limitationCodes: limitations.value, tableAlternativeDigest: table.value.tableDigest,
  }, "seriesDigest") as ExactResult<ChartReadySeries, AnalyticalContractFailure>;
}

export function verifyChartReadySeries(input: unknown, runContext: AnalysisRunContext, sourceTable: ExactTable, evidenceBundles: readonly AnalyticalEvidenceBundle[]): ExactResult<ChartReadySeries, AnalyticalContractFailure> {
  const record = validateContractRecord(input, ["schemaVersion", "seriesKey", "seriesVersion", "approvedVisualPurpose", "allowedVisualTemplateKeys", "runContextDigest", "sourceTableDigest", "xDomain", "unit", "currency", "timezone", "dateBasis", "zeroBaselineRequired", "denominatorPolicy", "points", "includedCount", "excludedCount", "accessibilitySummaryFacts", "pointBudget", "downsamplingPolicy", "limitationCodes", "tableAlternativeDigest", "seriesDigest"]); if (!record.ok) return record;
  const context = verifyAnalysisRunContext(runContext); if (!context.ok || record.value.runContextDigest !== context.value.runContextDigest) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.runContextDigest");
  const table = verifyExactTable(sourceTable, context.value, evidenceBundles); if (!table.ok || record.value.sourceTableDigest !== table.value.tableDigest || record.value.tableAlternativeDigest !== table.value.tableDigest) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.sourceTableDigest");
  const digest = validateClaimedDigest(record.value.seriesDigest, "$.seriesDigest", "chart_ready_series"); if (!digest.ok) return digest;
  const points = Array.isArray(record.value.points) ? record.value.points.map((point) => { if (typeof point !== "object" || point === null) return point; const { exactValue: _exactValue, ...selection } = point as Record<string, unknown>; void _exactValue; return selection; }) : record.value.points;
  const { seriesDigest: _seriesDigest, runContextDigest: _runContextDigest, sourceTableDigest: _sourceTableDigest, tableAlternativeDigest: _tableAlternativeDigest, ...content } = record.value; void _seriesDigest; void _runContextDigest; void _sourceTableDigest; void _tableAlternativeDigest;
  const rebuilt = buildChartReadySeries({ ...content, points, runContext: context.value, sourceTable: table.value, evidenceBundles });
  if (!rebuilt.ok || rebuilt.value.seriesDigest !== digest.value) return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.seriesDigest");
  return rebuilt;
}
