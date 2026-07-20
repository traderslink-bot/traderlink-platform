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
import { buildSyntheticCanonicalExecution } from "../../testing/synthetic-execution-builder";

const availableA = buildSyntheticCanonicalExecution({ executionId: "SYNTH-EXEC-A", brokerExecutionIndex: "1" });
const availableB = buildSyntheticCanonicalExecution({ executionId: "SYNTH-EXEC-B", brokerExecutionIndex: "2" });
const availableC = buildSyntheticCanonicalExecution({ executionId: "SYNTH-EXEC-C", brokerExecutionIndex: "3" });
const executionA = availableA.canonicalContentDigest;
const executionB = availableB.canonicalContentDigest;
const executionC = availableC.canonicalContentDigest;
const catalog = [availableA, availableB, availableC] as const;

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
  supersededAt: string | null;
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
      supersededAt: overrides.supersededAt ?? null,
    },
  });
  expect(built.ok).toBe(true);
  if (!built.ok) throw new Error(built.error.code);
  return built.value;
}

describe("GA0-A3 temporal correction authority", () => {
  it("replays the same valid correction set deterministically under input permutation", () => {
    const first = correction({ supersededAt: "2026-01-02T14:34:00.000000000Z" });
    const second = correction({
      correctionKey: "correction_b",
      targetExecutionDigest: executionB,
      replacementExecutionDigest: executionC,
      supersedesCorrectionKey: "correction_a",
      correctedAt: "2026-01-02T14:34:00.000000000Z",
      recordedAt: "2026-01-02T14:33:30.000000000Z",
    });
    const left = applyCorrectionSet({
      baseActiveExecutionDigests: [executionA],
      availableExecutionCatalog: catalog,
      corrections: [first, second],
      correctionCutoffAt: "2026-01-02T15:00:00.000000000Z",
    });
    const right = applyCorrectionSet({
      baseActiveExecutionDigests: [executionA],
      availableExecutionCatalog: catalog,
      corrections: [second, first],
      correctionCutoffAt: "2026-01-02T15:00:00.000000000Z",
    });
    expect(left).toEqual(right);
    expect(left.ok && left.value.status).toBe("applied");
    expect(left.ok && left.value.activeExecutionDigests).toEqual([executionC]);
  });

  it("retains future corrections outside an as-of cutoff without altering the old replay", () => {
    const result = applyCorrectionSet({
      baseActiveExecutionDigests: [executionA],
      availableExecutionCatalog: catalog,
      corrections: [correction()],
      correctionCutoffAt: "2026-01-02T14:32:30.000000000Z",
    });
    expect(result.ok && result.value.status).toBe("applied");
    expect(result.ok && result.value.activeExecutionDigests).toEqual([executionA]);
    expect(result.ok && result.value.reasonCodes).toContain(
      "ti_v3_correction_outside_snapshot_cutoff",
    );
  });

  it("reconciles supersession evidence with the child and honors cutoffs on both sides", () => {
    const parent = correction({ supersededAt: "2026-01-02T14:34:00.000000000Z" });
    const child = correction({
      correctionKey: "correction_b",
      targetExecutionDigest: executionB,
      replacementExecutionDigest: executionC,
      supersedesCorrectionKey: "correction_a",
      recordedAt: "2026-01-02T14:33:30.000000000Z",
      correctedAt: "2026-01-02T14:34:00.000000000Z",
    });
    const before = applyCorrectionSet({
      baseActiveExecutionDigests: [executionA],
      availableExecutionCatalog: catalog,
      corrections: [child, parent],
      correctionCutoffAt: "2026-01-02T14:33:30.000000000Z",
    });
    const after = applyCorrectionSet({
      baseActiveExecutionDigests: [executionA],
      availableExecutionCatalog: catalog,
      corrections: [parent, child],
      correctionCutoffAt: "2026-01-02T14:34:00.000000000Z",
    });
    expect(before.ok && before.value.status).toBe("applied");
    expect(before.ok && before.value.activeExecutionDigests).toEqual([executionB]);
    expect(after.ok && after.value.status).toBe("applied");
    expect(after.ok && after.value.activeExecutionDigests).toEqual([executionC]);

    const missingSupersession = applyCorrectionSet({
      baseActiveExecutionDigests: [executionA],
      availableExecutionCatalog: catalog,
      corrections: [correction(), child],
      correctionCutoffAt: "2026-01-02T15:00:00.000000000Z",
    });
    const lateSupersession = applyCorrectionSet({
      baseActiveExecutionDigests: [executionA],
      availableExecutionCatalog: catalog,
      corrections: [
        correction({ supersededAt: "2026-01-02T14:35:00.000000000Z" }),
        child,
      ],
      correctionCutoffAt: "2026-01-02T15:00:00.000000000Z",
    });
    const terminalClaim = applyCorrectionSet({
      baseActiveExecutionDigests: [executionA],
      availableExecutionCatalog: catalog,
      corrections: [correction({ supersededAt: "2026-01-02T14:35:00.000000000Z" })],
      correctionCutoffAt: "2026-01-02T15:00:00.000000000Z",
    });
    for (const result of [missingSupersession, lateSupersession, terminalClaim]) {
      expect(result.ok && result.value.status).toBe("blocked");
      expect(result.ok && result.value.reasonCodes).toContain(
        "ti_v3_correction_supersession_mismatch",
      );
    }
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
      baseActiveExecutionDigests: [executionA],
      availableExecutionCatalog: catalog,
      corrections: [cycleA, cycleB],
      correctionCutoffAt: "2026-01-02T15:00:00.000000000Z",
    });
    expect(cycle.ok && cycle.value.status).toBe("blocked");
    expect(cycle.ok && cycle.value.reasonCodes).toContain("ti_v3_correction_cycle");

    const deleted = correction({
      correctionKey: "correction_delete",
      action: "delete",
      replacementExecutionDigest: null,
      supersededAt: "2026-01-02T14:34:00.000000000Z",
    });
    const afterDelete = correction({
      correctionKey: "correction_after_delete",
      targetExecutionDigest: executionA,
      supersedesCorrectionKey: "correction_delete",
      correctedAt: "2026-01-02T14:34:00.000000000Z",
      recordedAt: "2026-01-02T14:33:30.000000000Z",
    });
    const deletedResult = applyCorrectionSet({
      baseActiveExecutionDigests: [executionA],
      availableExecutionCatalog: catalog,
      corrections: [deleted, afterDelete],
      correctionCutoffAt: "2026-01-02T15:00:00.000000000Z",
    });
    expect(deletedResult.ok && deletedResult.value.reasonCodes).toContain(
      "ti_v3_correction_after_deletion",
    );
  });

  it("fails closed for missing replacement catalog entries and cross-target supersession", () => {
    const replace = correction({ supersededAt: "2026-01-02T14:34:00.000000000Z" });
    const missing = applyCorrectionSet({
      baseActiveExecutionDigests: [executionA],
      availableExecutionCatalog: [availableA],
      corrections: [replace],
      correctionCutoffAt: "2026-01-02T15:00:00.000000000Z",
    });
    expect(missing.ok && missing.value.status).toBe("blocked");
    expect(missing.ok && missing.value.reasonCodes).toContain("ti_v3_correction_target_not_found");

    const crossTarget = correction({
      correctionKey: "correction_cross_target",
      targetExecutionDigest: executionC,
      replacementExecutionDigest: executionA,
      supersedesCorrectionKey: "correction_a",
      recordedAt: "2026-01-02T14:33:30.000000000Z",
      correctedAt: "2026-01-02T14:34:00.000000000Z",
    });
    const crossed = applyCorrectionSet({
      baseActiveExecutionDigests: [executionA],
      availableExecutionCatalog: catalog,
      corrections: [replace, crossTarget],
      correctionCutoffAt: "2026-01-02T15:00:00.000000000Z",
    });
    expect(crossed.ok && crossed.value.status).toBe("blocked");
    expect(crossed.ok && crossed.value.reasonCodes).toContain("ti_v3_correction_lineage_mismatch");
  });

  it("rejects non-accepted and lineage-incompatible replacement executions", () => {
    const rejected = buildSyntheticCanonicalExecution({
      executionId: "SYNTH-REJECTED",
      brokerExecutionIndex: "4",
      validation: { state: "rejected", reasonCodes: ["ti_v3_synthetic_rejected"] },
    });
    const quarantined = buildSyntheticCanonicalExecution({
      executionId: "SYNTH-QUARANTINED",
      brokerExecutionIndex: "5",
      validation: { state: "quarantined", reasonCodes: ["ti_v3_synthetic_quarantined"] },
    });
    for (const candidate of [rejected, quarantined]) {
      const result = applyCorrectionSet({
        baseActiveExecutionDigests: [executionA],
        availableExecutionCatalog: [availableA, candidate],
        corrections: [correction({ replacementExecutionDigest: candidate.canonicalContentDigest })],
        correctionCutoffAt: "2026-01-02T15:00:00.000000000Z",
      });
      expect(result).toMatchObject({
        ok: false,
        error: { code: "ti_v3_correction_catalog_execution_not_accepted" },
      });
    }

    const incompatibleCandidates = [
      buildSyntheticCanonicalExecution({
        canonicalOwnerKey: "owner_synthetic_other",
        executionId: "SYNTH-OTHER-OWNER",
        brokerExecutionIndex: "6",
      }),
      buildSyntheticCanonicalExecution({
        canonicalAccountKey: "account_synthetic_other",
        executionId: "SYNTH-OTHER-ACCOUNT",
        brokerExecutionIndex: "7",
      }),
      buildSyntheticCanonicalExecution({
        stableInstrumentKey: "instrument_synthetic_other",
        rawBrokerSymbol: "OTHER",
        executionId: "SYNTH-OTHER-INSTRUMENT",
        brokerExecutionIndex: "8",
      }),
      buildSyntheticCanonicalExecution({
        currency: "CAD",
        charges: [{ kind: "commission", amount: "0.25", currency: "CAD" }],
        executionId: "SYNTH-OTHER-CURRENCY",
        brokerExecutionIndex: "9",
      }),
    ];
    for (const candidate of incompatibleCandidates) {
      const result = applyCorrectionSet({
        baseActiveExecutionDigests: [executionA],
        availableExecutionCatalog: [availableA, candidate],
        corrections: [correction({ replacementExecutionDigest: candidate.canonicalContentDigest })],
        correctionCutoffAt: "2026-01-02T15:00:00.000000000Z",
      });
      expect(result.ok && result.value.status).toBe("blocked");
      expect(result.ok && result.value.reasonCodes).toContain(
        "ti_v3_correction_replacement_incompatible",
      );
    }

    const compatible = applyCorrectionSet({
      baseActiveExecutionDigests: [executionA],
      availableExecutionCatalog: catalog,
      corrections: [correction()],
      correctionCutoffAt: "2026-01-02T15:00:00.000000000Z",
    });
    expect(compatible.ok && compatible.value.status).toBe("applied");
    expect(compatible.ok && compatible.value.activeExecutionDigests).toEqual([executionB]);
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
