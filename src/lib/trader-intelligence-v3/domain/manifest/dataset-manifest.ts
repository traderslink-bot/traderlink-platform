import type { CanonicalUtcTimestamp } from "../canonical";
import type { ExactResult } from "../exact";
import {
  canonicalReasonCodes,
  canonicalStringSet,
  validateCanonicalDigest,
  validateCanonicalTimestamp,
  validateEnum,
  validateExactRecord,
  validateStringSet,
  type FoundationValidationFailure,
} from "../foundation";
import {
  createCanonicalContentIdentity,
  type CanonicalContentDigest,
  type CanonicalExecutionDigest,
  type CanonicalSourceDocumentDigest,
} from "../identity";

export const DATASET_MANIFEST_VERSION = "ti_v3_dataset_manifest_v1" as const;

export type SourceDeletionState = "present" | "deleted";
export type CoverageState =
  | "complete_account_period"
  | "partial_account_period"
  | "overlapping_periods_reconciled"
  | "coverage_gap_detected"
  | "unknown_coverage"
  | "multiple_accounts_partial"
  | "deleted_source_present"
  | "prior_inventory_incomplete"
  | "unresolved_correction_present";
export type ReconstructionStatus = "exact" | "limited" | "blocked" | "not_attempted";

export interface ManifestTimeRange {
  readonly startAt: CanonicalUtcTimestamp;
  readonly endAt: CanonicalUtcTimestamp;
  readonly startInclusive: boolean;
  readonly endInclusive: boolean;
}

export interface ManifestSourceDocument {
  readonly sourceDocumentDigest: CanonicalSourceDocumentDigest;
  readonly sourceKind: "broker_csv" | "broker_api" | "owner_manual" | "legacy_migration";
  readonly statementPeriods: readonly ManifestTimeRange[];
  readonly deletionState: SourceDeletionState;
}

export interface ManifestPolicyReference {
  readonly policyKey: string;
  readonly policyVersion: string;
  readonly policyDigest: CanonicalContentDigest;
}

export interface ManifestCoverageGap {
  readonly scopeKey: string;
  readonly range: ManifestTimeRange;
  readonly reasonCode: string;
}

export interface ManifestCoverageOverlap {
  readonly sourceDocumentDigests: readonly CanonicalSourceDocumentDigest[];
  readonly range: ManifestTimeRange;
  readonly resolutionState: "reconciled" | "unresolved";
}

export interface ManifestExclusion {
  readonly evidenceDigest: CanonicalContentDigest;
  readonly reasonCode: string;
}

export interface ManifestPriorInventory {
  readonly ledgerKey: string;
  readonly state: "proven_flat" | "accepted_prior_lots" | "unknown";
  readonly contractDigest: CanonicalContentDigest | null;
}

export interface ManifestOpenPosition {
  readonly ledgerKey: string;
  readonly executionDigests: readonly CanonicalExecutionDigest[];
}

export interface DatasetManifestContent {
  readonly schemaVersion: typeof DATASET_MANIFEST_VERSION;
  readonly canonicalOwnerKey: string;
  readonly canonicalAccountKeys: readonly string[];
  readonly sourceDocuments: readonly ManifestSourceDocument[];
  readonly acceptedExecutionDigests: readonly CanonicalExecutionDigest[];
  readonly correctionDigests: readonly CanonicalContentDigest[];
  readonly correctionCutoffAt: CanonicalUtcTimestamp;
  readonly policies: readonly ManifestPolicyReference[];
  readonly statementPeriods: readonly ManifestTimeRange[];
  readonly knownGaps: readonly ManifestCoverageGap[];
  readonly overlappingPeriods: readonly ManifestCoverageOverlap[];
  readonly exclusions: readonly ManifestExclusion[];
  readonly priorInventory: readonly ManifestPriorInventory[];
  readonly openPositions: readonly ManifestOpenPosition[];
  readonly currencies: readonly string[];
  readonly coverageStates: readonly CoverageState[];
  readonly reconstructionStatus: ReconstructionStatus;
  readonly reconstructionReasonCodes: readonly string[];
}

export interface DatasetManifest {
  readonly content: DatasetManifestContent;
  readonly manifestDigest: CanonicalContentDigest;
}

export type DatasetManifestFailure = FoundationValidationFailure | {
  readonly code:
    | "ti_v3_manifest_temporal_range_invalid"
    | "ti_v3_manifest_identity_invalid"
    | "ti_v3_manifest_inconsistent"
    | "ti_v3_manifest_unverified";
  readonly path: string;
};

