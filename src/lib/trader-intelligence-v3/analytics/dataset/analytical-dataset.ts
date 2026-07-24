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
  manifestExcluded: "ti_v3_analytics_manifest_excluded",
} as const);

export const ANALYTICAL_CLAIM_NEUTRAL_EXCLUSION_POLICY = Object.freeze({
  policyKey: "ti_v3_claim_neutral_exclusion_ledger",
  policyVersion: "v1",
  neutralPrimaryReasons: Object.freeze([
    ANALYTICAL_EXCLUSION_REASONS.filterExcluded,
    ANALYTICAL_EXCLUSION_REASONS.openLifecycle,
  ]),
  acceptedOpenLifecycleSourceReasons: Object.freeze([
    "ti_v3_eligibility_open_positions_excluded",
    "ti_v3_open_inventory_remaining",
  ]),
  requiredManifestMappingPolicyKey: "ti_v3_manifest_exclusion_reason_mapping",
  requiredManifestMappingPolicyVersion: "v1",
} as const);

export interface ExcludedAnalyticalCandidate {
  readonly candidateKey: string;
  readonly semanticRoundTripKey: string | null;
  readonly scopeState: "ledger_scoped" | "global_unassigned";
  readonly canonicalOwnerKey: string | null;
  readonly canonicalAccountKey: string | null;
  readonly stableInstrumentKey: string | null;
  readonly reasonCode: string;
  readonly sourceReasonCode: string | null;
  readonly secondaryReasonCodes: readonly string[];
  readonly sourceReasonCodes: readonly string[];
  readonly reasonLedgerPolicyKey: "ti_v3_analytical_exclusion_reason_ledger";
  readonly reasonLedgerPolicyVersion: "v1";
  readonly reasonAuthorities: readonly Readonly<{
    readonly reasonCode: string;
    readonly authority: string;
    readonly sourceReasonCode: string | null;
    readonly mappingPolicyKey: string | null;
    readonly mappingPolicyVersion: string | null;
  }>[];
  readonly reasonMappingPolicyKey: "ti_v3_manifest_exclusion_reason_mapping";
  readonly reasonMappingPolicyVersion: "v1";
  readonly limitationCodes: readonly string[];
  readonly relatedExecutionDigests: readonly CanonicalExecutionDigest[];
  readonly relatedOccurrenceKeys: readonly string[];
  readonly currency: CurrencyCode | null;
}

export interface AnalyticalExclusionCount {
  readonly reasonCode: string;
  readonly count: string;
}

