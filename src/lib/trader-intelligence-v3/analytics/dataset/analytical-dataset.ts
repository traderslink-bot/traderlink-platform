import { compareUnicodeCodePoints } from "../../domain/canonical";
import { parseCurrencyCode, type CurrencyCode, type ExactResult } from "../../domain/exact";
import type { CanonicalContentDigest, CanonicalExecutionDigest } from "../../domain/identity";
import {
  GA0_B1_CONTRACT_LIMITS,
  contractFailure,
  countFromLength,
  countsReconcile,
  finalizeContentAddressedAuthority,
  preflightTopLevelArrayLimit,
  validateCanonicalCount,
  validateClaimedDigest,
  validateContractKey,
  validateContractRecord,
  validateDigestArray,
  validateKeyArray,
  validateReasonCode,
  validateReasonCodes,
  validateTimestampValue,
  type AnalyticalContractFailure,
} from "../contracts/contract-validation";
import { verifyAnalyticalRow, type AnalyticalRow } from "./analytical-row";

export const ANALYTICAL_DATASET_VERSION = "ti_v3_analytical_dataset_v1" as const;

export const ANALYTICAL_EXCLUSION_REASONS = Object.freeze({
  eligibilityBlocked: "ti_v3_analytics_eligibility_blocked",
  eligibilityPending: "ti_v3_analytics_eligibility_pending",
  eligibilityStale: "ti_v3_analytics_eligibility_stale",
  eligibilityIncompatible: "ti_v3_analytics_eligibility_incompatible",
  openLifecycle: "ti_v3_analytics_open_or_incomplete_lifecycle",
  blockedReconstruction: "ti_v3_analytics_reconstruction_blocked",
  ambiguousReconstruction: "ti_v3_analytics_reconstruction_ambiguous",
  missingRoundTripInventory: "ti_v3_analytics_round_trip_inventory_missing",
  missingExecutionEvidence: "ti_v3_analytics_execution_evidence_missing_or_foreign",
  missingOccurrenceEvidence: "ti_v3_analytics_occurrence_evidence_missing_or_foreign",
  catalogMismatch: "ti_v3_analytics_catalog_reconstruction_mismatch",
  unresolvedInstrument: "ti_v3_analytics_instrument_unresolved",
  mixedCurrency: "ti_v3_analytics_mixed_currency",
  unavailableFinancialFact: "ti_v3_analytics_exact_financial_fact_unavailable",
  unprovableSession: "ti_v3_analytics_session_unprovable",
  unprovableOrder: "ti_v3_analytics_economic_order_unprovable",
  filterExcluded: "ti_v3_analytics_canonical_filter_excluded",
  duplicateCandidate: "ti_v3_analytics_duplicate_candidate_identity",
  oversizedInput: "ti_v3_analytics_input_oversized",
} as const);

export interface ExcludedAnalyticalCandidate {
  readonly candidateKey: string;
  readonly semanticRoundTripKey: string | null;
  readonly reasonCode: string;
  readonly limitationCodes: readonly string[];
  readonly relatedExecutionDigests: readonly CanonicalExecutionDigest[];
  readonly relatedOccurrenceKeys: readonly string[];
  readonly currency: CurrencyCode | null;
}

export interface AnalyticalExclusionCount {
  readonly reasonCode: string;
  readonly count: string;
}

