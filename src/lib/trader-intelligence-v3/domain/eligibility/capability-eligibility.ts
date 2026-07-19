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
import { compareUnicodeCodePoints } from "../canonical";
import { createCanonicalContentIdentity, type CanonicalContentDigest } from "../identity";
import { verifyDatasetManifest, type DatasetManifest } from "../manifest";
import {
  verifyCorrectionApplicationResult,
  verifyRetrospectiveAnalysisPolicy,
  type CorrectionApplicationResult,
  type RetrospectiveAnalysisPolicy,
} from "../temporal";

export const ELIGIBILITY_SET_VERSION = "ti_v3_eligibility_set_v1" as const;

export type AnalysisCapability =
  | "exact_reconstruction"
  | "closed_trade_analytics"
  | "execution_review"
  | "behavioral_analytics"
  | "simulations"
  | "coaching"
  | "ai_explanation"
  | "visual_evidence"
  | "export"
  | "market_enrichment";

export type EligibilityState = "eligible" | "limited" | "blocked" | "pending" | "stale";
export type EligibilityFailureClass = "none" | "terminal" | "retryable" | "stale" | "pending_additional_evidence";

export interface CapabilityEligibility {
  readonly capability: AnalysisCapability;
  readonly state: EligibilityState;
  readonly reasonCodes: readonly string[];
  readonly manifestDigest: CanonicalContentDigest;
  readonly analysisCutoffAt: CanonicalUtcTimestamp;
  readonly evidenceReferences: readonly CanonicalContentDigest[];
  readonly failureClass: EligibilityFailureClass;
}

export interface EligibilitySet {
  readonly schemaVersion: typeof ELIGIBILITY_SET_VERSION;
  readonly manifestDigest: CanonicalContentDigest;
  readonly analysisCutoffAt: CanonicalUtcTimestamp;
  readonly correctionResultDigest: CanonicalContentDigest;
  readonly retrospectivePolicyVersion: string;
  readonly retrospectivePolicyDigest: CanonicalContentDigest;
  readonly openPositionPolicy: RetrospectiveAnalysisPolicy["openPositionPolicy"];
  readonly results: readonly CapabilityEligibility[];
  readonly eligibilitySetDigest: CanonicalContentDigest;
}

export type EligibilityFailure = FoundationValidationFailure | {
  readonly code: "ti_v3_eligibility_inconsistent" | "ti_v3_eligibility_unverified" | "ti_v3_eligibility_dependency_unverified";
  readonly path: string;
};

const CAPABILITIES = new Set<AnalysisCapability>([
  "exact_reconstruction", "closed_trade_analytics", "execution_review",
  "behavioral_analytics", "simulations", "coaching", "ai_explanation",
  "visual_evidence", "export", "market_enrichment",
]);
const STATES = new Set<EligibilityState>(["eligible", "limited", "blocked", "pending", "stale"]);
const FAILURE_CLASSES = new Set<EligibilityFailureClass>(["none", "terminal", "retryable", "stale", "pending_additional_evidence"]);
const verifiedSets = new WeakSet<EligibilitySet>();

function failure(code: EligibilityFailure["code"], path: string): ExactResult<never, EligibilityFailure> {
  return { ok: false, error: { code, path } };
}

