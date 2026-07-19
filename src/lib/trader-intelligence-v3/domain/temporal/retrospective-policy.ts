import type { CanonicalUtcTimestamp } from "../canonical";
import type { ExactResult } from "../exact";
import {
  canonicalStringSet,
  validateCanonicalTimestamp,
  validateEnum,
  validateExactRecord,
  validateStringSet,
  type FoundationValidationFailure,
} from "../foundation";
import type { FactualLifecycleState } from "./lifecycle-review";

export const RETROSPECTIVE_POLICY_VERSION = "ti_v3_retrospective_policy_v1" as const;

export type RetrospectivePolicyState =
  | "closed_historical_trade"
  | "same_day_closed_trade"
  | "open_position_execution_review_only"
  | "pending_correction"
  | "incomplete_coverage"
  | "ineligible_for_coaching";

export type OpenPositionPolicy =
  | "exclude_from_closed_trade_analytics"
  | "execution_review_only";

export interface RetrospectiveAnalysisPolicy {
  readonly policyVersion: typeof RETROSPECTIVE_POLICY_VERSION;
  readonly state: RetrospectivePolicyState;
  readonly analysisCutoffAt: CanonicalUtcTimestamp;
  readonly correctionCutoffAt: CanonicalUtcTimestamp;
  readonly openPositionPolicy: OpenPositionPolicy;
  readonly includedLifecycleStates: readonly FactualLifecycleState[];
  readonly excludedLifecycleStates: readonly FactualLifecycleState[];
  readonly liveDirectionalGuidanceAllowed: false;
}

const verifiedRetrospectivePolicies = new WeakSet<RetrospectiveAnalysisPolicy>();

const POLICY_STATES = new Set<RetrospectivePolicyState>([
  "closed_historical_trade",
  "same_day_closed_trade",
  "open_position_execution_review_only",
  "pending_correction",
  "incomplete_coverage",
  "ineligible_for_coaching",
]);
const OPEN_POLICIES = new Set<OpenPositionPolicy>([
  "exclude_from_closed_trade_analytics",
  "execution_review_only",
]);
const LIFECYCLE_STATES = new Set<FactualLifecycleState>([
  "execution_accepted",
  "execution_corrected",
  "execution_busted",
  "execution_superseded",
  "position_open",
  "position_closed",
  "correction_pending",
  "source_deleted",
]);

export function buildRetrospectiveAnalysisPolicy(
  input: unknown,
): ExactResult<RetrospectiveAnalysisPolicy, FoundationValidationFailure> {
  const record = validateExactRecord(
    input,
    [
      "state",
      "analysisCutoffAt",
      "correctionCutoffAt",
      "openPositionPolicy",
      "includedLifecycleStates",
      "excludedLifecycleStates",
    ],
    [],
  );
  if (!record.ok) return record;
  const state = validateEnum(record.value.state, POLICY_STATES, "$.state");
  if (!state.ok) return state;
  const analysis = validateCanonicalTimestamp(record.value.analysisCutoffAt, "$.analysisCutoffAt");
  if (!analysis.ok) return analysis;
  const correction = validateCanonicalTimestamp(record.value.correctionCutoffAt, "$.correctionCutoffAt");
  if (!correction.ok) return correction;
  if (correction.value > analysis.value) {
    return { ok: false, error: { code: "ti_v3_validation_temporal_order_invalid", path: "$.correctionCutoffAt" } };
  }
  const openPolicy = validateEnum(record.value.openPositionPolicy, OPEN_POLICIES, "$.openPositionPolicy");
  if (!openPolicy.ok) return openPolicy;
  const included = validateStringSet(record.value.includedLifecycleStates, "$.includedLifecycleStates", { maxItems: LIFECYCLE_STATES.size });
  if (!included.ok) return included;
  const excluded = validateStringSet(record.value.excludedLifecycleStates, "$.excludedLifecycleStates", { maxItems: LIFECYCLE_STATES.size });
  if (!excluded.ok) return excluded;
  if (
    [...included.value, ...excluded.value].some((value) => !LIFECYCLE_STATES.has(value as FactualLifecycleState)) ||
    included.value.some((value) => excluded.value.includes(value))
  ) {
    return { ok: false, error: { code: "ti_v3_validation_input_invalid", path: "$.includedLifecycleStates" } };
  }
  if (
    state.value === "open_position_execution_review_only" &&
    openPolicy.value !== "execution_review_only"
  ) {
    return { ok: false, error: { code: "ti_v3_validation_input_invalid", path: "$.openPositionPolicy" } };
  }
  const value = Object.freeze({
      policyVersion: RETROSPECTIVE_POLICY_VERSION,
      state: state.value,
      analysisCutoffAt: analysis.value,
      correctionCutoffAt: correction.value,
      openPositionPolicy: openPolicy.value,
      includedLifecycleStates: canonicalStringSet(included.value) as readonly FactualLifecycleState[],
      excludedLifecycleStates: canonicalStringSet(excluded.value) as readonly FactualLifecycleState[],
      liveDirectionalGuidanceAllowed: false,
    });
  verifiedRetrospectivePolicies.add(value);
  return { ok: true, value };
}

export function verifyRetrospectiveAnalysisPolicy(
  input: unknown,
): ExactResult<RetrospectiveAnalysisPolicy, FoundationValidationFailure> {
  if (typeof input !== "object" || input === null || !verifiedRetrospectivePolicies.has(input as RetrospectiveAnalysisPolicy)) {
    return { ok: false, error: { code: "ti_v3_validation_input_invalid", path: "$" } };
  }
  return { ok: true, value: input as RetrospectiveAnalysisPolicy };
}