export interface AnalyticalDatasetReceipt {
  readonly schemaVersion: typeof ANALYTICAL_DATASET_VERSION;
  readonly snapshotDigest: CanonicalContentDigest;
  readonly manifestDigest: CanonicalContentDigest;
  readonly filterDigest: CanonicalContentDigest;
  readonly analysisCutoffAt: string;
  readonly correctionCutoffAt: string;
  readonly correctionResultDigest: CanonicalContentDigest;
  readonly eligibilitySetDigest: CanonicalContentDigest;
  readonly retrospectivePolicyDigest: CanonicalContentDigest;
  readonly evidenceNamespace: string;
  readonly occurrenceInventoryDigest: CanonicalContentDigest | null;
  readonly roundTripInventoryDigest: CanonicalContentDigest | null;
  readonly adapterKey: string;
  readonly adapterVersion: string;
  readonly derivationPolicyKey: string;
  readonly derivationPolicyVersion: string;
  readonly currencyPartitions: readonly CurrencyCode[];
  readonly rows: readonly AnalyticalRow[];
  readonly excludedCandidates: readonly ExcludedAnalyticalCandidate[];
  readonly candidateCount: string;
  readonly includedCount: string;
  readonly excludedCount: string;
  readonly exclusionCountsByReason: readonly AnalyticalExclusionCount[];
  readonly limitations: readonly string[];
  readonly receiptDigest: CanonicalContentDigest;
}

function parseNullableDigest(
  input: unknown,
  path: string,
  expectedDomain: string,
): ExactResult<CanonicalContentDigest | null, AnalyticalContractFailure> {
  if (input === null) return { ok: true, value: null };
  return validateClaimedDigest(input, path, expectedDomain);
}

function parseExclusion(
  input: unknown,
  path: string,
): ExactResult<ExcludedAnalyticalCandidate, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "candidateKey", "semanticRoundTripKey", "reasonCode", "limitationCodes",
    "relatedExecutionDigests", "relatedOccurrenceKeys", "currency",
  ], [], path);
  if (!record.ok) return record;
  const candidateKey = validateContractKey(record.value.candidateKey, `${path}.candidateKey`, 512);
  if (!candidateKey.ok) return candidateKey;
  let semanticRoundTripKey: string | null = null;
  if (record.value.semanticRoundTripKey !== null) {
    const key = validateContractKey(record.value.semanticRoundTripKey, `${path}.semanticRoundTripKey`, 512);
    if (!key.ok) return key;
    semanticRoundTripKey = key.value;
  }
  const reason = validateReasonCode(record.value.reasonCode, `${path}.reasonCode`);
  if (!reason.ok) return reason;
  const limitations = validateReasonCodes(record.value.limitationCodes, `${path}.limitationCodes`);
  if (!limitations.ok) return limitations;
  const executions = validateDigestArray(
    record.value.relatedExecutionDigests,
    `${path}.relatedExecutionDigests`,
    "canonical_execution",
  );
  if (!executions.ok) return executions;
  const occurrences = validateKeyArray(record.value.relatedOccurrenceKeys, `${path}.relatedOccurrenceKeys`);
  if (!occurrences.ok) return occurrences;
  let currency: CurrencyCode | null = null;
  if (record.value.currency !== null) {
    const parsed = parseCurrencyCode(record.value.currency);
    if (!parsed.ok) return contractFailure("ti_v3_analytics_contract_invalid", `${path}.currency`);
    currency = parsed.value;
  }
  return {
    ok: true,
    value: Object.freeze({
      candidateKey: candidateKey.value,
      semanticRoundTripKey,
      reasonCode: reason.value,
      limitationCodes: limitations.value,
      relatedExecutionDigests: executions.value as readonly CanonicalExecutionDigest[],
      relatedOccurrenceKeys: occurrences.value,
      currency,
    }),
  };
}

function compareRows(left: AnalyticalRow, right: AnalyticalRow): number {
  const keyFields: readonly [string, string][] = [
    [left.currency, right.currency],
    [left.canonicalAccountKey, right.canonicalAccountKey],
    [left.sessionDate, right.sessionDate],
  ];
  for (const [leftValue, rightValue] of keyFields) {
    const compared = compareUnicodeCodePoints(leftValue, rightValue);
    if (compared !== 0) return compared;
  }
  const sequence = BigInt(left.sequenceInPartition) - BigInt(right.sequenceInPartition);
  if (sequence !== BigInt(0)) return sequence < BigInt(0) ? -1 : 1;
  return compareUnicodeCodePoints(left.semanticRoundTripKey, right.semanticRoundTripKey);
}

