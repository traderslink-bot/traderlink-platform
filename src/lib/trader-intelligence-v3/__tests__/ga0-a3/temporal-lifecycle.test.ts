import { describe, expect, it } from "vitest";

import {
  applyCorrectionSet,
  buildCorrectionRecord,
  buildFactualLifecycleRecord,
  buildRetrospectiveAnalysisPolicy,
  buildReviewDisposition,
  reviewDispositionCannotChangeLifecycle,
  type CorrectionRecord,
} from "../../domain";
import type { CanonicalExecutionDigest } from "../../domain/identity";

const executionA = `ti_v3:canonical_execution:v1:sha256:${"1".repeat(64)}` as CanonicalExecutionDigest;
const executionB = `ti_v3:canonical_execution:v1:sha256:${"2".repeat(64)}` as CanonicalExecutionDigest;
const executionC = `ti_v3:canonical_execution:v1:sha256:${"3".repeat(64)}` as CanonicalExecutionDigest;

function correction(overrides: Partial<{
  correctionKey: string;
  targetExecutionDigest: string;
  replacementExecutionDigest: string | null;
  supersedesCorrectionKey: string | null;
  action: "replace" | "bust" | "delete";
  validEffectiveAt: string;
  observedAt: string;
  recordedAt: string;
  correctedAt: string;
}> = {}): CorrectionRecord {
  const built = buildCorrectionRecord({
    correctionKey: overrides.correctionKey ?? "correction_a",
    targetExecutionDigest: overrides.targetExecutionDigest ?? executionA,
    replacementExecutionDigest:
      overrides.replacementExecutionDigest === undefined ? executionB : overrides.replacementExecutionDigest,
    supersedesCorrectionKey: overrides.supersedesCorrectionKey ?? null,
    action: overrides.action ?? "replace",
    reasonCode: "ti_v3_synthetic_correction",
    temporal: {
      validEffectiveAt: overrides.validEffectiveAt ?? "2026-01-02T14:30:00.000000000Z",
      firstPublicAt: null,
      observedAt: overrides.observedAt ?? "2026-01-02T14:31:00.000000000Z",
      recordedAt: overrides.recordedAt ?? "2026-01-02T14:32:00.000000000Z",
      correctedAt: overrides.correctedAt ?? "2026-01-02T14:33:00.000000000Z",
      supersededAt: null,
    },
  });
  expect(built.ok).toBe(true);
  if (!built.ok) throw new Error(built.error.code);
  return built.value;
}

