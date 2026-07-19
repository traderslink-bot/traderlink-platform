import type { CanonicalUtcTimestamp } from "../canonical";
import type { EligibilitySet } from "../eligibility";
import { verifyEligibilitySet } from "../eligibility";
import type { ExactResult } from "../exact";
import { validateCanonicalDigest, validateCanonicalTimestamp, validateExactRecord, type FoundationValidationFailure } from "../foundation";
import { createCanonicalContentIdentity, type CanonicalContentDigest } from "../identity";
import type { DatasetManifest } from "../manifest";
import { verifyDatasetManifest } from "../manifest";
import type { CanonicalQueryFilter } from "../query";
import { verifyCanonicalQueryFilter } from "../query";

export const ANALYSIS_SNAPSHOT_VERSION = "ti_v3_analysis_snapshot_v1" as const;

export interface AnalysisSnapshot {
  readonly schemaVersion: typeof ANALYSIS_SNAPSHOT_VERSION;
  readonly manifestDigest: CanonicalContentDigest;
  readonly correctionCutoffAt: CanonicalUtcTimestamp;
  readonly policySetDigest: CanonicalContentDigest;
  readonly policyReferences: readonly { readonly policyKey: string; readonly policyVersion: string; readonly policyDigest: CanonicalContentDigest }[];
  readonly eligibilitySetDigest: CanonicalContentDigest;
  readonly correctionResultDigest: CanonicalContentDigest;
  readonly enrichmentSetDigest: CanonicalContentDigest;
  readonly intentRuleCutoffAt: CanonicalUtcTimestamp;
  readonly analysisCutoffAt: CanonicalUtcTimestamp;
  readonly filterDigest: CanonicalContentDigest;
  readonly evidenceNamespace: string;
  readonly evidenceSubjects: {
    readonly executionDigests: readonly CanonicalContentDigest[];
    readonly correctionDigests: readonly CanonicalContentDigest[];
    readonly policyDigests: readonly CanonicalContentDigest[];
    readonly reconstructedRoundTripKeys: readonly string[];
  };
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
    | "ti_v3_snapshot_unverified";
  readonly path: string;
};

const verifiedSnapshots = new WeakSet<AnalysisSnapshot>();
const verifiedEmptyEnrichmentSets = new WeakSet<EmptyEnrichmentSet>();

function failure(code: SnapshotFailure["code"], path: string): ExactResult<never, SnapshotFailure> {
  return { ok: false, error: { code, path } };
}

export function createEmptyEnrichmentSet(manifest: DatasetManifest, analysisCutoffAt: CanonicalUtcTimestamp): ExactResult<EmptyEnrichmentSet, SnapshotFailure> {
  const verifiedManifest = verifyDatasetManifest(manifest);
  const cutoff = validateCanonicalTimestamp(analysisCutoffAt, "$.analysisCutoffAt");
  if (!verifiedManifest.ok) return failure("ti_v3_snapshot_unverified", "$.manifest");
  if (!cutoff.ok) return cutoff;
  const content = { schemaVersion: "ti_v3_empty_enrichment_set_v1" as const, manifestDigest: verifiedManifest.value.manifestDigest, analysisCutoffAt: cutoff.value, items: [] as const };
  const identity = createCanonicalContentIdentity("enrichment_set", "v1", content);
  if (!identity.ok) return failure(identity.error.code, identity.error.path);
  const value = Object.freeze({ ...content, items: Object.freeze([]) as readonly [], enrichmentSetDigest: identity.value.identifier });
  verifiedEmptyEnrichmentSets.add(value);
  return { ok: true, value };
}