const SOURCE_KINDS = new Set<ManifestSourceDocument["sourceKind"]>([
  "broker_csv",
  "broker_api",
  "owner_manual",
  "legacy_migration",
]);
const DELETION_STATES = new Set<SourceDeletionState>(["present", "deleted"]);
const COVERAGE_STATES = new Set<CoverageState>([
  "complete_account_period",
  "partial_account_period",
  "overlapping_periods_reconciled",
  "coverage_gap_detected",
  "unknown_coverage",
  "multiple_accounts_partial",
  "deleted_source_present",
  "prior_inventory_incomplete",
  "unresolved_correction_present",
]);
const RECONSTRUCTION_STATES = new Set<ReconstructionStatus>([
  "exact",
  "limited",
  "blocked",
  "not_attempted",
]);
const PRIOR_STATES = new Set<ManifestPriorInventory["state"]>([
  "proven_flat",
  "accepted_prior_lots",
  "unknown",
]);
const OVERLAP_STATES = new Set<ManifestCoverageOverlap["resolutionState"]>([
  "reconciled",
  "unresolved",
]);
const verifiedManifests = new WeakSet<DatasetManifest>();

function failure(code: DatasetManifestFailure["code"], path: string): ExactResult<never, DatasetManifestFailure> {
  return { ok: false, error: { code, path } };
}

function parseRange(input: unknown, path: string): ExactResult<ManifestTimeRange, DatasetManifestFailure> {
  const record = validateExactRecord(
    input,
    ["startAt", "endAt", "startInclusive", "endInclusive"],
    [],
    path,
  );
  if (!record.ok) return record;
  const start = validateCanonicalTimestamp(record.value.startAt, `${path}.startAt`);
  if (!start.ok) return start;
  const end = validateCanonicalTimestamp(record.value.endAt, `${path}.endAt`);
  if (!end.ok) return end;
  if (start.value >= end.value) return failure("ti_v3_manifest_temporal_range_invalid", path);
  if (typeof record.value.startInclusive !== "boolean") return failure("ti_v3_validation_boolean_invalid", `${path}.startInclusive`);
  if (typeof record.value.endInclusive !== "boolean") return failure("ti_v3_validation_boolean_invalid", `${path}.endInclusive`);
  return {
    ok: true,
    value: Object.freeze({
      startAt: start.value,
      endAt: end.value,
      startInclusive: record.value.startInclusive,
      endInclusive: record.value.endInclusive,
    }),
  };
}

function parseArrayItems<T>(
  input: unknown,
  path: string,
  parser: (value: unknown, path: string) => ExactResult<T, DatasetManifestFailure>,
): ExactResult<readonly T[], DatasetManifestFailure> {
  if (!Array.isArray(input)) return failure("ti_v3_validation_array_invalid", path);
  if (input.length > 10_000) return failure("ti_v3_validation_payload_oversized", path);
  const values: T[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const parsed = parser(input[index], `${path}[${index}]`);
    if (!parsed.ok) return parsed;
    values.push(parsed.value);
  }
  return { ok: true, value: values };
}

function parseSource(input: unknown, path: string): ExactResult<ManifestSourceDocument, DatasetManifestFailure> {
  const record = validateExactRecord(input, ["sourceDocumentDigest", "sourceKind", "statementPeriods", "deletionState"], [], path);
  if (!record.ok) return record;
  const digest = validateCanonicalDigest(record.value.sourceDocumentDigest, `${path}.sourceDocumentDigest`, "canonical_source_document");
  if (!digest.ok) return digest;
  const sourceKind = validateEnum(record.value.sourceKind, SOURCE_KINDS, `${path}.sourceKind`);
  if (!sourceKind.ok) return sourceKind;
  const periods = parseArrayItems(record.value.statementPeriods, `${path}.statementPeriods`, parseRange);
  if (!periods.ok) return periods;
  const deletion = validateEnum(record.value.deletionState, DELETION_STATES, `${path}.deletionState`);
  if (!deletion.ok) return deletion;
  return {
    ok: true,
    value: {
      sourceDocumentDigest: digest.value as CanonicalSourceDocumentDigest,
      sourceKind: sourceKind.value,
      statementPeriods: periods.value,
      deletionState: deletion.value,
    },
  };
}

