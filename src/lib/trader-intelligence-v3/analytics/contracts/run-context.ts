import { compareUnicodeCodePoints } from "../../domain/canonical";
import type { ExactResult } from "../../domain/exact";
import type { CanonicalContentDigest } from "../../domain/identity";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateCanonicalCount,
  validateClaimedDigest,
  validateContractKey,
  validateContractRecord,
  validateDigestArray,
  validateReasonCodes,
  type AnalyticalContractFailure,
} from "./contract-validation";

export const ANALYSIS_RUN_CONTEXT_VERSION = "ti_v3_analysis_run_context_v1" as const;
export const ANALYSIS_RUN_RECEIPT_VERSION = "ti_v3_analysis_run_receipt_v1" as const;

export interface AnalysisRunContext {
  readonly schemaVersion: typeof ANALYSIS_RUN_CONTEXT_VERSION;
  readonly toolKey: string;
  readonly toolVersion: string;
  readonly toolPolicyVersion: string;
  readonly snapshotDigest: CanonicalContentDigest;
  readonly filterDigest: CanonicalContentDigest;
  readonly datasetReceiptDigest: CanonicalContentDigest;
  readonly normalizedArgumentsDigest: CanonicalContentDigest;
  readonly eligibilityState: "eligible" | "limited";
  readonly runContextDigest: CanonicalContentDigest;
}

export interface AnalysisRunReceipt {
  readonly schemaVersion: typeof ANALYSIS_RUN_RECEIPT_VERSION;
  readonly runContextDigest: CanonicalContentDigest;
  readonly runStatus: "completed" | "limited" | "blocked";
  readonly tableDigests: readonly CanonicalContentDigest[];
  readonly claimDigests: readonly CanonicalContentDigest[];
  readonly seriesDigests: readonly CanonicalContentDigest[];
  readonly evidenceBundleDigests: readonly CanonicalContentDigest[];
  readonly includedCount: string;
  readonly excludedCount: string;
  readonly limitationCodes: readonly string[];
  readonly diagnosticsDigest: CanonicalContentDigest;
  readonly runDigest: CanonicalContentDigest;
}

export function buildAnalysisRunContext(
  input: unknown,
): ExactResult<AnalysisRunContext, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "toolKey", "toolVersion", "toolPolicyVersion",
    "snapshotDigest", "filterDigest", "datasetReceiptDigest",
    "normalizedArgumentsDigest", "eligibilityState",
  ]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== ANALYSIS_RUN_CONTEXT_VERSION) return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  const toolKey = validateContractKey(record.value.toolKey, "$.toolKey");
  const toolVersion = validateContractKey(record.value.toolVersion, "$.toolVersion");
  const policyVersion = validateContractKey(record.value.toolPolicyVersion, "$.toolPolicyVersion");
  if (!toolKey.ok) return toolKey;
  if (!toolVersion.ok) return toolVersion;
  if (!policyVersion.ok) return policyVersion;
  const snapshot = validateClaimedDigest(record.value.snapshotDigest, "$.snapshotDigest", "analysis_snapshot");
  const filter = validateClaimedDigest(record.value.filterDigest, "$.filterDigest", "canonical_filter");
  const dataset = validateClaimedDigest(record.value.datasetReceiptDigest, "$.datasetReceiptDigest", "analytical_dataset");
  const argumentsDigest = validateClaimedDigest(record.value.normalizedArgumentsDigest, "$.normalizedArgumentsDigest", "canonical_content");
  if (!snapshot.ok) return snapshot;
  if (!filter.ok) return filter;
  if (!dataset.ok) return dataset;
  if (!argumentsDigest.ok) return argumentsDigest;
  if (record.value.eligibilityState !== "eligible" && record.value.eligibilityState !== "limited") return contractFailure("ti_v3_analytics_contract_invalid", "$.eligibilityState");
  return finalizeContentAddressedAuthority("analysis_run_context", {
    schemaVersion: ANALYSIS_RUN_CONTEXT_VERSION,
    toolKey: toolKey.value,
    toolVersion: toolVersion.value,
    toolPolicyVersion: policyVersion.value,
    snapshotDigest: snapshot.value,
    filterDigest: filter.value,
    datasetReceiptDigest: dataset.value,
    normalizedArgumentsDigest: argumentsDigest.value,
    eligibilityState: record.value.eligibilityState,
  }, "runContextDigest") as ExactResult<AnalysisRunContext, AnalyticalContractFailure>;
}

export function verifyAnalysisRunContext(
  input: unknown,
  expected?: Readonly<{
    snapshotDigest: CanonicalContentDigest;
    filterDigest: CanonicalContentDigest;
    datasetReceiptDigest: CanonicalContentDigest;
  }>,
): ExactResult<AnalysisRunContext, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "toolKey", "toolVersion", "toolPolicyVersion", "snapshotDigest",
    "filterDigest", "datasetReceiptDigest", "normalizedArgumentsDigest",
    "eligibilityState", "runContextDigest",
  ]);
  if (!record.ok) return record;
  const digest = validateClaimedDigest(record.value.runContextDigest, "$.runContextDigest", "analysis_run_context");
  if (!digest.ok) return digest;
  const { runContextDigest: _digest, ...content } = record.value;
  void _digest;
  const rebuilt = buildAnalysisRunContext(content);
  if (!rebuilt.ok || rebuilt.value.runContextDigest !== digest.value) return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.runContextDigest");
  if (expected !== undefined && (
    rebuilt.value.snapshotDigest !== expected.snapshotDigest ||
    rebuilt.value.filterDigest !== expected.filterDigest ||
    rebuilt.value.datasetReceiptDigest !== expected.datasetReceiptDigest
  )) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$");
  return rebuilt;
}

