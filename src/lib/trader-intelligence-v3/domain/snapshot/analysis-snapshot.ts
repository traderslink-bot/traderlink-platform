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
  readonly enrichmentSetDigest: CanonicalContentDigest;
  readonly intentRuleCutoffAt: CanonicalUtcTimestamp;
  readonly analysisCutoffAt: CanonicalUtcTimestamp;
  readonly filterDigest: CanonicalContentDigest;
  readonly evidenceNamespace: string;
  readonly snapshotDigest: CanonicalContentDigest;
}

export type SnapshotFailure = FoundationValidationFailure | {
  readonly code:
    | "ti_v3_snapshot_manifest_mismatch"
    | "ti_v3_snapshot_cutoff_mismatch"
    | "ti_v3_snapshot_filter_mismatch"
    | "ti_v3_snapshot_policy_stale"
    | "ti_v3_snapshot_mixed_correction_versions"
    | "ti_v3_snapshot_unverified";
  readonly path: string;
};

const verifiedSnapshots = new WeakSet<AnalysisSnapshot>();

function failure(code: SnapshotFailure["code"], path: string): ExactResult<never, SnapshotFailure> {
  return { ok: false, error: { code, path } };
}

export function createEmptyEnrichmentSetDigest(manifestDigest: CanonicalContentDigest, analysisCutoffAt: CanonicalUtcTimestamp): ExactResult<CanonicalContentDigest, SnapshotFailure> {
  const identity = createCanonicalContentIdentity("enrichment_set", "v1", { schemaVersion: "ti_v3_enrichment_set_v1", manifestDigest, analysisCutoffAt, items: [] });
  return identity.ok ? { ok: true, value: identity.value.identifier } : failure(identity.error.code, identity.error.path);
}

export function buildAnalysisSnapshot(input: { readonly manifest: unknown; readonly eligibilitySet: unknown; readonly enrichmentSetDigest: unknown; readonly intentRuleCutoffAt: unknown; readonly analysisCutoffAt: unknown; readonly filter: unknown; readonly evidenceNamespace: unknown }): ExactResult<AnalysisSnapshot, SnapshotFailure> {
  const manifest = verifyDatasetManifest(input.manifest);
  if (!manifest.ok) return failure("ti_v3_snapshot_unverified", "$.manifest");
  const eligibility = verifyEligibilitySet(input.eligibilitySet);
  if (!eligibility.ok) return failure("ti_v3_snapshot_unverified", "$.eligibilitySet");
  const filter = verifyCanonicalQueryFilter(input.filter);
  if (!filter.ok) return failure("ti_v3_snapshot_unverified", "$.filter");
  const enrichment = validateCanonicalDigest(input.enrichmentSetDigest, "$.enrichmentSetDigest", "enrichment_set");
  if (!enrichment.ok) return enrichment;
  const intent = validateCanonicalTimestamp(input.intentRuleCutoffAt, "$.intentRuleCutoffAt");
  if (!intent.ok) return intent;
  const analysis = validateCanonicalTimestamp(input.analysisCutoffAt, "$.analysisCutoffAt");
  if (!analysis.ok) return analysis;
  if (manifest.value.manifestDigest !== eligibility.value.manifestDigest) return failure("ti_v3_snapshot_manifest_mismatch", "$.eligibilitySet.manifestDigest");
  if (eligibility.value.analysisCutoffAt !== analysis.value || filter.value.analysisCutoffAt !== analysis.value) return failure("ti_v3_snapshot_cutoff_mismatch", "$.analysisCutoffAt");
  if (manifest.value.content.correctionCutoffAt !== filter.value.correctionCutoffAt) return failure("ti_v3_snapshot_mixed_correction_versions", "$.filter.correctionCutoffAt");
  if (filter.value.boundSnapshotDigest !== null) return failure("ti_v3_snapshot_filter_mismatch", "$.filter.boundSnapshotDigest");
  if (intent.value > analysis.value) return failure("ti_v3_snapshot_cutoff_mismatch", "$.intentRuleCutoffAt");
  if (typeof input.evidenceNamespace !== "string" || !/^evidence:[a-z0-9][a-z0-9:_-]{0,191}$/.test(input.evidenceNamespace)) return failure("ti_v3_validation_string_invalid", "$.evidenceNamespace");
  const policyIdentity = createCanonicalContentIdentity("canonical_content", "v1", { policies: manifest.value.content.policies });
  if (!policyIdentity.ok) return failure(policyIdentity.error.code, policyIdentity.error.path);
  const content = {
    schemaVersion: ANALYSIS_SNAPSHOT_VERSION,
    manifestDigest: manifest.value.manifestDigest,
    correctionCutoffAt: manifest.value.content.correctionCutoffAt,
    policySetDigest: policyIdentity.value.identifier,
    policyReferences: manifest.value.content.policies,
    eligibilitySetDigest: eligibility.value.eligibilitySetDigest,
    enrichmentSetDigest: enrichment.value,
    intentRuleCutoffAt: intent.value,
    analysisCutoffAt: analysis.value,
    filterDigest: filter.value.filterDigest,
    evidenceNamespace: input.evidenceNamespace,
  };
  const identity = createCanonicalContentIdentity("analysis_snapshot", "v1", content);
  if (!identity.ok) return failure(identity.error.code, identity.error.path);
  const snapshot = Object.freeze({ ...content, snapshotDigest: identity.value.identifier });
  verifiedSnapshots.add(snapshot);
  return { ok: true, value: snapshot };
}