function parsePolicy(input: unknown, path: string): ExactResult<ManifestPolicyReference, DatasetManifestFailure> {
  const record = validateExactRecord(input, ["policyKey", "policyVersion", "policyDigest"], [], path);
  if (!record.ok) return record;
  if (typeof record.value.policyKey !== "string" || !/^ti_v3_[a-z0-9_]{1,120}$/.test(record.value.policyKey)) return failure("ti_v3_validation_string_invalid", `${path}.policyKey`);
  if (typeof record.value.policyVersion !== "string" || !/^v[1-9][0-9]*$/.test(record.value.policyVersion)) return failure("ti_v3_validation_string_invalid", `${path}.policyVersion`);
  const digest = validateCanonicalDigest(record.value.policyDigest, `${path}.policyDigest`);
  if (!digest.ok) return digest;
  return { ok: true, value: { policyKey: record.value.policyKey, policyVersion: record.value.policyVersion, policyDigest: digest.value } };
}

function parseGap(input: unknown, path: string): ExactResult<ManifestCoverageGap, DatasetManifestFailure> {
  const record = validateExactRecord(input, ["scopeKey", "range", "reasonCode"], [], path);
  if (!record.ok) return record;
  if (typeof record.value.scopeKey !== "string" || !/^[a-z0-9][a-z0-9:_-]{0,191}$/.test(record.value.scopeKey)) return failure("ti_v3_validation_string_invalid", `${path}.scopeKey`);
  if (typeof record.value.reasonCode !== "string" || !/^ti_v3_[a-z0-9_]{1,120}$/.test(record.value.reasonCode)) return failure("ti_v3_validation_string_invalid", `${path}.reasonCode`);
  const range = parseRange(record.value.range, `${path}.range`);
  if (!range.ok) return range;
  return { ok: true, value: { scopeKey: record.value.scopeKey, range: range.value, reasonCode: record.value.reasonCode } };
}

function parseOverlap(input: unknown, path: string): ExactResult<ManifestCoverageOverlap, DatasetManifestFailure> {
  const record = validateExactRecord(input, ["sourceDocumentDigests", "range", "resolutionState"], [], path);
  if (!record.ok) return record;
  const digests = parseArrayItems(record.value.sourceDocumentDigests, `${path}.sourceDocumentDigests`, (value, itemPath) => {
    const parsed = validateCanonicalDigest(value, itemPath, "canonical_source_document");
    return parsed.ok ? { ok: true, value: parsed.value as CanonicalSourceDocumentDigest } : parsed;
  });
  if (!digests.ok) return digests;
  if (digests.value.length < 2) return failure("ti_v3_manifest_inconsistent", `${path}.sourceDocumentDigests`);
  const range = parseRange(record.value.range, `${path}.range`);
  if (!range.ok) return range;
  const state = validateEnum(record.value.resolutionState, OVERLAP_STATES, `${path}.resolutionState`);
  if (!state.ok) return state;
  return { ok: true, value: { sourceDocumentDigests: canonicalStringSet(digests.value) as readonly CanonicalSourceDocumentDigest[], range: range.value, resolutionState: state.value } };
}

function parseExclusion(input: unknown, path: string): ExactResult<ManifestExclusion, DatasetManifestFailure> {
  const record = validateExactRecord(input, ["evidenceDigest", "reasonCode"], [], path);
  if (!record.ok) return record;
  const digest = validateCanonicalDigest(record.value.evidenceDigest, `${path}.evidenceDigest`);
  if (!digest.ok) return digest;
  if (typeof record.value.reasonCode !== "string" || !/^ti_v3_[a-z0-9_]{1,120}$/.test(record.value.reasonCode)) return failure("ti_v3_validation_string_invalid", `${path}.reasonCode`);
  return { ok: true, value: { evidenceDigest: digest.value, reasonCode: record.value.reasonCode } };
}

function parsePrior(input: unknown, path: string): ExactResult<ManifestPriorInventory, DatasetManifestFailure> {
  const record = validateExactRecord(input, ["ledgerKey", "state", "contractDigest"], [], path);
  if (!record.ok) return record;
  if (typeof record.value.ledgerKey !== "string" || !/^[a-z0-9][a-z0-9:_-]{0,255}$/.test(record.value.ledgerKey)) return failure("ti_v3_validation_string_invalid", `${path}.ledgerKey`);
  const state = validateEnum(record.value.state, PRIOR_STATES, `${path}.state`);
  if (!state.ok) return state;
  let digest: CanonicalContentDigest | null = null;
  if (record.value.contractDigest !== null) {
    const parsed = validateCanonicalDigest(record.value.contractDigest, `${path}.contractDigest`);
    if (!parsed.ok) return parsed;
    digest = parsed.value;
  }
  if ((state.value === "accepted_prior_lots") !== (digest !== null)) return failure("ti_v3_manifest_inconsistent", `${path}.contractDigest`);
  return { ok: true, value: { ledgerKey: record.value.ledgerKey, state: state.value, contractDigest: digest } };
}

