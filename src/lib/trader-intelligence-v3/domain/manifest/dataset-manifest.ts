import type { CanonicalUtcTimestamp } from "../canonical";
import type { ExactResult } from "../exact";
import {
  canonicalReasonCodes,
  canonicalStringSet,
  validateCanonicalDigest,
  validateCanonicalTimestamp,
  validateEnum,
  validateExactRecord,
  validateExactRecordWithAuthorities,
  validateStringSet,
  type FoundationValidationFailure,
} from "../foundation";
import {
  createCanonicalContentIdentity,
  type CanonicalContentDigest,
  type CanonicalExecutionDigest,
  type CanonicalSourceDocumentDigest,
} from "../identity";
import { verifyCorrectionApplicationResult } from "../temporal";

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
  readonly contractDigest: CanonicalContentDigest;
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
  readonly correctionResultDigest: CanonicalContentDigest;
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

function manifestRangeKey(range: ManifestTimeRange): string {
  return `${range.startAt}:${range.endAt}:${range.startInclusive}:${range.endInclusive}`;
}

function rangeContains(container: ManifestTimeRange, candidate: ManifestTimeRange): boolean {
  const startContained = candidate.startAt > container.startAt ||
    (candidate.startAt === container.startAt && (!candidate.startInclusive || container.startInclusive));
  const endContained = candidate.endAt < container.endAt ||
    (candidate.endAt === container.endAt && (!candidate.endInclusive || container.endInclusive));
  return startContained && endContained;
}