export function verifyAnalysisSnapshot(input: unknown, dependencies?: { readonly manifest: DatasetManifest; readonly eligibilitySet: EligibilitySet; readonly filter: CanonicalQueryFilter }): ExactResult<AnalysisSnapshot, SnapshotFailure> {
  if (typeof input === "object" && input !== null && verifiedSnapshots.has(input as AnalysisSnapshot)) {
    const snapshot = input as AnalysisSnapshot;
    if (dependencies !== undefined && (snapshot.manifestDigest !== dependencies.manifest.manifestDigest || snapshot.eligibilitySetDigest !== dependencies.eligibilitySet.eligibilitySetDigest || snapshot.filterDigest !== dependencies.filter.filterDigest)) return failure("ti_v3_snapshot_manifest_mismatch", "$");
    return { ok: true, value: snapshot };
  }
  if (dependencies === undefined) return failure("ti_v3_snapshot_unverified", "$");
  const record = validateExactRecord(input, ["schemaVersion", "manifestDigest", "correctionCutoffAt", "policySetDigest", "policyReferences", "eligibilitySetDigest", "enrichmentSetDigest", "intentRuleCutoffAt", "analysisCutoffAt", "filterDigest", "evidenceNamespace", "snapshotDigest"], []);
  if (!record.ok || record.value.schemaVersion !== ANALYSIS_SNAPSHOT_VERSION) return failure("ti_v3_snapshot_unverified", "$.schemaVersion");
  const rebuilt = buildAnalysisSnapshot({ manifest: dependencies.manifest, eligibilitySet: dependencies.eligibilitySet, enrichmentSetDigest: record.value.enrichmentSetDigest, intentRuleCutoffAt: record.value.intentRuleCutoffAt, analysisCutoffAt: record.value.analysisCutoffAt, filter: dependencies.filter, evidenceNamespace: record.value.evidenceNamespace });
  if (!rebuilt.ok || rebuilt.value.snapshotDigest !== record.value.snapshotDigest || rebuilt.value.policySetDigest !== record.value.policySetDigest || rebuilt.value.manifestDigest !== record.value.manifestDigest || rebuilt.value.eligibilitySetDigest !== record.value.eligibilitySetDigest || rebuilt.value.filterDigest !== record.value.filterDigest) return failure("ti_v3_snapshot_unverified", "$.snapshotDigest");
  return rebuilt;
}

export function assertSnapshotExecutionManifest(snapshot: AnalysisSnapshot, executionManifestDigest: CanonicalContentDigest): ExactResult<true, SnapshotFailure> {
  return snapshot.manifestDigest === executionManifestDigest ? { ok: true, value: true } : failure("ti_v3_snapshot_manifest_mismatch", "$.executionManifestDigest");
}