function parseOpenPosition(input: unknown, path: string): ExactResult<ManifestOpenPosition, DatasetManifestFailure> {
  const record = validateExactRecord(input, ["ledgerKey", "executionDigests"], [], path);
  if (!record.ok) return record;
  if (typeof record.value.ledgerKey !== "string" || !/^[a-z0-9][a-z0-9:_-]{0,255}$/.test(record.value.ledgerKey)) return failure("ti_v3_validation_string_invalid", `${path}.ledgerKey`);
  const digests = parseArrayItems(record.value.executionDigests, `${path}.executionDigests`, (value, itemPath) => {
    const parsed = validateCanonicalDigest(value, itemPath, "canonical_execution");
    return parsed.ok ? { ok: true, value: parsed.value as CanonicalExecutionDigest } : parsed;
  });
  if (!digests.ok) return digests;
  if (digests.value.length === 0) return failure("ti_v3_manifest_inconsistent", `${path}.executionDigests`);
  return { ok: true, value: { ledgerKey: record.value.ledgerKey, executionDigests: canonicalStringSet(digests.value) as readonly CanonicalExecutionDigest[] } };
}

function canonicalOrder<T>(values: readonly T[], key: (value: T) => string): readonly T[] {
  return Object.freeze([...values].sort((left, right) => key(left) < key(right) ? -1 : key(left) > key(right) ? 1 : 0));
}