function parseResult(input: unknown, path: string): ExactResult<CapabilityEligibility, EligibilityFailure> {
  const record = validateExactRecord(input, ["capability", "state", "reasonCodes", "manifestDigest", "analysisCutoffAt", "evidenceReferences", "failureClass"], [], path);
  if (!record.ok) return record;
  const capability = validateEnum(record.value.capability, CAPABILITIES, `${path}.capability`);
  if (!capability.ok) return capability;
  const state = validateEnum(record.value.state, STATES, `${path}.state`);
  if (!state.ok) return state;
  const reasons = validateStringSet(record.value.reasonCodes, `${path}.reasonCodes`, { pattern: /^ti_v3_[a-z0-9_]{1,120}$/, maxItems: 128 });
  if (!reasons.ok) return reasons;
  const manifest = validateCanonicalDigest(record.value.manifestDigest, `${path}.manifestDigest`, "dataset_manifest");
  if (!manifest.ok) return manifest;
  const cutoff = validateCanonicalTimestamp(record.value.analysisCutoffAt, `${path}.analysisCutoffAt`);
  if (!cutoff.ok) return cutoff;
  const evidenceRaw = validateStringSet(record.value.evidenceReferences, `${path}.evidenceReferences`, { maxItems: 1_000 });
  if (!evidenceRaw.ok) return evidenceRaw;
  const evidence: CanonicalContentDigest[] = [];
  for (let index = 0; index < evidenceRaw.value.length; index += 1) {
    const parsed = validateCanonicalDigest(evidenceRaw.value[index], `${path}.evidenceReferences[${index}]`, "evidence_reference");
    if (!parsed.ok) return parsed;
    evidence.push(parsed.value);
  }
  const failureClass = validateEnum(record.value.failureClass, FAILURE_CLASSES, `${path}.failureClass`);
  if (!failureClass.ok) return failureClass;
  if ((state.value === "eligible") !== (failureClass.value === "none") || (state.value !== "eligible" && reasons.value.length === 0)) {
    return failure("ti_v3_eligibility_inconsistent", path);
  }
  return { ok: true, value: Object.freeze({ capability: capability.value, state: state.value, reasonCodes: canonicalReasonCodes(reasons.value), manifestDigest: manifest.value, analysisCutoffAt: cutoff.value, evidenceReferences: canonicalStringSet(evidence) as readonly CanonicalContentDigest[], failureClass: failureClass.value }) };
}

function buildCalculatedEligibilitySet(input: unknown): ExactResult<EligibilitySet, EligibilityFailure> {
  const record = validateExactRecord(input, ["manifestDigest", "analysisCutoffAt", "correctionResultDigest", "retrospectivePolicyVersion", "retrospectivePolicyDigest", "openPositionPolicy", "results"], []);
  if (!record.ok) return record;
  const manifest = validateCanonicalDigest(record.value.manifestDigest, "$.manifestDigest", "dataset_manifest");
  if (!manifest.ok) return manifest;
  const cutoff = validateCanonicalTimestamp(record.value.analysisCutoffAt, "$.analysisCutoffAt");
  if (!cutoff.ok) return cutoff;
  const correctionResult = validateCanonicalDigest(record.value.correctionResultDigest, "$.correctionResultDigest", "correction_result");
  if (!correctionResult.ok) return correctionResult;
  if (record.value.retrospectivePolicyVersion !== "ti_v3_retrospective_policy_v1") return failure("ti_v3_eligibility_inconsistent", "$.retrospectivePolicyVersion");
  const policyDigest = validateCanonicalDigest(record.value.retrospectivePolicyDigest, "$.retrospectivePolicyDigest", "retrospective_policy");
  if (!policyDigest.ok) return policyDigest;
  if (record.value.openPositionPolicy !== "exclude_from_closed_trade_analytics" && record.value.openPositionPolicy !== "execution_review_only") return failure("ti_v3_eligibility_inconsistent", "$.openPositionPolicy");
  if (!Array.isArray(record.value.results) || record.value.results.length !== CAPABILITIES.size) return failure("ti_v3_validation_array_invalid", "$.results");
  const results: CapabilityEligibility[] = [];
  for (let index = 0; index < record.value.results.length; index += 1) {
    const parsed = parseResult(record.value.results[index], `$.results[${index}]`);
    if (!parsed.ok) return parsed;
    if (parsed.value.manifestDigest !== manifest.value || parsed.value.analysisCutoffAt !== cutoff.value) return failure("ti_v3_eligibility_inconsistent", `$.results[${index}]`);
    results.push(parsed.value);
  }
  if (new Set(results.map((result) => result.capability)).size !== CAPABILITIES.size || [...CAPABILITIES].some((capability) => !results.some((result) => result.capability === capability))) return failure("ti_v3_eligibility_inconsistent", "$.results");
  const content = { schemaVersion: ELIGIBILITY_SET_VERSION, manifestDigest: manifest.value, analysisCutoffAt: cutoff.value, correctionResultDigest: correctionResult.value, retrospectivePolicyVersion: record.value.retrospectivePolicyVersion as EligibilitySet["retrospectivePolicyVersion"], retrospectivePolicyDigest: policyDigest.value, openPositionPolicy: record.value.openPositionPolicy as EligibilitySet["openPositionPolicy"], results: [...results].sort((left, right) => compareUnicodeCodePoints(left.capability, right.capability)) };
  const identity = createCanonicalContentIdentity("eligibility_set", "v1", content);
  if (!identity.ok) return failure(identity.error.code, identity.error.path);
  const set = Object.freeze({ ...content, results: Object.freeze(content.results), eligibilitySetDigest: identity.value.identifier });
  verifiedSets.add(set);
  return { ok: true, value: set };
}

