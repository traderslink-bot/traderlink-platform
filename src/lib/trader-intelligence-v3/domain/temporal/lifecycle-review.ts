import type { CanonicalUtcTimestamp } from "../canonical";
import type { ExactResult } from "../exact";
import {
  canonicalStringSet,
  validateCanonicalDigest,
  validateCanonicalTimestamp,
  validateEnum,
  validateExactRecord,
  validateStringSet,
  type FoundationValidationFailure,
} from "../foundation";
import type { CanonicalContentDigest, CanonicalExecutionDigest } from "../identity";

export type FactualLifecycleState =
  | "execution_accepted"
  | "execution_corrected"
  | "execution_busted"
  | "execution_superseded"
  | "position_open"
  | "position_closed"
  | "correction_pending"
  | "source_deleted";

export type ReviewDispositionState =
  | "unreviewed"
  | "reviewed"
  | "owner_annotation_present"
  | "excluded_from_coaching"
  | "disputed"
  | "needs_evidence"
  | "legacy_mark_closed_annotation";

export interface FactualLifecycleRecord {
  readonly executionDigest: CanonicalExecutionDigest;
  readonly state: FactualLifecycleState;
  readonly effectiveAt: CanonicalUtcTimestamp;
  readonly correctionDigest: CanonicalContentDigest | null;
}

export interface ReviewDisposition {
  readonly executionDigest: CanonicalExecutionDigest;
  readonly states: readonly ReviewDispositionState[];
  readonly recordedAt: CanonicalUtcTimestamp;
  readonly annotationDigest: CanonicalContentDigest | null;
}

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
const REVIEW_STATES = new Set<ReviewDispositionState>([
  "unreviewed",
  "reviewed",
  "owner_annotation_present",
  "excluded_from_coaching",
  "disputed",
  "needs_evidence",
  "legacy_mark_closed_annotation",
]);

type LifecycleFailure = FoundationValidationFailure;

export function buildFactualLifecycleRecord(
  input: unknown,
): ExactResult<FactualLifecycleRecord, LifecycleFailure> {
  const record = validateExactRecord(
    input,
    ["executionDigest", "state", "effectiveAt", "correctionDigest"],
    [],
  );
  if (!record.ok) return record;
  const execution = validateCanonicalDigest(record.value.executionDigest, "$.executionDigest", "canonical_execution");
  if (!execution.ok) return execution;
  const state = validateEnum(record.value.state, LIFECYCLE_STATES, "$.state");
  if (!state.ok) return state;
  const effectiveAt = validateCanonicalTimestamp(record.value.effectiveAt, "$.effectiveAt");
  if (!effectiveAt.ok) return effectiveAt;
  let correction: CanonicalContentDigest | null = null;
  if (record.value.correctionDigest !== null) {
    const parsed = validateCanonicalDigest(record.value.correctionDigest, "$.correctionDigest", "correction_record");
    if (!parsed.ok) return parsed;
    correction = parsed.value;
  }
  if (state.value === "execution_accepted" && correction !== null) {
    return { ok: false, error: { code: "ti_v3_validation_input_invalid", path: "$.correctionDigest" } };
  }
  return {
    ok: true,
    value: Object.freeze({
      executionDigest: execution.value as CanonicalExecutionDigest,
      state: state.value,
      effectiveAt: effectiveAt.value,
      correctionDigest: correction,
    }),
  };
}

export function buildReviewDisposition(
  input: unknown,
): ExactResult<ReviewDisposition, LifecycleFailure> {
  const record = validateExactRecord(
    input,
    ["executionDigest", "states", "recordedAt", "annotationDigest"],
    [],
  );
  if (!record.ok) return record;
  const execution = validateCanonicalDigest(record.value.executionDigest, "$.executionDigest", "canonical_execution");
  if (!execution.ok) return execution;
  const states = validateStringSet(record.value.states, "$.states", { maxItems: REVIEW_STATES.size });
  if (!states.ok) return states;
  if (states.value.length === 0 || states.value.some((state) => !REVIEW_STATES.has(state as ReviewDispositionState))) {
    return { ok: false, error: { code: "ti_v3_validation_enum_invalid", path: "$.states" } };
  }
  if (states.value.includes("unreviewed") && states.value.length > 1) {
    return { ok: false, error: { code: "ti_v3_validation_input_invalid", path: "$.states" } };
  }
  const recordedAt = validateCanonicalTimestamp(record.value.recordedAt, "$.recordedAt");
  if (!recordedAt.ok) return recordedAt;
  let annotation: CanonicalContentDigest | null = null;
  if (record.value.annotationDigest !== null) {
    const parsed = validateCanonicalDigest(record.value.annotationDigest, "$.annotationDigest");
    if (!parsed.ok) return parsed;
    annotation = parsed.value;
  }
  if (
    states.value.includes("owner_annotation_present") !== (annotation !== null)
  ) {
    return { ok: false, error: { code: "ti_v3_validation_input_invalid", path: "$.annotationDigest" } };
  }
  return {
    ok: true,
    value: Object.freeze({
      executionDigest: execution.value as CanonicalExecutionDigest,
      states: canonicalStringSet(states.value) as readonly ReviewDispositionState[],
      recordedAt: recordedAt.value,
      annotationDigest: annotation,
    }),
  };
}

export function reviewDispositionCannotChangeLifecycle(args: {
  readonly before: readonly FactualLifecycleRecord[];
  readonly disposition: ReviewDisposition;
}): readonly FactualLifecycleRecord[] {
  return args.before;
}

