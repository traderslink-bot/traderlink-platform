import type { CanonicalUtcTimestamp } from "../canonical";
import type { EligibilitySet } from "../eligibility";
import { verifyEligibilitySet } from "../eligibility";
import {
  verifyExecutionOccurrenceEvidenceInventory,
  verifyRoundTripEvidenceInventory,
  type ExecutionOccurrenceEvidenceInventory,
  type RoundTripEvidenceInventory,
} from "../evidence/evidence-inventory";
import type { ExactResult } from "../exact";
import {
  validateCanonicalTimestamp,
  validateExactRecord,
  validateExactRecordWithAuthorities,
  type FoundationValidationFailure,
} from "../foundation";
import { createCanonicalContentIdentity, type CanonicalContentDigest } from "../identity";
import type { DatasetManifest } from "../manifest";
import { verifyDatasetManifest } from "../manifest";
import type { CanonicalQueryFilter } from "../query";
import { verifyCanonicalQueryFilter } from "../query";

export const ANALYSIS_SNAPSHOT_VERSION = "ti_v3_analysis_snapshot_v1" as const;

export interface AnalysisSnapshotEvidenceSubjects {
  readonly executionDigests: readonly CanonicalContentDigest[];
  readonly executionOccurrenceKeys: readonly string[];
  readonly executionOccurrenceInventoryDigest: CanonicalContentDigest | null;
  readonly correctionDigests: readonly CanonicalContentDigest[];
  readonly policyDigests: readonly CanonicalContentDigest[];
  readonly reconstructedRoundTripKeys: readonly string[];
  readonly roundTripInventoryDigest: CanonicalContentDigest | null;
}

export interface AnalysisSnapshot {
  readonly schemaVersion: typeof ANALYSIS_SNAPSHOT_VERSION;
  readonly manifestDigest: CanonicalContentDigest;
  readonly correctionCutoffAt: CanonicalUtcTimestamp;
  readonly policySetDigest: CanonicalContentDigest;
  readonly policyReferences: readonly {
    readonly policyKey: string;
    readonly policyVersion: string;
    readonly policyDigest: CanonicalContentDigest;
  }[];
  readonly eligibilitySetDigest: CanonicalContentDigest;
  readonly retrospectivePolicyDigest: CanonicalContentDigest;
  readonly correctionResultDigest: CanonicalContentDigest;
  readonly enrichmentSetDigest: CanonicalContentDigest;
  readonly intentRuleCutoffAt: CanonicalUtcTimestamp;
  readonly analysisCutoffAt: CanonicalUtcTimestamp;
  readonly filterDigest: CanonicalContentDigest;
  readonly canonicalFilter: CanonicalQueryFilter;
  readonly evidenceNamespace: string;
  readonly evidenceSubjects: AnalysisSnapshotEvidenceSubjects;
  readonly snapshotDigest: CanonicalContentDigest;
}

export interface EmptyEnrichmentSet {
  readonly schemaVersion: "ti_v3_empty_enrichment_set_v1";
  readonly manifestDigest: CanonicalContentDigest;
  readonly analysisCutoffAt: CanonicalUtcTimestamp;
  readonly items: readonly [];
  readonly enrichmentSetDigest: CanonicalContentDigest;
}

export type SnapshotFailure = FoundationValidationFailure | {
  readonly code:
    | "ti_v3_snapshot_manifest_mismatch"
    | "ti_v3_snapshot_cutoff_mismatch"
    | "ti_v3_snapshot_filter_mismatch"
    | "ti_v3_snapshot_policy_stale"
    | "ti_v3_snapshot_mixed_correction_versions"
    | "ti_v3_snapshot_enrichment_mismatch"
    | "ti_v3_snapshot_evidence_inventory_mismatch"
    | "ti_v3_snapshot_integrity_mismatch"
    | "ti_v3_snapshot_unverified";
  readonly path: string;
};

export interface AnalysisSnapshotDependencies {
  readonly manifest: DatasetManifest;
  readonly eligibilitySet: EligibilitySet;
  readonly filter: CanonicalQueryFilter;
  readonly enrichmentSet: EmptyEnrichmentSet;
  readonly occurrenceInventory: ExecutionOccurrenceEvidenceInventory | null;
  readonly roundTripInventory: RoundTripEvidenceInventory | null;
}

const verifiedSnapshots = new WeakSet<AnalysisSnapshot>();
const verifiedEmptyEnrichmentSets = new WeakSet<EmptyEnrichmentSet>();

function failure(
  code: SnapshotFailure["code"],
  path: string,
): ExactResult<never, SnapshotFailure> {
  return { ok: false, error: { code, path } };
}