export function calculateManifestEligibility(args: {
  readonly manifest: DatasetManifest;
  readonly retrospectivePolicy: RetrospectiveAnalysisPolicy;
  readonly correctionResult: CorrectionApplicationResult;
  readonly analysisCutoffAt: CanonicalUtcTimestamp;
  readonly requiredEvidenceReferences: readonly CanonicalContentDigest[];
}): ExactResult<EligibilitySet, EligibilityFailure> {
  const manifest = verifyDatasetManifest(args.manifest);
  const policy = verifyRetrospectiveAnalysisPolicy(args.retrospectivePolicy);
  const correction = verifyCorrectionApplicationResult(args.correctionResult);
  if (!manifest.ok) return failure("ti_v3_eligibility_dependency_unverified", "$.manifest");
  if (!policy.ok) return failure("ti_v3_eligibility_dependency_unverified", "$.retrospectivePolicy");
  if (!correction.ok) return failure("ti_v3_eligibility_dependency_unverified", "$.correctionResult");
  if (policy.value.analysisCutoffAt !== args.analysisCutoffAt || policy.value.correctionCutoffAt !== manifest.value.content.correctionCutoffAt || correction.value.correctionCutoffAt !== manifest.value.content.correctionCutoffAt) return failure("ti_v3_eligibility_inconsistent", "$.analysisCutoffAt");
  const expectedPolicyVersion = policy.value.policyVersion.replace("ti_v3_retrospective_policy_", "");
  if (!manifest.value.content.policies.some((reference) =>
    reference.policyKey === "ti_v3_retrospective_policy" &&
    reference.policyVersion === expectedPolicyVersion &&
    reference.policyDigest === policy.value.policyDigest
  )) return failure("ti_v3_eligibility_inconsistent", "$.retrospectivePolicy");
  if (correction.value.activeExecutionDigests.join("\n") !== manifest.value.content.acceptedExecutionDigests.join("\n") || correction.value.appliedCorrectionDigests.join("\n") !== manifest.value.content.correctionDigests.join("\n")) return failure("ti_v3_eligibility_inconsistent", "$.correctionResult");
  const coverage = new Set(args.manifest.content.coverageStates);
  const unresolved = coverage.has("unresolved_correction_present");
  const incomplete = coverage.has("coverage_gap_detected") || coverage.has("prior_inventory_incomplete") || coverage.has("unknown_coverage") || coverage.has("partial_account_period") || coverage.has("multiple_accounts_partial") || policy.value.state === "incomplete_coverage";
  const deleted = coverage.has("deleted_source_present");
  const open = args.manifest.content.openPositions.length > 0;
  const pendingCorrection = policy.value.state === "pending_correction";
  const executionReviewOnly = policy.value.state === "open_position_execution_review_only";
  const coachingProhibited = policy.value.state === "ineligible_for_coaching";
  const evidence = canonicalStringSet(args.requiredEvidenceReferences) as readonly CanonicalContentDigest[];
  const result = (capability: AnalysisCapability, state: EligibilityState, reasons: readonly string[], failureClass: EligibilityFailureClass): CapabilityEligibility => ({ capability, state, reasonCodes: reasons, manifestDigest: args.manifest.manifestDigest, analysisCutoffAt: args.analysisCutoffAt, evidenceReferences: evidence, failureClass });
  const reconstructionBlocked = unresolved || incomplete || pendingCorrection || correction.value.status === "blocked" || args.manifest.content.reconstructionStatus !== "exact";
  const closedTradeBlocked = reconstructionBlocked || executionReviewOnly;
  const policyReason = pendingCorrection
    ? "ti_v3_eligibility_pending_correction"
    : executionReviewOnly
      ? "ti_v3_eligibility_open_positions_execution_review_only"
      : "ti_v3_eligibility_reconstruction_required";
  const results: CapabilityEligibility[] = [
    result("exact_reconstruction", reconstructionBlocked ? "blocked" : "eligible", reconstructionBlocked ? ["ti_v3_eligibility_exact_reconstruction_unavailable"] : [], reconstructionBlocked ? "pending_additional_evidence" : "none"),
    result("closed_trade_analytics", closedTradeBlocked ? "blocked" : open ? "limited" : "eligible", closedTradeBlocked ? [policyReason] : open ? ["ti_v3_eligibility_open_positions_excluded"] : [], closedTradeBlocked || open ? "pending_additional_evidence" : "none"),
    result("execution_review", unresolved || pendingCorrection ? "limited" : "eligible", unresolved || pendingCorrection ? [pendingCorrection ? "ti_v3_eligibility_pending_correction" : "ti_v3_eligibility_unresolved_correction_limited"] : [], unresolved || pendingCorrection ? "pending_additional_evidence" : "none"),
    result("behavioral_analytics", reconstructionBlocked ? "blocked" : "eligible", reconstructionBlocked ? [policyReason] : [], reconstructionBlocked ? "pending_additional_evidence" : "none"),
    result("simulations", reconstructionBlocked || executionReviewOnly ? "blocked" : "eligible", reconstructionBlocked || executionReviewOnly ? [policyReason] : [], reconstructionBlocked || executionReviewOnly ? "pending_additional_evidence" : "none"),
    result("coaching", reconstructionBlocked || unresolved || executionReviewOnly || coachingProhibited ? "blocked" : open ? "limited" : "eligible", reconstructionBlocked || unresolved || executionReviewOnly || coachingProhibited ? [coachingProhibited ? "ti_v3_eligibility_coaching_policy_prohibited" : "ti_v3_eligibility_coaching_truth_incomplete"] : open ? ["ti_v3_eligibility_open_positions_execution_review_only"] : [], reconstructionBlocked || unresolved || executionReviewOnly || coachingProhibited || open ? "pending_additional_evidence" : "none"),
    result("ai_explanation", reconstructionBlocked ? "limited" : "eligible", reconstructionBlocked ? ["ti_v3_eligibility_ai_explanation_limited_to_available_evidence"] : [], reconstructionBlocked ? "pending_additional_evidence" : "none"),
    result("visual_evidence", deleted ? "limited" : "eligible", deleted ? ["ti_v3_eligibility_deleted_source_retained"] : [], deleted ? "pending_additional_evidence" : "none"),
    result("export", "eligible", [], "none"),
    result("market_enrichment", "pending", ["ti_v3_eligibility_enrichment_not_supplied"], "retryable"),
  ];
  return buildCalculatedEligibilitySet({ manifestDigest: args.manifest.manifestDigest, analysisCutoffAt: args.analysisCutoffAt, correctionResultDigest: correction.value.correctionResultDigest, retrospectivePolicyVersion: policy.value.policyVersion, retrospectivePolicyDigest: policy.value.policyDigest, openPositionPolicy: policy.value.openPositionPolicy, results });
}

export function verifyEligibilitySet(input: unknown): ExactResult<EligibilitySet, EligibilityFailure> {
  if (typeof input === "object" && input !== null && verifiedSets.has(input as EligibilitySet)) return { ok: true, value: input as EligibilitySet };
  return failure("ti_v3_eligibility_unverified", "$");
}