export function buildAnalyticalDatasetReceipt(
  input: unknown,
): ExactResult<AnalyticalDatasetReceipt, AnalyticalContractFailure> {
  const rowLimit = preflightTopLevelArrayLimit(input, "rows", GA0_B1_CONTRACT_LIMITS.maximumRows);
  if (!rowLimit.ok) return rowLimit;
  const exclusionLimit = preflightTopLevelArrayLimit(input, "excludedCandidates", GA0_B1_CONTRACT_LIMITS.maximumRows);
  if (!exclusionLimit.ok) return exclusionLimit;
  const record = validateContractRecord(input, [
    "schemaVersion", "snapshotDigest", "manifestDigest", "filterDigest",
    "analysisCutoffAt", "correctionCutoffAt", "correctionResultDigest",
    "eligibilitySetDigest", "retrospectivePolicyDigest", "evidenceNamespace",
    "occurrenceInventoryDigest", "roundTripInventoryDigest", "adapterKey",
    "adapterVersion", "derivationPolicyKey", "derivationPolicyVersion", "rows",
    "excludedCandidates", "limitations",
  ]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== ANALYTICAL_DATASET_VERSION) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  }
  const snapshot = validateClaimedDigest(record.value.snapshotDigest, "$.snapshotDigest", "analysis_snapshot");
  if (!snapshot.ok) return snapshot;
  const manifest = validateClaimedDigest(record.value.manifestDigest, "$.manifestDigest", "dataset_manifest");
  if (!manifest.ok) return manifest;
  const filter = validateClaimedDigest(record.value.filterDigest, "$.filterDigest", "canonical_filter");
  if (!filter.ok) return filter;
  const correction = validateClaimedDigest(record.value.correctionResultDigest, "$.correctionResultDigest", "correction_result");
  if (!correction.ok) return correction;
  const eligibility = validateClaimedDigest(record.value.eligibilitySetDigest, "$.eligibilitySetDigest", "eligibility_set");
  if (!eligibility.ok) return eligibility;
  const policy = validateClaimedDigest(record.value.retrospectivePolicyDigest, "$.retrospectivePolicyDigest", "retrospective_policy");
  if (!policy.ok) return policy;
  const occurrence = parseNullableDigest(record.value.occurrenceInventoryDigest, "$.occurrenceInventoryDigest", "evidence_inventory");
  if (!occurrence.ok) return occurrence;
  const roundTrips = parseNullableDigest(record.value.roundTripInventoryDigest, "$.roundTripInventoryDigest", "evidence_inventory");
  if (!roundTrips.ok) return roundTrips;
  const analysisCutoff = validateTimestampValue(record.value.analysisCutoffAt, "$.analysisCutoffAt");
  if (!analysisCutoff.ok) return analysisCutoff;
  const correctionCutoff = validateTimestampValue(record.value.correctionCutoffAt, "$.correctionCutoffAt");
  if (!correctionCutoff.ok) return correctionCutoff;
  if (correctionCutoff.value > analysisCutoff.value) return contractFailure("ti_v3_analytics_contract_invalid", "$.correctionCutoffAt");
  const evidenceNamespace = validateContractKey(record.value.evidenceNamespace, "$.evidenceNamespace");
  if (!evidenceNamespace.ok || !evidenceNamespace.value.startsWith("evidence:")) return evidenceNamespace.ok ? contractFailure("ti_v3_analytics_contract_invalid", "$.evidenceNamespace") : evidenceNamespace;
  const adapterKey = validateContractKey(record.value.adapterKey, "$.adapterKey");
  if (!adapterKey.ok) return adapterKey;
  const adapterVersion = validateContractKey(record.value.adapterVersion, "$.adapterVersion");
  if (!adapterVersion.ok) return adapterVersion;
  const derivationPolicyKey = validateContractKey(record.value.derivationPolicyKey, "$.derivationPolicyKey");
  if (!derivationPolicyKey.ok) return derivationPolicyKey;
  const derivationPolicyVersion = validateContractKey(record.value.derivationPolicyVersion, "$.derivationPolicyVersion");
  if (!derivationPolicyVersion.ok) return derivationPolicyVersion;
  if (!Array.isArray(record.value.rows) || record.value.rows.length > GA0_B1_CONTRACT_LIMITS.maximumRows) {
    return contractFailure("ti_v3_analytics_contract_oversized", "$.rows");
  }
  const rows: AnalyticalRow[] = [];
  for (let index = 0; index < record.value.rows.length; index += 1) {
    const row = verifyAnalyticalRow(record.value.rows[index]);
    if (!row.ok) return contractFailure(row.error.code, `$.rows[${index}]${row.error.path.slice(1)}`);
    rows.push(row.value);
  }
  if (!Array.isArray(record.value.excludedCandidates) || record.value.excludedCandidates.length > GA0_B1_CONTRACT_LIMITS.maximumRows) {
    return contractFailure("ti_v3_analytics_contract_oversized", "$.excludedCandidates");
  }
  const exclusions: ExcludedAnalyticalCandidate[] = [];
  for (let index = 0; index < record.value.excludedCandidates.length; index += 1) {
    const exclusion = parseExclusion(record.value.excludedCandidates[index], `$.excludedCandidates[${index}]`);
    if (!exclusion.ok) return exclusion;
    exclusions.push(exclusion.value);
  }
  const limitations = validateReasonCodes(record.value.limitations, "$.limitations");
  if (!limitations.ok) return limitations;
  const rowKeys = rows.map((row) => row.semanticRoundTripKey);
  const exclusionKeys = exclusions.map((entry) => entry.candidateKey);
  if (
    new Set(rowKeys).size !== rowKeys.length ||
    new Set(exclusionKeys).size !== exclusionKeys.length ||
    rows.some((row) => exclusions.some((entry) => entry.semanticRoundTripKey === row.semanticRoundTripKey))
  ) {
    return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.rows");
  }
  const sortedRows = Object.freeze([...rows].sort(compareRows));
  const sortedExclusions = Object.freeze([...exclusions].sort((left, right) => compareUnicodeCodePoints(left.candidateKey, right.candidateKey)));
  const currencyPartitions = Object.freeze(
    [...new Set(sortedRows.map((row) => row.currency))].sort(compareUnicodeCodePoints),
  );
  const includedCount = countFromLength(sortedRows.length, "$.rows.length");
  if (!includedCount.ok) return includedCount;
  const excludedCount = countFromLength(sortedExclusions.length, "$.excludedCandidates.length");
  if (!excludedCount.ok) return excludedCount;
  const candidateCount = countFromLength(sortedRows.length + sortedExclusions.length, "$.candidateCount");
  if (!candidateCount.ok || !countsReconcile(candidateCount.value, includedCount.value, excludedCount.value)) {
    return contractFailure("ti_v3_analytics_contract_count_mismatch", "$.candidateCount");
  }
  const reasonCounts = new Map<string, bigint>();
  for (const exclusion of sortedExclusions) {
    reasonCounts.set(exclusion.reasonCode, (reasonCounts.get(exclusion.reasonCode) ?? BigInt(0)) + BigInt(1));
  }
  const exclusionCountsByReason = Object.freeze(
    [...reasonCounts.entries()]
      .sort(([left], [right]) => compareUnicodeCodePoints(left, right))
      .map(([reasonCode, count]) => Object.freeze({ reasonCode, count: count.toString() })),
  );
  const reasonTotal = exclusionCountsByReason.reduce((sum, entry) => sum + BigInt(entry.count), BigInt(0));
  if (reasonTotal !== BigInt(excludedCount.value)) {
    return contractFailure("ti_v3_analytics_contract_count_mismatch", "$.exclusionCountsByReason");
  }
  const content = {
    schemaVersion: ANALYTICAL_DATASET_VERSION,
    snapshotDigest: snapshot.value,
    manifestDigest: manifest.value,
    filterDigest: filter.value,
    analysisCutoffAt: analysisCutoff.value,
    correctionCutoffAt: correctionCutoff.value,
    correctionResultDigest: correction.value,
    eligibilitySetDigest: eligibility.value,
    retrospectivePolicyDigest: policy.value,
    evidenceNamespace: evidenceNamespace.value,
    occurrenceInventoryDigest: occurrence.value,
    roundTripInventoryDigest: roundTrips.value,
    adapterKey: adapterKey.value,
    adapterVersion: adapterVersion.value,
    derivationPolicyKey: derivationPolicyKey.value,
    derivationPolicyVersion: derivationPolicyVersion.value,
    currencyPartitions,
    rows: sortedRows,
    excludedCandidates: sortedExclusions,
    candidateCount: candidateCount.value,
    includedCount: includedCount.value,
    excludedCount: excludedCount.value,
    exclusionCountsByReason,
    limitations: limitations.value,
  };
  return finalizeContentAddressedAuthority("analytical_dataset", content, "receiptDigest") as ExactResult<AnalyticalDatasetReceipt, AnalyticalContractFailure>;
}