export function buildAnalysisSnapshot(input: { readonly manifest: unknown; readonly eligibilitySet: unknown; readonly enrichmentSet: unknown; readonly intentRuleCutoffAt: unknown; readonly analysisCutoffAt: unknown; readonly filter: unknown; readonly evidenceNamespace: unknown; readonly reconstructedRoundTripKeys: readonly string[] }): ExactResult<AnalysisSnapshot, SnapshotFailure> {
  const manifest = verifyDatasetManifest(input.manifest);
  if (!manifest.ok) return failure("ti_v3_snapshot_unverified", "$.manifest");
  const eligibility = verifyEligibilitySet(input.eligibilitySet);
  if (!eligibility.ok) return failure("ti_v3_snapshot_unverified", "$.eligibilitySet");
  const filter = verifyCanonicalQueryFilter(input.filter);
  if (!filter.ok) return failure("ti_v3_snapshot_unverified", "$.filter");
  if (typeof input.enrichmentSet !== "object" || input.enrichmentSet === null || !verifiedEmptyEnrichmentSets.has(input.enrichmentSet as EmptyEnrichmentSet)) return failure("ti_v3_snapshot_unverified", "$.enrichmentSet");
  const enrichment = input.enrichmentSet as EmptyEnrichmentSet;
  const intent = validateCanonicalTimestamp(input.intentRuleCutoffAt, "$.intentRuleCutoffAt");
  if (!intent.ok) return intent;
  const analysis = validateCanonicalTimestamp(input.analysisCutoffAt, "$.analysisCutoffAt");
  if (!analysis.ok) return analysis;
  if (manifest.value.manifestDigest !== eligibility.value.manifestDigest) return failure("ti_v3_snapshot_manifest_mismatch", "$.eligibilitySet.manifestDigest");
  if (enrichment.manifestDigest !== manifest.value.manifestDigest || enrichment.analysisCutoffAt !== analysis.value) return failure("ti_v3_snapshot_enrichment_mismatch", "$.enrichmentSet");
  if (eligibility.value.analysisCutoffAt !== analysis.value || filter.value.analysisCutoffAt !== analysis.value) return failure("ti_v3_snapshot_cutoff_mismatch", "$.analysisCutoffAt");
  if (manifest.value.content.correctionCutoffAt !== filter.value.correctionCutoffAt) return failure("ti_v3_snapshot_mixed_correction_versions", "$.filter.correctionCutoffAt");
  if (filter.value.boundSnapshotDigest !== null) return failure("ti_v3_snapshot_filter_mismatch", "$.filter.boundSnapshotDigest");
  if (intent.value > analysis.value) return failure("ti_v3_snapshot_cutoff_mismatch", "$.intentRuleCutoffAt");
  if (typeof input.evidenceNamespace !== "string" || !/^evidence:[a-z0-9][a-z0-9:_-]{0,191}$/.test(input.evidenceNamespace)) return failure("ti_v3_validation_string_invalid", "$.evidenceNamespace");
  const policyIdentity = createCanonicalContentIdentity("canonical_content", "v1", { policies: manifest.value.content.policies });
  if (!policyIdentity.ok) return failure(policyIdentity.error.code, policyIdentity.error.path);
  if (!Array.isArray(input.reconstructedRoundTripKeys) || input.reconstructedRoundTripKeys.length > 100_000 || input.reconstructedRoundTripKeys.some((key) => typeof key !== "string" || !/^round_trip:[a-z0-9:._-]{1,240}$/.test(key))) return failure("ti_v3_validation_array_invalid", "$.reconstructedRoundTripKeys");
  const evidenceSubjects = {
    executionDigests: manifest.value.content.acceptedExecutionDigests,
    correctionDigests: manifest.value.content.correctionDigests,
    policyDigests: manifest.value.content.policies.map((policy) => policy.policyDigest).sort(),
    reconstructedRoundTripKeys: [...new Set(input.reconstructedRoundTripKeys)].sort(),
  };
  const content = {
    schemaVersion: ANALYSIS_SNAPSHOT_VERSION,
    manifestDigest: manifest.value.manifestDigest,
    correctionCutoffAt: manifest.value.content.correctionCutoffAt,
    policySetDigest: policyIdentity.value.identifier,
    policyReferences: manifest.value.content.policies,
    eligibilitySetDigest: eligibility.value.eligibilitySetDigest,
    correctionResultDigest: eligibility.value.correctionResultDigest,
    enrichmentSetDigest: enrichment.enrichmentSetDigest,
    intentRuleCutoffAt: intent.value,
    analysisCutoffAt: analysis.value,
    filterDigest: filter.value.filterDigest,
    evidenceNamespace: input.evidenceNamespace,
    evidenceSubjects,
  };
  const identity = createCanonicalContentIdentity("analysis_snapshot", "v1", content);
  if (!identity.ok) return failure(identity.error.code, identity.error.path);
  const snapshot = Object.freeze({ ...content, snapshotDigest: identity.value.identifier });
  verifiedSnapshots.add(snapshot);
  return { ok: true, value: snapshot };
}