function parseArtifactDigests(
  input: unknown,
  path: string,
  domain: string,
): ExactResult<readonly CanonicalContentDigest[], AnalyticalContractFailure> {
  return validateDigestArray(input, path, domain, 1_000);
}

export function buildAnalysisRunReceipt(
  input: unknown,
): ExactResult<AnalysisRunReceipt, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "runContext", "runStatus", "tableDigests", "claimDigests",
    "seriesDigests", "evidenceBundleDigests", "includedCount", "excludedCount",
    "limitationCodes", "diagnosticsDigest",
  ]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== ANALYSIS_RUN_RECEIPT_VERSION) return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  const context = verifyAnalysisRunContext(record.value.runContext);
  if (!context.ok) return contractFailure(context.error.code, `$.runContext${context.error.path.slice(1)}`);
  if (record.value.runStatus !== "completed" && record.value.runStatus !== "limited" && record.value.runStatus !== "blocked") return contractFailure("ti_v3_analytics_contract_invalid", "$.runStatus");
  const tables = parseArtifactDigests(record.value.tableDigests, "$.tableDigests", "exact_table");
  const claims = parseArtifactDigests(record.value.claimDigests, "$.claimDigests", "validated_claim");
  const series = parseArtifactDigests(record.value.seriesDigests, "$.seriesDigests", "chart_ready_series");
  const evidence = parseArtifactDigests(record.value.evidenceBundleDigests, "$.evidenceBundleDigests", "analytical_evidence_bundle");
  if (!tables.ok) return tables;
  if (!claims.ok) return claims;
  if (!series.ok) return series;
  if (!evidence.ok) return evidence;
  const included = validateCanonicalCount(record.value.includedCount, "$.includedCount");
  const excluded = validateCanonicalCount(record.value.excludedCount, "$.excludedCount");
  if (!included.ok) return included;
  if (!excluded.ok) return excluded;
  const limitations = validateReasonCodes(record.value.limitationCodes, "$.limitationCodes");
  if (!limitations.ok) return limitations;
  const diagnostics = validateClaimedDigest(record.value.diagnosticsDigest, "$.diagnosticsDigest", "analytical_diagnostics");
  if (!diagnostics.ok) return diagnostics;
  if (record.value.runStatus === "completed" && limitations.value.length > 0) return contractFailure("ti_v3_analytics_contract_invalid", "$.runStatus");
  return finalizeContentAddressedAuthority("analysis_run_receipt", {
    schemaVersion: ANALYSIS_RUN_RECEIPT_VERSION,
    runContextDigest: context.value.runContextDigest,
    runStatus: record.value.runStatus,
    tableDigests: tables.value,
    claimDigests: claims.value,
    seriesDigests: series.value,
    evidenceBundleDigests: evidence.value,
    includedCount: included.value,
    excludedCount: excluded.value,
    limitationCodes: limitations.value,
    diagnosticsDigest: diagnostics.value,
  }, "runDigest") as ExactResult<AnalysisRunReceipt, AnalyticalContractFailure>;
}

export function verifyAnalysisRunReceipt(
  input: unknown,
  runContext: AnalysisRunContext,
  expectedArtifacts: Readonly<{
    tableDigests: readonly CanonicalContentDigest[];
    claimDigests: readonly CanonicalContentDigest[];
    seriesDigests: readonly CanonicalContentDigest[];
    evidenceBundleDigests: readonly CanonicalContentDigest[];
    diagnosticsDigest: CanonicalContentDigest;
  }>,
): ExactResult<AnalysisRunReceipt, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "runContextDigest", "runStatus", "tableDigests", "claimDigests",
    "seriesDigests", "evidenceBundleDigests", "includedCount", "excludedCount",
    "limitationCodes", "diagnosticsDigest", "runDigest",
  ]);
  if (!record.ok) return record;
  const context = verifyAnalysisRunContext(runContext);
  if (!context.ok || context.value.runContextDigest !== record.value.runContextDigest) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.runContextDigest");
  const digest = validateClaimedDigest(record.value.runDigest, "$.runDigest", "analysis_run_receipt");
  if (!digest.ok) return digest;
  const { runDigest: _runDigest, runContextDigest: _runContextDigest, ...content } = record.value;
  void _runDigest; void _runContextDigest;
  const rebuilt = buildAnalysisRunReceipt({ ...content, runContext: context.value });
  if (!rebuilt.ok || rebuilt.value.runDigest !== digest.value) return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.runDigest");
  if (
    rebuilt.value.tableDigests.join("\n") !== [...expectedArtifacts.tableDigests].sort(compareUnicodeCodePoints).join("\n") ||
    rebuilt.value.claimDigests.join("\n") !== [...expectedArtifacts.claimDigests].sort(compareUnicodeCodePoints).join("\n") ||
    rebuilt.value.seriesDigests.join("\n") !== [...expectedArtifacts.seriesDigests].sort(compareUnicodeCodePoints).join("\n") ||
    rebuilt.value.evidenceBundleDigests.join("\n") !== [...expectedArtifacts.evidenceBundleDigests].sort(compareUnicodeCodePoints).join("\n") ||
    rebuilt.value.diagnosticsDigest !== expectedArtifacts.diagnosticsDigest
  ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$");
  return rebuilt;
}