export function buildDatasetManifest(input: unknown): ExactResult<DatasetManifest, DatasetManifestFailure> {
  const record = validateExactRecord(
    input,
    [
      "canonicalOwnerKey",
      "canonicalAccountKeys",
      "sourceDocuments",
      "acceptedExecutionDigests",
      "correctionDigests",
      "correctionCutoffAt",
      "policies",
      "statementPeriods",
      "knownGaps",
      "overlappingPeriods",
      "exclusions",
      "priorInventory",
      "openPositions",
      "currencies",
      "coverageStates",
      "reconstructionStatus",
      "reconstructionReasonCodes",
    ],
    ["schemaVersion"],
  );
  if (!record.ok) return record;
  if (record.value.schemaVersion !== undefined && record.value.schemaVersion !== DATASET_MANIFEST_VERSION) return failure("ti_v3_manifest_unverified", "$.schemaVersion");
  if (typeof record.value.canonicalOwnerKey !== "string" || !/^owner_[a-z0-9][a-z0-9_-]{0,89}$/.test(record.value.canonicalOwnerKey)) return failure("ti_v3_manifest_identity_invalid", "$.canonicalOwnerKey");
  const accounts = validateStringSet(record.value.canonicalAccountKeys, "$.canonicalAccountKeys", { pattern: /^account_[a-z0-9][a-z0-9_-]{0,87}$/ });
  if (!accounts.ok) return accounts;
  if (accounts.value.length === 0) return failure("ti_v3_manifest_identity_invalid", "$.canonicalAccountKeys");
  const sources = parseArrayItems(record.value.sourceDocuments, "$.sourceDocuments", parseSource);
  if (!sources.ok) return sources;
  const executions = parseArrayItems(record.value.acceptedExecutionDigests, "$.acceptedExecutionDigests", (value, path) => {
    const parsed = validateCanonicalDigest(value, path, "canonical_execution");
    return parsed.ok ? { ok: true, value: parsed.value as CanonicalExecutionDigest } : parsed;
  });
  if (!executions.ok) return executions;
  const corrections = parseArrayItems(record.value.correctionDigests, "$.correctionDigests", (value, path) => validateCanonicalDigest(value, path, "correction_record"));
  if (!corrections.ok) return corrections;
  const cutoff = validateCanonicalTimestamp(record.value.correctionCutoffAt, "$.correctionCutoffAt");
  if (!cutoff.ok) return cutoff;
  const policies = parseArrayItems(record.value.policies, "$.policies", parsePolicy);
  if (!policies.ok) return policies;
  const periods = parseArrayItems(record.value.statementPeriods, "$.statementPeriods", parseRange);
  if (!periods.ok) return periods;
  const gaps = parseArrayItems(record.value.knownGaps, "$.knownGaps", parseGap);
  if (!gaps.ok) return gaps;
  const overlaps = parseArrayItems(record.value.overlappingPeriods, "$.overlappingPeriods", parseOverlap);
  if (!overlaps.ok) return overlaps;
  const exclusions = parseArrayItems(record.value.exclusions, "$.exclusions", parseExclusion);
  if (!exclusions.ok) return exclusions;
  const prior = parseArrayItems(record.value.priorInventory, "$.priorInventory", parsePrior);
  if (!prior.ok) return prior;
  const open = parseArrayItems(record.value.openPositions, "$.openPositions", parseOpenPosition);
  if (!open.ok) return open;
  const currencies = validateStringSet(record.value.currencies, "$.currencies", { pattern: /^[A-Z]{3}$/ });
  if (!currencies.ok) return currencies;
  const coverage = validateStringSet(record.value.coverageStates, "$.coverageStates", { maxItems: COVERAGE_STATES.size });
  if (!coverage.ok || coverage.value.some((state) => !COVERAGE_STATES.has(state as CoverageState))) return failure("ti_v3_validation_enum_invalid", "$.coverageStates");
  const reconstruction = validateEnum(record.value.reconstructionStatus, RECONSTRUCTION_STATES, "$.reconstructionStatus");
  if (!reconstruction.ok) return reconstruction;
  const reasons = validateStringSet(record.value.reconstructionReasonCodes, "$.reconstructionReasonCodes", { pattern: /^ti_v3_[a-z0-9_]{1,120}$/ });
  if (!reasons.ok) return reasons;

  const coverageSet = new Set(coverage.value);
  if (gaps.value.length > 0) coverageSet.add("coverage_gap_detected");
  if (sources.value.some((source) => source.deletionState === "deleted")) coverageSet.add("deleted_source_present");
  if (prior.value.some((entry) => entry.state === "unknown")) coverageSet.add("prior_inventory_incomplete");
  if (reasons.value.includes("ti_v3_correction_unresolved")) coverageSet.add("unresolved_correction_present");
  if (overlaps.value.some((overlap) => overlap.resolutionState === "unresolved") && reconstruction.value === "exact") return failure("ti_v3_manifest_inconsistent", "$.reconstructionStatus");

  const content = {
    schemaVersion: DATASET_MANIFEST_VERSION,
    canonicalOwnerKey: record.value.canonicalOwnerKey,
    canonicalAccountKeys: accounts.value,
    sourceDocuments: canonicalOrder(sources.value, (value) => value.sourceDocumentDigest),
    acceptedExecutionDigests: canonicalStringSet(executions.value) as readonly CanonicalExecutionDigest[],
    correctionDigests: canonicalStringSet(corrections.value) as readonly CanonicalContentDigest[],
    correctionCutoffAt: cutoff.value,
    policies: canonicalOrder(policies.value, (value) => `${value.policyKey}:${value.policyVersion}:${value.policyDigest}`),
    statementPeriods: canonicalOrder(periods.value, (value) => `${value.startAt}:${value.endAt}:${value.startInclusive}:${value.endInclusive}`),
    knownGaps: canonicalOrder(gaps.value, (value) => `${value.scopeKey}:${value.range.startAt}:${value.reasonCode}`),
    overlappingPeriods: canonicalOrder(overlaps.value, (value) => `${value.range.startAt}:${value.sourceDocumentDigests.join(":")}`),
    exclusions: canonicalOrder(exclusions.value, (value) => `${value.evidenceDigest}:${value.reasonCode}`),
    priorInventory: canonicalOrder(prior.value, (value) => value.ledgerKey),
    openPositions: canonicalOrder(open.value, (value) => value.ledgerKey),
    currencies: currencies.value,
    coverageStates: canonicalStringSet([...coverageSet]) as readonly CoverageState[],
    reconstructionStatus: reconstruction.value,
    reconstructionReasonCodes: canonicalReasonCodes(reasons.value),
  } satisfies DatasetManifestContent;
  const identity = createCanonicalContentIdentity("dataset_manifest", "v1", content);
  if (!identity.ok) return failure(identity.error.code, identity.error.path);
  const manifest = Object.freeze({
    content: identity.value.canonicalValue as unknown as DatasetManifestContent,
    manifestDigest: identity.value.identifier,
  });
  verifiedManifests.add(manifest);
  return { ok: true, value: manifest };
}

export function verifyDatasetManifest(input: unknown): ExactResult<DatasetManifest, DatasetManifestFailure> {
  if (typeof input !== "object" || input === null) return failure("ti_v3_manifest_unverified", "$");
  if (verifiedManifests.has(input as DatasetManifest)) return { ok: true, value: input as DatasetManifest };
  const record = validateExactRecord(input, ["content", "manifestDigest"], []);
  if (!record.ok) return failure("ti_v3_manifest_unverified", record.error.path);
  const rebuilt = buildDatasetManifest(record.value.content);
  if (!rebuilt.ok || rebuilt.value.manifestDigest !== record.value.manifestDigest) return failure("ti_v3_manifest_unverified", "$.manifestDigest");
  return rebuilt;
}