export function verifyAnalysisSnapshot(input: unknown, dependencies?: { readonly manifest: DatasetManifest; readonly eligibilitySet: EligibilitySet; readonly filter: CanonicalQueryFilter; readonly enrichmentSet: EmptyEnrichmentSet }): ExactResult<AnalysisSnapshot, SnapshotFailure> {
  if (typeof input === "object" && input !== null && verifiedSnapshots.has(input as AnalysisSnapshot)) {
    const snapshot = input as AnalysisSnapshot;
    if (dependencies !== undefined && (snapshot.manifestDigest !== dependencies.manifest.manifestDigest || snapshot.eligibilitySetDigest !== dependencies.eligibilitySet.eligibilitySetDigest || snapshot.filterDigest !== dependencies.filter.filterDigest || snapshot.enrichmentSetDigest !== dependencies.enrichmentSet.enrichmentSetDigest)) return failure("ti_v3_snapshot_manifest_mismatch", "$");
    return { ok: true, value: snapshot };
  }
  if (dependencies === undefined) return failure("ti_v3_snapshot_unverified", "$");
  const record = validateExactRecord(input, ["schemaVersion", "manifestDigest", "correctionCutoffAt", "policySetDigest", "policyReferences", "eligibilitySetDigest", "correctionResultDigest", "enrichmentSetDigest", "intentRuleCutoffAt", "analysisCutoffAt", "filterDigest", "evidenceNamespace", "evidenceSubjects", "snapshotDigest"], []);
  if (!record.ok || record.value.schemaVersion !== ANALYSIS_SNAPSHOT_VERSION) return failure("ti_v3_snapshot_unverified", "$.schemaVersion");
  const subjectRecord = validateExactRecord(record.value.evidenceSubjects, ["executionDigests", "correctionDigests", "policyDigests", "reconstructedRoundTripKeys"], [], "$.evidenceSubjects");
  if (!subjectRecord.ok || !Array.isArray(subjectRecord.value.reconstructedRoundTripKeys)) return failure("ti_v3_snapshot_unverified", "$.evidenceSubjects");
  const rebuilt = buildAnalysisSnapshot({ manifest: dependencies.manifest, eligibilitySet: dependencies.eligibilitySet, enrichmentSet: dependencies.enrichmentSet, intentRuleCutoffAt: record.value.intentRuleCutoffAt, analysisCutoffAt: record.value.analysisCutoffAt, filter: dependencies.filter, evidenceNamespace: record.value.evidenceNamespace, reconstructedRoundTripKeys: subjectRecord.value.reconstructedRoundTripKeys as string[] });
  if (!rebuilt.ok || rebuilt.value.snapshotDigest !== record.value.snapshotDigest || rebuilt.value.policySetDigest !== record.value.policySetDigest || rebuilt.value.manifestDigest !== record.value.manifestDigest || rebuilt.value.eligibilitySetDigest !== record.value.eligibilitySetDigest || rebuilt.value.filterDigest !== record.value.filterDigest) return failure("ti_v3_snapshot_unverified", "$.snapshotDigest");
  return rebuilt;
}

export function assertSnapshotExecutionManifest(snapshot: AnalysisSnapshot, executionManifestDigest: CanonicalContentDigest): ExactResult<true, SnapshotFailure> {
  return snapshot.manifestDigest === executionManifestDigest ? { ok: true, value: true } : failure("ti_v3_snapshot_manifest_mismatch", "$.executionManifestDigest");
}