export function createEmptyEnrichmentSet(
  manifest: DatasetManifest,
  analysisCutoffAt: CanonicalUtcTimestamp,
): ExactResult<EmptyEnrichmentSet, SnapshotFailure> {
  const verifiedManifest = verifyDatasetManifest(manifest);
  const cutoff = validateCanonicalTimestamp(analysisCutoffAt, "$.analysisCutoffAt");
  if (!verifiedManifest.ok) return failure("ti_v3_snapshot_unverified", "$.manifest");
  if (!cutoff.ok) return cutoff;
  const content = {
    schemaVersion: "ti_v3_empty_enrichment_set_v1" as const,
    manifestDigest: verifiedManifest.value.manifestDigest,
    analysisCutoffAt: cutoff.value,
    items: [] as const,
  };
  const identity = createCanonicalContentIdentity("enrichment_set", "v1", content);
  if (!identity.ok) return failure(identity.error.code, identity.error.path);
  const canonical = identity.value.canonicalValue as unknown as Omit<
    EmptyEnrichmentSet,
    "enrichmentSetDigest"
  >;
  const value = Object.freeze({
    ...canonical,
    enrichmentSetDigest: identity.value.identifier,
  });
  verifiedEmptyEnrichmentSets.add(value);
  return { ok: true, value };
}

function snapshotContent(snapshot: AnalysisSnapshot): Omit<AnalysisSnapshot, "snapshotDigest"> {
  const { snapshotDigest: _snapshotDigest, ...content } = snapshot;
  void _snapshotDigest;
  return content;
}

function hasExactSnapshotIdentity(snapshot: AnalysisSnapshot): boolean {
  const identity = createCanonicalContentIdentity("analysis_snapshot", "v1", snapshotContent(snapshot));
  return identity.ok && identity.value.identifier === snapshot.snapshotDigest;
}