export function isClaimNeutralAnalyticalExclusion(
  candidate: Pick<
    ExcludedAnalyticalCandidate,
    | "reasonCode"
    | "secondaryReasonCodes"
    | "sourceReasonCode"
    | "sourceReasonCodes"
    | "reasonAuthorities"
    | "limitationCodes"
  >,
): boolean {
  if (
    candidate.limitationCodes.length > 0 ||
    candidate.secondaryReasonCodes.length > 0 ||
    candidate.reasonCode === ANALYTICAL_EXCLUSION_REASONS.mixedCurrency
  ) return false;
  if (candidate.reasonCode === ANALYTICAL_EXCLUSION_REASONS.filterExcluded) {
    return (
      candidate.sourceReasonCode === null &&
      candidate.sourceReasonCodes.length === 0 &&
      candidate.reasonAuthorities.length === 1 &&
      candidate.reasonAuthorities[0].reasonCode === candidate.reasonCode &&
      candidate.reasonAuthorities[0].authority === "canonical_filter" &&
      candidate.reasonAuthorities[0].sourceReasonCode === null &&
      candidate.reasonAuthorities[0].mappingPolicyKey === null &&
      candidate.reasonAuthorities[0].mappingPolicyVersion === null
    );
  }
  if (candidate.reasonCode !== ANALYTICAL_EXCLUSION_REASONS.openLifecycle) {
    return false;
  }
  if (
    candidate.sourceReasonCodes.length > 1 ||
    (candidate.sourceReasonCodes.length === 1 &&
      !ANALYTICAL_CLAIM_NEUTRAL_EXCLUSION_POLICY.acceptedOpenLifecycleSourceReasons.includes(
        candidate.sourceReasonCodes[0] as typeof ANALYTICAL_CLAIM_NEUTRAL_EXCLUSION_POLICY.acceptedOpenLifecycleSourceReasons[number],
      )) ||
    candidate.sourceReasonCode !== (candidate.sourceReasonCodes[0] ?? null)
  ) return false;
  return candidate.reasonAuthorities.length > 0 && candidate.reasonAuthorities.every(
    (authority) =>
      authority.reasonCode === candidate.reasonCode &&
      authority.authority === "lifecycle" &&
      authority.sourceReasonCode === candidate.sourceReasonCode &&
      (candidate.sourceReasonCode === null
        ? authority.mappingPolicyKey === null &&
          authority.mappingPolicyVersion === null
        : authority.mappingPolicyKey ===
            ANALYTICAL_CLAIM_NEUTRAL_EXCLUSION_POLICY.requiredManifestMappingPolicyKey &&
          authority.mappingPolicyVersion ===
            ANALYTICAL_CLAIM_NEUTRAL_EXCLUSION_POLICY.requiredManifestMappingPolicyVersion),
  );
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
  readonly globalExclusionPolicyKey: "ti_v3_global_exclusion_blocks_currency_partition";
  readonly globalExclusionPolicyVersion: "v1";
  readonly globalExcludedCandidateKeys: readonly string[];
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
    "candidateKey", "semanticRoundTripKey", "scopeState", "canonicalOwnerKey",
    "canonicalAccountKey", "stableInstrumentKey", "reasonCode", "sourceReasonCode",
    "secondaryReasonCodes", "sourceReasonCodes", "reasonLedgerPolicyKey",
    "reasonLedgerPolicyVersion", "reasonAuthorities",
    "reasonMappingPolicyKey", "reasonMappingPolicyVersion", "limitationCodes",
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
  const parseNullableScopeKey = (
    field: "canonicalOwnerKey" | "canonicalAccountKey" | "stableInstrumentKey",
  ): ExactResult<string | null, AnalyticalContractFailure> => {
    if (record.value[field] === null) return { ok: true, value: null };
    return validateContractKey(record.value[field], `${path}.${field}`);
  };
  const owner = parseNullableScopeKey("canonicalOwnerKey");
  const account = parseNullableScopeKey("canonicalAccountKey");
  const instrument = parseNullableScopeKey("stableInstrumentKey");
  if (!owner.ok) return owner;
  if (!account.ok) return account;
  if (!instrument.ok) return instrument;
  const reason = validateReasonCode(record.value.reasonCode, `${path}.reasonCode`);
  if (!reason.ok) return reason;
  let sourceReasonCode: string | null = null;
  if (record.value.sourceReasonCode !== null) {
    const sourceReason = validateReasonCode(record.value.sourceReasonCode, `${path}.sourceReasonCode`);
    if (!sourceReason.ok) return sourceReason;
    sourceReasonCode = sourceReason.value;
  }
  const secondaryReasons = validateReasonCodes(
    record.value.secondaryReasonCodes,
    `${path}.secondaryReasonCodes`,
  );
  const sourceReasons = validateReasonCodes(
    record.value.sourceReasonCodes,
    `${path}.sourceReasonCodes`,
  );
  if (!secondaryReasons.ok) return secondaryReasons;
  if (!sourceReasons.ok) return sourceReasons;
  if (
    record.value.reasonLedgerPolicyKey !== "ti_v3_analytical_exclusion_reason_ledger" ||
    record.value.reasonLedgerPolicyVersion !== "v1" ||
    !Array.isArray(record.value.reasonAuthorities)
  ) return contractFailure("ti_v3_analytics_contract_invalid", `${path}.reasonLedgerPolicyKey`);
  const reasonAuthorities: Array<ExcludedAnalyticalCandidate["reasonAuthorities"][number]> = [];
  for (let index = 0; index < record.value.reasonAuthorities.length; index += 1) {
    const authorityPath = `${path}.reasonAuthorities[${index}]`;
    const authority = validateContractRecord(
      record.value.reasonAuthorities[index],
      ["reasonCode", "authority", "sourceReasonCode", "mappingPolicyKey", "mappingPolicyVersion"],
      [],
      authorityPath,
    );
    if (!authority.ok) return authority;
    const authorityReason = validateReasonCode(authority.value.reasonCode, `${authorityPath}.reasonCode`);
    const authorityKey = validateContractKey(authority.value.authority, `${authorityPath}.authority`);
    if (!authorityReason.ok) return authorityReason;
    if (!authorityKey.ok) return authorityKey;
    let authoritySourceReason: string | null = null;
    if (authority.value.sourceReasonCode !== null) {
      const parsed = validateReasonCode(
        authority.value.sourceReasonCode,
        `${authorityPath}.sourceReasonCode`,
      );
      if (!parsed.ok) return parsed;
      authoritySourceReason = parsed.value;
    }
    let mappingPolicyKey: string | null = null;
    let mappingPolicyVersion: string | null = null;
    if (
      (authority.value.mappingPolicyKey === null) !==
      (authority.value.mappingPolicyVersion === null)
    ) return contractFailure("ti_v3_analytics_contract_invalid", `${authorityPath}.mappingPolicyKey`);
    if (authority.value.mappingPolicyKey !== null) {
      const key = validateContractKey(
        authority.value.mappingPolicyKey,
        `${authorityPath}.mappingPolicyKey`,
      );
      const version = validateContractKey(
        authority.value.mappingPolicyVersion,
        `${authorityPath}.mappingPolicyVersion`,
      );
      if (!key.ok) return key;
      if (!version.ok) return version;
      mappingPolicyKey = key.value;
      mappingPolicyVersion = version.value;
    }
    reasonAuthorities.push(Object.freeze({
      reasonCode: authorityReason.value,
      authority: authorityKey.value,
      sourceReasonCode: authoritySourceReason,
      mappingPolicyKey,
      mappingPolicyVersion,
    }));
  }
  if (
    sourceReasonCode !== (sourceReasons.value[0] ?? null) ||
    secondaryReasons.value.includes(reason.value) ||
    reasonAuthorities.some((authority) =>
      authority.reasonCode !== reason.value &&
      !secondaryReasons.value.includes(authority.reasonCode)) ||
    reasonAuthorities.some((authority) =>
      authority.sourceReasonCode !== null &&
      !sourceReasons.value.includes(authority.sourceReasonCode))
  ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", `${path}.reasonAuthorities`);
  if (record.value.reasonMappingPolicyKey !== "ti_v3_manifest_exclusion_reason_mapping" || record.value.reasonMappingPolicyVersion !== "v1") return contractFailure("ti_v3_analytics_contract_invalid", `${path}.reasonMappingPolicyKey`);
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
  if (
    (
      record.value.scopeState !== "ledger_scoped" &&
      record.value.scopeState !== "global_unassigned"
    ) ||
    (
      record.value.scopeState === "ledger_scoped" &&
      (
        owner.value === null ||
        account.value === null ||
        instrument.value === null ||
        currency === null
      )
    ) ||
    (
      record.value.scopeState === "global_unassigned" &&
      (
        owner.value !== null ||
        account.value !== null ||
        instrument.value !== null ||
        currency !== null
      )
    )
  ) {
    return contractFailure("ti_v3_analytics_contract_invalid", `${path}.scopeState`);
  }
  return {
    ok: true,
    value: Object.freeze({
      candidateKey: candidateKey.value,
      semanticRoundTripKey,
      scopeState: record.value.scopeState,
      canonicalOwnerKey: owner.value,
      canonicalAccountKey: account.value,
      stableInstrumentKey: instrument.value,
      reasonCode: reason.value,
      sourceReasonCode,
      secondaryReasonCodes: secondaryReasons.value,
      sourceReasonCodes: sourceReasons.value,
      reasonLedgerPolicyKey: "ti_v3_analytical_exclusion_reason_ledger",
      reasonLedgerPolicyVersion: "v1",
      reasonAuthorities: Object.freeze(reasonAuthorities),
      reasonMappingPolicyKey: "ti_v3_manifest_exclusion_reason_mapping",
      reasonMappingPolicyVersion: "v1",
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
    [...new Set([
      ...sortedRows.map((row) => row.currency),
      ...sortedExclusions.flatMap((candidate) =>
        candidate.scopeState === "ledger_scoped" &&
        candidate.currency !== null
          ? [candidate.currency]
          : []),
    ])].sort(compareUnicodeCodePoints),
  );
  const globalExcludedCandidateKeys = Object.freeze(
    sortedExclusions
      .filter((candidate) => candidate.scopeState === "global_unassigned")
      .map((candidate) => candidate.candidateKey)
      .sort(compareUnicodeCodePoints),
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
    globalExclusionPolicyKey:
      "ti_v3_global_exclusion_blocks_currency_partition" as const,
    globalExclusionPolicyVersion: "v1" as const,
    globalExcludedCandidateKeys,
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
    "globalExclusionPolicyKey", "globalExclusionPolicyVersion",
    "globalExcludedCandidateKeys", "currencyPartitions", "rows",
    "excludedCandidates", "candidateCount",
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
  if (
    record.value.globalExclusionPolicyKey !==
      "ti_v3_global_exclusion_blocks_currency_partition" ||
    record.value.globalExclusionPolicyVersion !== "v1"
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.globalExclusionPolicyKey",
    );
  }
  const suppliedGlobalKeys = validateKeyArray(
    record.value.globalExcludedCandidateKeys,
    "$.globalExcludedCandidateKeys",
  );
  if (!suppliedGlobalKeys.ok) return suppliedGlobalKeys;
  if (!Array.isArray(record.value.currencyPartitions)) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.currencyPartitions",
    );
  }
  const suppliedCurrencies: CurrencyCode[] = [];
  for (let index = 0; index < record.value.currencyPartitions.length; index += 1) {
    const currency = parseCurrencyCode(record.value.currencyPartitions[index]);
    if (!currency.ok) {
      return contractFailure(
        "ti_v3_analytics_contract_invalid",
        `$.currencyPartitions[${index}]`,
      );
    }
    suppliedCurrencies.push(currency.value);
  }
  if (!Array.isArray(record.value.exclusionCountsByReason)) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.exclusionCountsByReason",
    );
  }
  const suppliedReasonCounts: AnalyticalExclusionCount[] = [];
  for (let index = 0; index < record.value.exclusionCountsByReason.length; index += 1) {
    const path = `$.exclusionCountsByReason[${index}]`;
    const entry = validateContractRecord(
      record.value.exclusionCountsByReason[index],
      ["reasonCode", "count"],
      [],
      path,
    );
    if (!entry.ok) return entry;
    const reasonCode = validateReasonCode(entry.value.reasonCode, `${path}.reasonCode`);
    const count = validateCanonicalCount(entry.value.count, `${path}.count`);
    if (!reasonCode.ok) return reasonCode;
    if (!count.ok) return count;
    suppliedReasonCounts.push(Object.freeze({
      reasonCode: reasonCode.value,
      count: count.value,
    }));
  }
  const { receiptDigest: _receiptDigest,
    globalExclusionPolicyKey: _globalExclusionPolicyKey,
    globalExclusionPolicyVersion: _globalExclusionPolicyVersion,
    globalExcludedCandidateKeys: _globalExcludedCandidateKeys,
    currencyPartitions: _currencyPartitions,
    candidateCount: _candidateCount, includedCount: _includedCount,
    excludedCount: _excludedCount, exclusionCountsByReason: _reasonCounts,
    ...buildInput } = record.value;
  void _receiptDigest; void _currencyPartitions; void _candidateCount;
  void _includedCount; void _excludedCount; void _reasonCounts;
  void _globalExclusionPolicyKey; void _globalExclusionPolicyVersion;
  void _globalExcludedCandidateKeys;
  const rebuilt = buildAnalyticalDatasetReceipt(buildInput);
  const sameStrings = (
    left: readonly string[],
    right: readonly string[],
  ): boolean => left.length === right.length &&
    left.every((value, index) => value === right[index]);
  if (
    !rebuilt.ok ||
    rebuilt.value.receiptDigest !== digest.value ||
    rebuilt.value.candidateCount !== suppliedCandidateCount.value ||
    rebuilt.value.includedCount !== suppliedIncludedCount.value ||
    rebuilt.value.excludedCount !== suppliedExcludedCount.value ||
    !sameStrings(
      rebuilt.value.globalExcludedCandidateKeys,
      suppliedGlobalKeys.value,
    ) ||
    !sameStrings(rebuilt.value.currencyPartitions, suppliedCurrencies) ||
    rebuilt.value.exclusionCountsByReason.length !== suppliedReasonCounts.length ||
    rebuilt.value.exclusionCountsByReason.some((entry, index) =>
      entry.reasonCode !== suppliedReasonCounts[index]?.reasonCode ||
      entry.count !== suppliedReasonCounts[index]?.count)
  ) {
    return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.receiptDigest");
  }
  return rebuilt;
}