export function verifyAnalyticalDatasetReceipt(
  input: unknown,
): ExactResult<AnalyticalDatasetReceipt, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "snapshotDigest", "manifestDigest", "filterDigest",
    "analysisCutoffAt", "correctionCutoffAt", "correctionResultDigest",
    "eligibilitySetDigest", "retrospectivePolicyDigest", "evidenceNamespace",
    "occurrenceInventoryDigest", "roundTripInventoryDigest", "adapterKey",
    "adapterVersion", "derivationPolicyKey", "derivationPolicyVersion",
    "currencyPartitions", "rows", "excludedCandidates", "candidateCount",
    "includedCount", "excludedCount", "exclusionCountsByReason", "limitations",
    "receiptDigest",
  ]);
  if (!record.ok) return record;
  const digest = validateClaimedDigest(record.value.receiptDigest, "$.receiptDigest", "analytical_dataset");
  if (!digest.ok) return digest;
  const suppliedCandidateCount = validateCanonicalCount(record.value.candidateCount, "$.candidateCount");
  const suppliedIncludedCount = validateCanonicalCount(record.value.includedCount, "$.includedCount");
  const suppliedExcludedCount = validateCanonicalCount(record.value.excludedCount, "$.excludedCount");
  if (!suppliedCandidateCount.ok) return suppliedCandidateCount;
  if (!suppliedIncludedCount.ok) return suppliedIncludedCount;
  if (!suppliedExcludedCount.ok) return suppliedExcludedCount;
  const { receiptDigest: _receiptDigest, currencyPartitions: _currencyPartitions,
    candidateCount: _candidateCount, includedCount: _includedCount,
    excludedCount: _excludedCount, exclusionCountsByReason: _reasonCounts,
    ...buildInput } = record.value;
  void _receiptDigest; void _currencyPartitions; void _candidateCount;
  void _includedCount; void _excludedCount; void _reasonCounts;
  const rebuilt = buildAnalyticalDatasetReceipt(buildInput);
  if (
    !rebuilt.ok ||
    rebuilt.value.receiptDigest !== digest.value ||
    rebuilt.value.candidateCount !== suppliedCandidateCount.value ||
    rebuilt.value.includedCount !== suppliedIncludedCount.value ||
    rebuilt.value.excludedCount !== suppliedExcludedCount.value
  ) {
    return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.receiptDigest");
  }
  return rebuilt;
}