export function buildAnalysisSnapshot(input: {
  readonly manifest: unknown;
  readonly eligibilitySet: unknown;
  readonly enrichmentSet: unknown;
  readonly intentRuleCutoffAt: unknown;
  readonly analysisCutoffAt: unknown;
  readonly filter: unknown;
  readonly evidenceNamespace: unknown;
  readonly occurrenceInventory: unknown | null;
  readonly roundTripInventory: unknown | null;
}): ExactResult<AnalysisSnapshot, SnapshotFailure> {
  const authorityInput = validateExactRecordWithAuthorities(
    input,
    [
      "manifest", "eligibilitySet", "enrichmentSet", "intentRuleCutoffAt",
      "analysisCutoffAt", "filter", "evidenceNamespace", "occurrenceInventory",
      "roundTripInventory",
    ],
    [],
    {
      manifest: (value) => verifyDatasetManifest(value).ok,
      eligibilitySet: (value) => verifyEligibilitySet(value).ok,
      enrichmentSet: (value) => typeof value === "object" && value !== null && verifiedEmptyEnrichmentSets.has(value as EmptyEnrichmentSet),
      filter: (value) => verifyCanonicalQueryFilter(value).ok,
      occurrenceInventory: (value) => value === null || verifyExecutionOccurrenceEvidenceInventory(value).ok,
      roundTripInventory: (value) => value === null || verifyRoundTripEvidenceInventory(value).ok,
    },
  );
  if (!authorityInput.ok) return authorityInput;
  input = authorityInput.value as unknown as typeof input;
  const manifest = verifyDatasetManifest(input.manifest);
  if (!manifest.ok) return failure("ti_v3_snapshot_unverified", "$.manifest");
  const eligibility = verifyEligibilitySet(input.eligibilitySet);
  if (!eligibility.ok) return failure("ti_v3_snapshot_unverified", "$.eligibilitySet");
  const filter = verifyCanonicalQueryFilter(input.filter);
  if (!filter.ok) return failure("ti_v3_snapshot_unverified", "$.filter");
  if (
    typeof input.enrichmentSet !== "object" ||
    input.enrichmentSet === null ||
    !verifiedEmptyEnrichmentSets.has(input.enrichmentSet as EmptyEnrichmentSet)
  ) {
    return failure("ti_v3_snapshot_unverified", "$.enrichmentSet");
  }
  const enrichment = input.enrichmentSet as EmptyEnrichmentSet;
  const intent = validateCanonicalTimestamp(input.intentRuleCutoffAt, "$.intentRuleCutoffAt");
  if (!intent.ok) return intent;
  const analysis = validateCanonicalTimestamp(input.analysisCutoffAt, "$.analysisCutoffAt");
  if (!analysis.ok) return analysis;
  if (manifest.value.manifestDigest !== eligibility.value.manifestDigest) {
    return failure("ti_v3_snapshot_manifest_mismatch", "$.eligibilitySet.manifestDigest");
  }
  if (
    enrichment.manifestDigest !== manifest.value.manifestDigest ||
    enrichment.analysisCutoffAt !== analysis.value
  ) {
    return failure("ti_v3_snapshot_enrichment_mismatch", "$.enrichmentSet");
  }
  if (
    eligibility.value.analysisCutoffAt !== analysis.value ||
    filter.value.analysisCutoffAt !== analysis.value
  ) {
    return failure("ti_v3_snapshot_cutoff_mismatch", "$.analysisCutoffAt");
  }
  if (
    manifest.value.content.correctionCutoffAt !== filter.value.correctionCutoffAt ||
    eligibility.value.correctionResultDigest !== manifest.value.content.correctionResultDigest
  ) {
    return failure("ti_v3_snapshot_mixed_correction_versions", "$.correctionResultDigest");
  }
  if (
    !manifest.value.content.policies.some(
      (policy) => policy.policyDigest === eligibility.value.retrospectivePolicyDigest,
    )
  ) {
    return failure("ti_v3_snapshot_policy_stale", "$.eligibilitySet.retrospectivePolicyDigest");
  }
  if (filter.value.boundSnapshotDigest !== null) {
    return failure("ti_v3_snapshot_filter_mismatch", "$.filter.boundSnapshotDigest");
  }
  if (intent.value > analysis.value) {
    return failure("ti_v3_snapshot_cutoff_mismatch", "$.intentRuleCutoffAt");
  }
  if (
    typeof input.evidenceNamespace !== "string" ||
    !/^evidence:[a-z0-9][a-z0-9:_-]{0,191}$/.test(input.evidenceNamespace)
  ) {
    return failure("ti_v3_validation_string_invalid", "$.evidenceNamespace");
  }

  const occurrence = input.occurrenceInventory === null
    ? null
    : verifyExecutionOccurrenceEvidenceInventory(input.occurrenceInventory);
  if (occurrence !== null && !occurrence.ok) {
    return failure("ti_v3_snapshot_evidence_inventory_mismatch", "$.occurrenceInventory");
  }
  const roundTrips = input.roundTripInventory === null
    ? null
    : verifyRoundTripEvidenceInventory(input.roundTripInventory);
  if (roundTrips !== null && !roundTrips.ok) {
    return failure("ti_v3_snapshot_evidence_inventory_mismatch", "$.roundTripInventory");
  }
  const accepted = new Set(manifest.value.content.acceptedExecutionDigests);
  if (
    occurrence !== null &&
    occurrence.value.inputExecutionDigests.some((digest) => !accepted.has(digest))
  ) {
    return failure("ti_v3_snapshot_evidence_inventory_mismatch", "$.occurrenceInventory");
  }
  if (
    roundTrips !== null &&
    roundTrips.value.inputExecutionDigests.some((digest) => !accepted.has(digest))
  ) {
    return failure("ti_v3_snapshot_evidence_inventory_mismatch", "$.roundTripInventory");
  }

  const policyIdentity = createCanonicalContentIdentity("canonical_content", "v1", {
    policies: manifest.value.content.policies,
  });
  if (!policyIdentity.ok) return failure(policyIdentity.error.code, policyIdentity.error.path);
  const evidenceSubjects = {
    executionDigests: manifest.value.content.acceptedExecutionDigests,
    executionOccurrenceKeys: occurrence === null ? [] : occurrence.value.occurrenceKeys,
    executionOccurrenceInventoryDigest: occurrence === null ? null : occurrence.value.inventoryDigest,
    correctionDigests: manifest.value.content.correctionDigests,
    policyDigests: manifest.value.content.policies.map((policy) => policy.policyDigest).sort(),
    reconstructedRoundTripKeys: roundTrips === null ? [] : roundTrips.value.roundTripKeys,
    roundTripInventoryDigest: roundTrips === null ? null : roundTrips.value.inventoryDigest,
  };
  const content = {
    schemaVersion: ANALYSIS_SNAPSHOT_VERSION,
    manifestDigest: manifest.value.manifestDigest,
    correctionCutoffAt: manifest.value.content.correctionCutoffAt,
    policySetDigest: policyIdentity.value.identifier,
    policyReferences: manifest.value.content.policies,
    eligibilitySetDigest: eligibility.value.eligibilitySetDigest,
    retrospectivePolicyDigest: eligibility.value.retrospectivePolicyDigest,
    correctionResultDigest: eligibility.value.correctionResultDigest,
    enrichmentSetDigest: enrichment.enrichmentSetDigest,
    intentRuleCutoffAt: intent.value,
    analysisCutoffAt: analysis.value,
    filterDigest: filter.value.filterDigest,
    canonicalFilter: filter.value,
    evidenceNamespace: input.evidenceNamespace,
    evidenceSubjects,
  };
  const identity = createCanonicalContentIdentity("analysis_snapshot", "v1", content);
  if (!identity.ok) return failure(identity.error.code, identity.error.path);
  const canonical = identity.value.canonicalValue as unknown as Omit<
    AnalysisSnapshot,
    "snapshotDigest"
  >;
  const snapshot = Object.freeze({ ...canonical, snapshotDigest: identity.value.identifier });
  verifiedSnapshots.add(snapshot);
  return { ok: true, value: snapshot };
}

