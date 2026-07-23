import type { ExactResult } from "../../domain/exact";
import type { CanonicalContentDigest } from "../../domain/identity";
import {
  GA0_B1_CONTRACT_LIMITS,
  contractFailure,
  finalizeContentAddressedAuthority,
  validateClaimedDigest,
  validateContractKey,
  validateContractRecord,
  validateKeyArray,
  validateReasonCode,
  validateReasonCodes,
  type AnalyticalContractFailure,
} from "./contract-validation";
import { getAnalysisRunContextDependencies, verifyAnalysisRunContext, type AnalysisRunContext } from "./run-context";

export const ANALYTICAL_EVIDENCE_BUNDLE_VERSION = "ti_v3_analytical_evidence_bundle_v1" as const;
export const ANALYTICAL_DIAGNOSTICS_VERSION = "ti_v3_analytical_diagnostics_v1" as const;

export interface AnalyticalEvidenceBundle {
  readonly schemaVersion: typeof ANALYTICAL_EVIDENCE_BUNDLE_VERSION;
  readonly evidenceKey: string;
  readonly runContextDigest: CanonicalContentDigest;
  readonly snapshotDigest: CanonicalContentDigest;
  readonly filterDigest: CanonicalContentDigest;
  readonly datasetReceiptDigest: CanonicalContentDigest;
  readonly comparisonGroupKey: string | null;
  readonly inclusionState: "included" | "excluded";
  readonly candidateKeys: readonly string[];
  readonly roundTripKeys: readonly string[];
  readonly occurrenceKeys: readonly string[];
  readonly exclusionReasonCodes: readonly string[];
  readonly limitationCodes: readonly string[];
  readonly bundleDigest: CanonicalContentDigest;
}

export interface AnalyticalDiagnosticEntry {
  readonly diagnosticKey: string;
  readonly severity: "info" | "limitation" | "blocked";
  readonly code: string;
  readonly affectedKeys: readonly string[];
}

export interface AnalyticalDiagnostics {
  readonly schemaVersion: typeof ANALYTICAL_DIAGNOSTICS_VERSION;
  readonly runContextDigest: CanonicalContentDigest;
  readonly entries: readonly AnalyticalDiagnosticEntry[];
  readonly diagnosticsDigest: CanonicalContentDigest;
}

export function buildAnalyticalEvidenceBundle(
  input: unknown,
): ExactResult<AnalyticalEvidenceBundle, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "evidenceKey", "runContext", "comparisonGroupKey",
    "inclusionState", "candidateKeys",
  ]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== ANALYTICAL_EVIDENCE_BUNDLE_VERSION) return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  const context = verifyAnalysisRunContext((input as Record<string, unknown>).runContext);
  if (!context.ok) return contractFailure(context.error.code, `$.runContext${context.error.path.slice(1)}`);
  const evidenceKey = validateContractKey(record.value.evidenceKey, "$.evidenceKey");
  if (!evidenceKey.ok) return evidenceKey;
  let comparisonGroupKey: string | null = null;
  if (record.value.comparisonGroupKey !== null) {
    const group = validateContractKey(record.value.comparisonGroupKey, "$.comparisonGroupKey");
    if (!group.ok) return group;
    comparisonGroupKey = group.value;
  }
  if (record.value.inclusionState !== "included" && record.value.inclusionState !== "excluded") return contractFailure("ti_v3_analytics_contract_invalid", "$.inclusionState");
  const candidateKeys = validateKeyArray(record.value.candidateKeys, "$.candidateKeys");
  if (!candidateKeys.ok || candidateKeys.value.length === 0) return candidateKeys.ok ? contractFailure("ti_v3_analytics_contract_invalid", "$.candidateKeys") : candidateKeys;
  const dependencies = getAnalysisRunContextDependencies(context.value);
  if (dependencies === null) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.runContext");
  const roundTripKeys = new Set<string>();
  const occurrenceKeys = new Set<string>();
  const limitationCodes = new Set<string>();
  const exclusionReasonCodes = new Set<string>();
  if (record.value.inclusionState === "included") {
    for (const candidateKey of candidateKeys.value) {
      const row = dependencies.datasetReceipt.rows.find((item) => item.semanticRoundTripKey === candidateKey);
      if (row === undefined) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.candidateKeys");
      roundTripKeys.add(row.semanticRoundTripKey);
      row.supportingOccurrenceKeys.forEach((key) => occurrenceKeys.add(key));
      row.limitationCodes.forEach((code) => limitationCodes.add(code));
    }
  } else {
    for (const candidateKey of candidateKeys.value) {
      const exclusion = dependencies.datasetReceipt.excludedCandidates.find((item) => item.candidateKey === candidateKey);
      if (exclusion === undefined) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.candidateKeys");
      if (exclusion.semanticRoundTripKey !== null) roundTripKeys.add(exclusion.semanticRoundTripKey);
      exclusion.relatedOccurrenceKeys.forEach((key) => occurrenceKeys.add(key));
      exclusion.limitationCodes.forEach((code) => limitationCodes.add(code));
      limitationCodes.add(exclusion.reasonCode);
      exclusionReasonCodes.add(exclusion.reasonCode);
    }
  }
  return finalizeContentAddressedAuthority("analytical_evidence_bundle", {
    schemaVersion: ANALYTICAL_EVIDENCE_BUNDLE_VERSION,
    evidenceKey: evidenceKey.value,
    runContextDigest: context.value.runContextDigest,
    snapshotDigest: context.value.snapshotDigest,
    filterDigest: context.value.filterDigest,
    datasetReceiptDigest: context.value.datasetReceiptDigest,
    comparisonGroupKey,
    inclusionState: record.value.inclusionState,
    candidateKeys: candidateKeys.value,
    roundTripKeys: [...roundTripKeys].sort(),
    occurrenceKeys: [...occurrenceKeys].sort(),
    exclusionReasonCodes: [...exclusionReasonCodes].sort(),
    limitationCodes: [...limitationCodes].sort(),
  }, "bundleDigest") as ExactResult<AnalyticalEvidenceBundle, AnalyticalContractFailure>;
}