describe("GA0-A3 temporal correction authority", () => {
  it("replays the same valid correction set deterministically under input permutation", () => {
    const first = correction();
    const second = correction({
      correctionKey: "correction_b",
      replacementExecutionDigest: executionC,
      supersedesCorrectionKey: "correction_a",
      correctedAt: "2026-01-02T14:34:00.000000000Z",
      recordedAt: "2026-01-02T14:33:30.000000000Z",
    });
    const left = applyCorrectionSet({
      executionDigests: [executionA],
      corrections: [first, second],
      correctionCutoffAt: "2026-01-02T15:00:00.000000000Z",
    });
    const right = applyCorrectionSet({
      executionDigests: [executionA],
      corrections: [second, first],
      correctionCutoffAt: "2026-01-02T15:00:00.000000000Z",
    });
    expect(left).toEqual(right);
    expect(left.ok && left.value.status).toBe("applied");
    expect(left.ok && left.value.activeExecutionDigests).toEqual([executionC]);
  });

  it("retains future corrections outside an as-of cutoff without altering the old replay", () => {
    const result = applyCorrectionSet({
      executionDigests: [executionA],
      corrections: [correction()],
      correctionCutoffAt: "2026-01-02T14:32:30.000000000Z",
    });
    expect(result.ok && result.value.status).toBe("applied");
    expect(result.ok && result.value.activeExecutionDigests).toEqual([executionA]);
    expect(result.ok && result.value.reasonCodes).toContain(
      "ti_v3_correction_outside_snapshot_cutoff",
    );
  });

  it("fails closed on contradictory time, cycles, and corrections after deletion", () => {
    const invalid = buildCorrectionRecord({
      correctionKey: "correction_invalid",
      targetExecutionDigest: executionA,
      replacementExecutionDigest: executionB,
      supersedesCorrectionKey: null,
      action: "replace",
      reasonCode: "ti_v3_synthetic_correction",
      temporal: {
        validEffectiveAt: "2026-01-02T14:30:00.000000000Z",
        firstPublicAt: null,
        observedAt: "2026-01-02T14:35:00.000000000Z",
        recordedAt: "2026-01-02T14:34:00.000000000Z",
        correctedAt: "2026-01-02T14:36:00.000000000Z",
        supersededAt: null,
      },
    });
    expect(invalid).toMatchObject({
      ok: false,
      error: { code: "ti_v3_correction_contradictory_temporal_evidence" },
    });

    const cycleA = correction({ correctionKey: "correction_cycle_a", supersedesCorrectionKey: "correction_cycle_b" });
    const cycleB = correction({ correctionKey: "correction_cycle_b", supersedesCorrectionKey: "correction_cycle_a" });
    const cycle = applyCorrectionSet({
      executionDigests: [executionA],
      corrections: [cycleA, cycleB],
      correctionCutoffAt: "2026-01-02T15:00:00.000000000Z",
    });
    expect(cycle.ok && cycle.value.status).toBe("blocked");
    expect(cycle.ok && cycle.value.reasonCodes).toContain("ti_v3_correction_cycle");

    const deleted = correction({
      correctionKey: "correction_delete",
      action: "delete",
      replacementExecutionDigest: null,
    });
    const afterDelete = correction({
      correctionKey: "correction_after_delete",
      supersedesCorrectionKey: "correction_delete",
      correctedAt: "2026-01-02T14:34:00.000000000Z",
      recordedAt: "2026-01-02T14:33:30.000000000Z",
    });
    const deletedResult = applyCorrectionSet({
      executionDigests: [executionA],
      corrections: [deleted, afterDelete],
      correctionCutoffAt: "2026-01-02T15:00:00.000000000Z",
    });
    expect(deletedResult.ok && deletedResult.value.reasonCodes).toContain(
      "ti_v3_correction_after_deletion",
    );
  });
});

describe("GA0-A3 lifecycle and review separation", () => {
  it("keeps review disposition unable to alter factual lifecycle or inventory truth", () => {
    const lifecycle = buildFactualLifecycleRecord({
      executionDigest: executionA,
      state: "position_open",
      effectiveAt: "2026-01-02T14:30:00.000000000Z",
      correctionDigest: null,
    });
    const disposition = buildReviewDisposition({
      executionDigest: executionA,
      states: ["legacy_mark_closed_annotation", "reviewed"],
      recordedAt: "2026-01-02T15:00:00.000000000Z",
      annotationDigest: null,
    });
    expect(lifecycle.ok).toBe(true);
    expect(disposition.ok).toBe(true);
    if (!lifecycle.ok || !disposition.ok) return;
    const before = [lifecycle.value] as const;
    expect(reviewDispositionCannotChangeLifecycle({ before, disposition: disposition.value })).toBe(before);
    expect(before[0].state).toBe("position_open");
  });

  it("makes open-position review execution-only and permanently disables live guidance", () => {
    const policy = buildRetrospectiveAnalysisPolicy({
      state: "open_position_execution_review_only",
      analysisCutoffAt: "2026-01-02T20:00:00.000000000Z",
      correctionCutoffAt: "2026-01-02T19:59:00.000000000Z",
      openPositionPolicy: "execution_review_only",
      includedLifecycleStates: ["execution_accepted", "position_open"],
      excludedLifecycleStates: ["position_closed"],
    });
    expect(policy.ok && policy.value.liveDirectionalGuidanceAllowed).toBe(false);
    expect(policy.ok && policy.value.openPositionPolicy).toBe("execution_review_only");
  });
});