function rangesOverlap(left: ManifestTimeRange, right: ManifestTimeRange): boolean {
  if (left.endAt < right.startAt || right.endAt < left.startAt) return false;
  if (left.endAt === right.startAt) return left.endInclusive && right.startInclusive;
  if (right.endAt === left.startAt) return right.endInclusive && left.startInclusive;
  return true;
}

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
  if (new Set(periods.value.map(manifestRangeKey)).size !== periods.value.length) {
    return failure("ti_v3_manifest_inconsistent", `${path}.statementPeriods`);
  }
  const deletion = validateEnum(record.value.deletionState, DELETION_STATES, `${path}.deletionState`);
  if (!deletion.ok) return deletion;
  return {
    ok: true,
    value: {
      sourceDocumentDigest: digest.value as CanonicalSourceDocumentDigest,
      sourceKind: sourceKind.value,
      statementPeriods: canonicalOrder(periods.value, manifestRangeKey),
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
  if (digests.value.length < 2 || new Set(digests.value).size !== digests.value.length) return failure("ti_v3_manifest_inconsistent", `${path}.sourceDocumentDigests`);
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
  const digest = validateCanonicalDigest(record.value.contractDigest, `${path}.contractDigest`, "starting_inventory");
  if (!digest.ok) return digest;
  return { ok: true, value: { ledgerKey: record.value.ledgerKey, state: state.value, contractDigest: digest.value } };
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
  const record = validateExactRecordWithAuthorities(
    input,
    [
      "canonicalOwnerKey",
      "canonicalAccountKeys",
      "sourceDocuments",
      "acceptedExecutionDigests",
      "correctionResult",
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
    {
      correctionResult: (value) => verifyCorrectionApplicationResult(value).ok,
    },
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
  const correctionResult = verifyCorrectionApplicationResult(record.value.correctionResult);
  if (!correctionResult.ok) return failure("ti_v3_manifest_unverified", "$.correctionResult");
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

  const duplicate = <T>(values: readonly T[], key: (value: T) => string): boolean => {
    const keys = values.map(key);
    return new Set(keys).size !== keys.length;
  };
  if (duplicate(sources.value, (source) => source.sourceDocumentDigest)) return failure("ti_v3_manifest_inconsistent", "$.sourceDocuments");
  if (duplicate(policies.value, (entry) => `${entry.policyKey}:${entry.policyVersion}`) || duplicate(policies.value, (entry) => entry.policyDigest)) return failure("ti_v3_manifest_inconsistent", "$.policies");
  if (duplicate(executions.value, String)) return failure("ti_v3_manifest_inconsistent", "$.acceptedExecutionDigests");
  if (duplicate(prior.value, (entry) => entry.ledgerKey)) return failure("ti_v3_manifest_inconsistent", "$.priorInventory");
  if (duplicate(open.value, (entry) => entry.ledgerKey)) return failure("ti_v3_manifest_inconsistent", "$.openPositions");
  if (duplicate(exclusions.value, (entry) => entry.evidenceDigest)) return failure("ti_v3_manifest_inconsistent", "$.exclusions");
  const accepted = new Set(executions.value);
  if (open.value.some((entry) => entry.executionDigests.some((digest) => !accepted.has(digest)))) return failure("ti_v3_manifest_inconsistent", "$.openPositions");
  if (correctionResult.value.status !== "applied" || correctionResult.value.activeExecutionDigests.join("\n") !== [...executions.value].sort().join("\n")) return failure("ti_v3_manifest_inconsistent", "$.correctionResult");
  const validateOpenLedgerScope = (ledgerKey: string): boolean => {
    const [account, instrument, currency, ...rest] = ledgerKey.split(":");
    return rest.length === 0 && accounts.value.includes(account) && /^[-a-z0-9_]{1,96}$/.test(instrument ?? "") && currencies.value.includes((currency ?? "").toUpperCase());
  };
  const validatePriorLedgerScope = (ledgerKey: string): boolean => {
    const [owner, account, instrument, currency, ...rest] = ledgerKey.split(":");
    return rest.length === 0 && owner === record.value.canonicalOwnerKey && accounts.value.includes(account) && /^[-a-z0-9_]{1,96}$/.test(instrument ?? "") && currencies.value.includes((currency ?? "").toUpperCase());
  };
  if (prior.value.some((entry) => !validatePriorLedgerScope(entry.ledgerKey))) return failure("ti_v3_manifest_inconsistent", "$.priorInventory");
  if (open.value.some((entry) => !validateOpenLedgerScope(entry.ledgerKey))) return failure("ti_v3_manifest_inconsistent", "$.openPositions");
  if (executions.value.length > 0 && (sources.value.length === 0 || currencies.value.length === 0)) return failure("ti_v3_manifest_inconsistent", "$.acceptedExecutionDigests");
  const sourceDigests = new Set(sources.value.map((source) => source.sourceDocumentDigest));
  if (overlaps.value.some((entry) => entry.sourceDocumentDigests.some((digest) => !sourceDigests.has(digest)))) return failure("ti_v3_manifest_inconsistent", "$.overlappingPeriods");
  if (duplicate(periods.value, manifestRangeKey) || duplicate(gaps.value, (gap) => `${gap.scopeKey}:${manifestRangeKey(gap.range)}`) || duplicate(overlaps.value, (overlap) => `${overlap.sourceDocumentDigests.join(":")}:${manifestRangeKey(overlap.range)}`)) return failure("ti_v3_manifest_inconsistent", "$.statementPeriods");
  const manifestPeriodKeys = new Set(periods.value.map(manifestRangeKey));
  if (sources.value.some((source) => source.statementPeriods.some((period) => !manifestPeriodKeys.has(manifestRangeKey(period))))) return failure("ti_v3_manifest_inconsistent", "$.sourceDocuments.statementPeriods");
  if (gaps.value.some((gap) => !periods.value.some((period) => rangeContains(period, gap.range)))) return failure("ti_v3_manifest_inconsistent", "$.knownGaps");
  const sourcesByDigest = new Map(sources.value.map((source) => [source.sourceDocumentDigest, source]));
  if (overlaps.value.some((overlap) => overlap.sourceDocumentDigests.some((sourceDigest) => {
    const source = sourcesByDigest.get(sourceDigest);
    return source === undefined || !source.statementPeriods.some((period) => rangeContains(period, overlap.range));
  }))) return failure("ti_v3_manifest_inconsistent", "$.overlappingPeriods");
  if (gaps.value.some((gap) => overlaps.value.some((overlap) => rangesOverlap(gap.range, overlap.range)))) return failure("ti_v3_manifest_inconsistent", "$.knownGaps");

  const coverageSet = new Set(coverage.value);
  if (gaps.value.length > 0) coverageSet.add("coverage_gap_detected");
  if (sources.value.some((source) => source.deletionState === "deleted")) coverageSet.add("deleted_source_present");
  if (prior.value.some((entry) => entry.state === "unknown")) coverageSet.add("prior_inventory_incomplete");
  if (reasons.value.includes("ti_v3_correction_unresolved")) coverageSet.add("unresolved_correction_present");
  if (overlaps.value.some((overlap) => overlap.resolutionState === "unresolved") && reconstruction.value === "exact") return failure("ti_v3_manifest_inconsistent", "$.reconstructionStatus");
  if (coverageSet.has("complete_account_period") && (gaps.value.length > 0 || overlaps.value.length > 0 || coverageSet.has("partial_account_period") || coverageSet.has("multiple_accounts_partial") || coverageSet.has("unknown_coverage") || coverageSet.has("prior_inventory_incomplete") || coverageSet.has("unresolved_correction_present"))) return failure("ti_v3_manifest_inconsistent", "$.coverageStates");

  const content = {
    schemaVersion: DATASET_MANIFEST_VERSION,
    canonicalOwnerKey: record.value.canonicalOwnerKey,
    canonicalAccountKeys: accounts.value,
    sourceDocuments: canonicalOrder(sources.value, (value) => `${value.sourceDocumentDigest}:${value.sourceKind}:${value.deletionState}:${value.statementPeriods.map(manifestRangeKey).join("|")}`),
    acceptedExecutionDigests: canonicalStringSet(executions.value) as readonly CanonicalExecutionDigest[],
    correctionDigests: correctionResult.value.appliedCorrectionDigests,
    correctionResultDigest: correctionResult.value.correctionResultDigest,
    correctionCutoffAt: correctionResult.value.correctionCutoffAt,
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
  return failure("ti_v3_manifest_unverified", "$");
}