export function verifyAnalyticalEvidenceBundle(
  input: unknown,
  runContext: AnalysisRunContext,
): ExactResult<AnalyticalEvidenceBundle, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "evidenceKey", "runContextDigest", "snapshotDigest", "filterDigest",
    "datasetReceiptDigest", "comparisonGroupKey", "inclusionState", "candidateKeys", "roundTripKeys",
    "occurrenceKeys", "exclusionReasonCodes", "limitationCodes", "bundleDigest",
  ]);
  if (!record.ok) return record;
  const context = verifyAnalysisRunContext(runContext);
  if (!context.ok || record.value.runContextDigest !== context.value.runContextDigest || record.value.snapshotDigest !== context.value.snapshotDigest || record.value.filterDigest !== context.value.filterDigest || record.value.datasetReceiptDigest !== context.value.datasetReceiptDigest) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$");
  const digest = validateClaimedDigest(record.value.bundleDigest, "$.bundleDigest", "analytical_evidence_bundle");
  if (!digest.ok) return digest;
  const rebuilt = buildAnalyticalEvidenceBundle({
    schemaVersion: record.value.schemaVersion,
    evidenceKey: record.value.evidenceKey,
    runContext: context.value,
    comparisonGroupKey: record.value.comparisonGroupKey,
    inclusionState: record.value.inclusionState,
    candidateKeys: record.value.candidateKeys,
  });
  if (!rebuilt.ok || rebuilt.value.bundleDigest !== digest.value) return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.bundleDigest");
  return rebuilt;
}

export function buildAnalyticalDiagnostics(
  input: unknown,
): ExactResult<AnalyticalDiagnostics, AnalyticalContractFailure> {
  const record = validateContractRecord(input, ["schemaVersion", "runContext", "entries"]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== ANALYTICAL_DIAGNOSTICS_VERSION) return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  const context = verifyAnalysisRunContext((input as Record<string, unknown>).runContext);
  if (!context.ok) return contractFailure(context.error.code, `$.runContext${context.error.path.slice(1)}`);
  if (!Array.isArray(record.value.entries) || record.value.entries.length > GA0_B1_CONTRACT_LIMITS.maximumDiagnostics) return contractFailure("ti_v3_analytics_contract_oversized", "$.entries");
  const entries: AnalyticalDiagnosticEntry[] = [];
  for (let index = 0; index < record.value.entries.length; index += 1) {
    const path = `$.entries[${index}]`;
    const entry = validateContractRecord(record.value.entries[index], ["diagnosticKey", "severity", "code", "affectedKeys"], [], path);
    if (!entry.ok) return entry;
    const key = validateContractKey(entry.value.diagnosticKey, `${path}.diagnosticKey`);
    if (!key.ok) return key;
    if (entry.value.severity !== "info" && entry.value.severity !== "limitation" && entry.value.severity !== "blocked") return contractFailure("ti_v3_analytics_contract_invalid", `${path}.severity`);
    const code = validateReasonCode(entry.value.code, `${path}.code`);
    if (!code.ok) return code;
    const affected = validateKeyArray(entry.value.affectedKeys, `${path}.affectedKeys`);
    if (!affected.ok) return affected;
    entries.push(Object.freeze({ diagnosticKey: key.value, severity: entry.value.severity, code: code.value, affectedKeys: affected.value }));
  }
  const keys = entries.map((entry) => entry.diagnosticKey);
  if (new Set(keys).size !== keys.length) return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.entries");
  entries.sort((left, right) => left.diagnosticKey < right.diagnosticKey ? -1 : left.diagnosticKey > right.diagnosticKey ? 1 : 0);
  return finalizeContentAddressedAuthority("analytical_diagnostics", {
    schemaVersion: ANALYTICAL_DIAGNOSTICS_VERSION,
    runContextDigest: context.value.runContextDigest,
    entries,
  }, "diagnosticsDigest") as ExactResult<AnalyticalDiagnostics, AnalyticalContractFailure>;
}

export function verifyAnalyticalDiagnostics(
  input: unknown,
  runContext: AnalysisRunContext,
): ExactResult<AnalyticalDiagnostics, AnalyticalContractFailure> {
  const record = validateContractRecord(input, ["schemaVersion", "runContextDigest", "entries", "diagnosticsDigest"]);
  if (!record.ok) return record;
  const context = verifyAnalysisRunContext(runContext);
  if (!context.ok || record.value.runContextDigest !== context.value.runContextDigest) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.runContextDigest");
  const digest = validateClaimedDigest(record.value.diagnosticsDigest, "$.diagnosticsDigest", "analytical_diagnostics");
  if (!digest.ok) return digest;
  const rebuilt = buildAnalyticalDiagnostics({ schemaVersion: record.value.schemaVersion, runContext: context.value, entries: record.value.entries });
  if (!rebuilt.ok || rebuilt.value.diagnosticsDigest !== digest.value) return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.diagnosticsDigest");
  return rebuilt;
}
