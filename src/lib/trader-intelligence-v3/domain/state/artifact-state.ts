import type { CanonicalContentDigest } from "../identity";

export type ArtifactFreshnessState =
  | "current"
  | "stale_source"
  | "stale_policy"
  | "stale_eligibility"
  | "stale_enrichment"
  | "superseded"
  | "blocked"
  | "deleted_source"
  | "retryable_failure"
  | "terminal_failure";

export interface InvalidationInput {
  readonly recordedManifestDigest: CanonicalContentDigest;
  readonly currentManifestDigest: CanonicalContentDigest;
  readonly recordedPolicySetDigest: CanonicalContentDigest;
  readonly currentPolicySetDigest: CanonicalContentDigest;
  readonly recordedEligibilitySetDigest: CanonicalContentDigest;
  readonly currentEligibilitySetDigest: CanonicalContentDigest;
  readonly recordedEnrichmentSetDigest: CanonicalContentDigest;
  readonly currentEnrichmentSetDigest: CanonicalContentDigest;
  readonly sourceDeleted: boolean;
  readonly superseded: boolean;
  readonly blocked: boolean;
  readonly retryableFailure: boolean;
  readonly terminalFailure: boolean;
}

export interface InvalidationResult {
  readonly state: ArtifactFreshnessState;
  readonly reasonCode: string;
}

export function calculateArtifactState(input: InvalidationInput): InvalidationResult {
  if (input.terminalFailure) return { state: "terminal_failure", reasonCode: "ti_v3_state_terminal_failure" };
  if (input.blocked) return { state: "blocked", reasonCode: "ti_v3_state_blocked" };
  if (input.sourceDeleted) return { state: "deleted_source", reasonCode: "ti_v3_state_deleted_source_retained" };
  if (input.superseded) return { state: "superseded", reasonCode: "ti_v3_state_superseded" };
  if (input.recordedManifestDigest !== input.currentManifestDigest) return { state: "stale_source", reasonCode: "ti_v3_state_manifest_changed" };
  if (input.recordedPolicySetDigest !== input.currentPolicySetDigest) return { state: "stale_policy", reasonCode: "ti_v3_state_policy_changed" };
  if (input.recordedEligibilitySetDigest !== input.currentEligibilitySetDigest) return { state: "stale_eligibility", reasonCode: "ti_v3_state_eligibility_changed" };
  if (input.recordedEnrichmentSetDigest !== input.currentEnrichmentSetDigest) return { state: "stale_enrichment", reasonCode: "ti_v3_state_enrichment_changed" };
  if (input.retryableFailure) return { state: "retryable_failure", reasonCode: "ti_v3_state_retryable_failure" };
  return { state: "current", reasonCode: "ti_v3_state_current" };
}

export function equivalentPersistenceIdentityIsCurrent(recordedManifestDigest: CanonicalContentDigest, reimportedManifestDigest: CanonicalContentDigest): boolean {
  return recordedManifestDigest === reimportedManifestDigest;
}