export function verifyAnalysisSnapshot(
  input: unknown,
  dependencies?: AnalysisSnapshotDependencies,
): ExactResult<AnalysisSnapshot, SnapshotFailure> {
  if (typeof input === "object" && input !== null && verifiedSnapshots.has(input as AnalysisSnapshot)) {
    const snapshot = input as AnalysisSnapshot;
    if (!hasExactSnapshotIdentity(snapshot)) {
      return failure("ti_v3_snapshot_integrity_mismatch", "$.snapshotDigest");
    }
    if (
      dependencies !== undefined &&
      (snapshot.manifestDigest !== dependencies.manifest.manifestDigest ||
        snapshot.eligibilitySetDigest !== dependencies.eligibilitySet.eligibilitySetDigest ||
        snapshot.filterDigest !== dependencies.filter.filterDigest ||
        snapshot.enrichmentSetDigest !== dependencies.enrichmentSet.enrichmentSetDigest ||
        snapshot.evidenceSubjects.executionOccurrenceInventoryDigest !==
          (dependencies.occurrenceInventory?.inventoryDigest ?? null) ||
        snapshot.evidenceSubjects.roundTripInventoryDigest !==
          (dependencies.roundTripInventory?.inventoryDigest ?? null))
    ) {
      return failure("ti_v3_snapshot_manifest_mismatch", "$");
    }
    return { ok: true, value: snapshot };
  }
  if (dependencies === undefined) return failure("ti_v3_snapshot_unverified", "$");
  const record = validateExactRecord(
    input,
    [
      "schemaVersion", "manifestDigest", "correctionCutoffAt", "policySetDigest",
      "policyReferences", "eligibilitySetDigest", "retrospectivePolicyDigest",
      "correctionResultDigest", "enrichmentSetDigest", "intentRuleCutoffAt",
      "analysisCutoffAt", "filterDigest", "canonicalFilter", "evidenceNamespace",
      "evidenceSubjects", "snapshotDigest",
    ],
    [],
  );
  if (!record.ok || record.value.schemaVersion !== ANALYSIS_SNAPSHOT_VERSION) {
    return failure("ti_v3_snapshot_unverified", "$.schemaVersion");
  }
  const { snapshotDigest: suppliedDigest, ...suppliedContent } = record.value;
  const suppliedIdentity = createCanonicalContentIdentity(
    "analysis_snapshot",
    "v1",
    suppliedContent,
  );
  if (!suppliedIdentity.ok || suppliedIdentity.value.identifier !== suppliedDigest) {
    return failure("ti_v3_snapshot_integrity_mismatch", "$.snapshotDigest");
  }
  const rebuilt = buildAnalysisSnapshot({
    manifest: dependencies.manifest,
    eligibilitySet: dependencies.eligibilitySet,
    enrichmentSet: dependencies.enrichmentSet,
    intentRuleCutoffAt: record.value.intentRuleCutoffAt,
    analysisCutoffAt: record.value.analysisCutoffAt,
    filter: dependencies.filter,
    evidenceNamespace: record.value.evidenceNamespace,
    occurrenceInventory: dependencies.occurrenceInventory,
    roundTripInventory: dependencies.roundTripInventory,
  });
  if (!rebuilt.ok || rebuilt.value.snapshotDigest !== record.value.snapshotDigest) {
    return failure("ti_v3_snapshot_integrity_mismatch", "$.snapshotDigest");
  }
  return rebuilt;
}

export function assertSnapshotExecutionManifest(
  snapshot: AnalysisSnapshot,
  executionManifestDigest: CanonicalContentDigest,
): ExactResult<true, SnapshotFailure> {
  return snapshot.manifestDigest === executionManifestDigest
    ? { ok: true, value: true }
    : failure("ti_v3_snapshot_manifest_mismatch", "$.executionManifestDigest");
}
