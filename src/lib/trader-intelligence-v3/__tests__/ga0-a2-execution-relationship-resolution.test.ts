import { describe, expect, it } from "vitest";

import {
  EXECUTION_RELATIONSHIP_RESOURCE_LIMITS,
  isCompleteExecutionRelationshipResolution,
  reconstructAnalyticalPnl,
  resolveExecutionRelationships,
  type AnalyticalPnlReconstructionInput,
  type CanonicalExecutionEnvelope,
} from "../domain";
import {
  buildSyntheticAnalyticalPnlInput,
  buildSyntheticCanonicalExecution,
  syntheticSourceDocumentDigest,
} from "../testing";

function closingExecution() {
  return buildSyntheticCanonicalExecution({
    executedAt: "2026-07-18T13:45:13.000000000Z",
    timestampPrecision: "second",
    side: "sell",
    executionId: "SYNTH-CLOSE",
    brokerExecutionIndex: "2",
    brokerFillSequence: "2",
    originalSourceRowLocator: {
      kind: "row_number",
      value: "2",
      rowOrderPreserved: true,
    },
    charges: [],
  });
}

describe("Trader Intelligence v3 execution relationship resolution", () => {
  it("creates an opaque compact completeness receipt without materializing default-distinct pairs", () => {
    const executions = ["A", "B", "C"].map((token) =>
      buildSyntheticCanonicalExecution({
        executionId: `SYNTH-${token}`,
        originalSourceRowLocator: {
          kind: "record_key",
          value: `ordinary-${token.toLowerCase()}`,
          rowOrderPreserved: false,
        },
        brokerExecutionIndex: null,
        brokerFillSequence: null,
      }),
    );
    const resolution = resolveExecutionRelationships(executions);
    expect(isCompleteExecutionRelationshipResolution(resolution)).toBe(true);
    expect(resolution.coverageReceipt).toMatchObject({
      state: "complete",
      inputExecutionCount: 3,
      candidateRelationshipCount: 0,
      classifiedCandidateCount: 0,
      defaultDistinctPairCount: "3",
      defaultDistinctProof: "absence_from_all_conservative_candidate_indexes",
    });
    expect(resolution.coverageReceipt.candidateRelationships).toHaveLength(0);
    expect(resolution.coverageReceipt).not.toHaveProperty("pairs");
    expect(Object.isFrozen(resolution)).toBe(true);
    expect(Object.isFrozen(resolution.coverageReceipt.candidateRelationships)).toBe(
      true,
    );
  });

  it("automatically suppresses only proven exact same-source duplicate occurrences", () => {
    const opening = buildSyntheticCanonicalExecution({ charges: [] });
    const input = buildSyntheticAnalyticalPnlInput([
      opening,
      opening,
      closingExecution(),
    ]);
    expect(input.relationshipResolution.retainedExecutions).toHaveLength(2);
    const result = reconstructAnalyticalPnl(input);
    expect(result).toMatchObject({
      status: "completed",
      ledgers: [{ endingQuantity: "0", grossRealizedPnl: "0" }],
    });
  });

  it("retains one deterministic occurrence across three exact duplicates", () => {
    const opening = buildSyntheticCanonicalExecution({ charges: [] });
    const resolution = resolveExecutionRelationships([opening, opening, opening]);
    expect(resolution.retainedExecutions).toEqual([opening]);
    expect(resolution.coverageReceipt.candidateRelationships).toHaveLength(3);
    expect(
      resolution.coverageReceipt.candidateRelationships.every(
        (pair) => pair.classification.suppressionEligible,
      ),
    ).toBe(true);
  });

  it("blocks a re-export without caller-supplied relationship data", () => {
    const original = buildSyntheticCanonicalExecution({ charges: [] });
    const reexport = buildSyntheticCanonicalExecution({
      sourceDocumentDigest: syntheticSourceDocumentDigest("resolver-reexport"),
      originalSourceRowLocator: {
        kind: "row_number",
        value: "8",
        rowOrderPreserved: true,
      },
      charges: [],
    });
    expect(
      reconstructAnalyticalPnl(
        buildSyntheticAnalyticalPnlInput([original, reexport]),
      ).blockedStates,
    ).toEqual([
      expect.objectContaining({ code: "ti_v3_reconstruction_reexport_unresolved" }),
    ]);
  });

  it("blocks possible duplicates and manual-review states without optional pairs", () => {
    const first = buildSyntheticCanonicalExecution({
      executionId: null,
      brokerExecutionIndex: null,
      brokerFillSequence: null,
      charges: [],
      originalSourceRowLocator: {
        kind: "record_key",
        value: "possible-a",
        rowOrderPreserved: false,
      },
    });
    const possible = buildSyntheticCanonicalExecution({
      executionId: null,
      brokerExecutionIndex: null,
      brokerFillSequence: null,
      charges: [],
      originalSourceRowLocator: {
        kind: "record_key",
        value: "possible-b",
        rowOrderPreserved: false,
      },
    });
    expect(
      reconstructAnalyticalPnl(
        buildSyntheticAnalyticalPnlInput([first, possible]),
      ).blockedStates,
    ).toEqual([
      expect.objectContaining({
        code: "ti_v3_reconstruction_possible_duplicate_unresolved",
      }),
    ]);

    const moved = buildSyntheticCanonicalExecution({
      charges: [],
      originalSourceRowLocator: {
        kind: "row_number",
        value: "99",
        rowOrderPreserved: true,
      },
    });
    expect(
      reconstructAnalyticalPnl(
        buildSyntheticAnalyticalPnlInput([
          buildSyntheticCanonicalExecution({ charges: [] }),
          moved,
        ]),
      ).blockedStates,
    ).toEqual([
      expect.objectContaining({
        code: "ti_v3_reconstruction_manual_review_required",
      }),
    ]);
  });

  it("retains both legitimate repeated fills", () => {
    const first = buildSyntheticCanonicalExecution({
      executionId: "SYNTH-LEGITIMATE-A",
      brokerExecutionIndex: null,
      brokerFillSequence: null,
      charges: [],
      originalSourceRowLocator: {
        kind: "record_key",
        value: "legitimate-a",
        rowOrderPreserved: false,
      },
    });
    const second = buildSyntheticCanonicalExecution({
      executionId: "SYNTH-LEGITIMATE-B",
      brokerExecutionIndex: null,
      brokerFillSequence: null,
      charges: [],
      originalSourceRowLocator: {
        kind: "record_key",
        value: "legitimate-b",
        rowOrderPreserved: false,
      },
    });
    expect(
      reconstructAnalyticalPnl(
        buildSyntheticAnalyticalPnlInput([first, second]),
      ),
    ).toMatchObject({
      status: "completed",
      ledgers: [{ endingQuantity: "20" }],
    });
  });

  it("rejects forged or incomplete relationship coverage at accounting entry", () => {
    const execution = buildSyntheticCanonicalExecution({ charges: [] });
    const valid = buildSyntheticAnalyticalPnlInput([execution]);
    const forgedInput = {
      ...valid,
      relationshipResolution: {
        ...valid.relationshipResolution,
        coverageReceipt: {
          ...valid.relationshipResolution.coverageReceipt,
          state: "complete",
          candidateRelationshipCount: 1,
          classifiedCandidateCount: 0,
          candidateRelationships: [],
        },
      },
    } as unknown as AnalyticalPnlReconstructionInput;
    expect(reconstructAnalyticalPnl(forgedInput)).toMatchObject({
      status: "blocked",
      ledgers: [],
      blockedStates: [
        { code: "ti_v3_reconstruction_relationship_coverage_incomplete" },
      ],
    });
  });

  it("fails closed when a forged envelope reaches relationship resolution", () => {
    const execution = buildSyntheticCanonicalExecution({ charges: [] });
    const forged = {
      ...execution,
      content: { ...execution.content, price: "99" },
    } as CanonicalExecutionEnvelope;
    const resolution = resolveExecutionRelationships([forged]);
    expect(resolution).toMatchObject({
      retainedExecutions: [],
      coverageReceipt: { state: "blocked_invalid_input" },
      globalBlocks: [
        { code: "ti_v3_reconstruction_execution_envelope_integrity_invalid" },
      ],
    });
  });

  it("deterministically retains neither side of a validation disagreement by suppression", () => {
    const accepted = buildSyntheticCanonicalExecution({ charges: [] });
    const quarantined = buildSyntheticCanonicalExecution({
      charges: [],
      validation: {
        state: "quarantined",
        reasonCodes: ["ti_v3_synthetic_quarantine"],
      },
    });
    for (const executions of [
      [accepted, quarantined],
      [quarantined, accepted],
    ]) {
      const resolution = resolveExecutionRelationships(executions);
      expect(resolution.retainedExecutions).toHaveLength(2);
      expect(resolution.groupBlocks).toEqual([
        expect.objectContaining({
          code: "ti_v3_reconstruction_manual_review_required",
        }),
      ]);
    }
  });

  it("blocks only the affected ledger group for changed stable execution facts", () => {
    const original = buildSyntheticCanonicalExecution({ charges: [] });
    const changed = buildSyntheticCanonicalExecution({ price: "1.3", charges: [] });
    const unrelated = buildSyntheticCanonicalExecution({
      stableInstrumentKey: "instrument_synthetic_unrelated",
      rawBrokerSymbol: "OTHER",
      executionId: "SYNTH-UNRELATED",
      charges: [],
    });
    const result = reconstructAnalyticalPnl(
      buildSyntheticAnalyticalPnlInput([original, changed, unrelated]),
    );
    expect(result.status).toBe("blocked");
    expect(result.blockedStates).toEqual([
      expect.objectContaining({ code: "ti_v3_reconstruction_correction_unresolved" }),
    ]);
    expect(result.ledgers).toHaveLength(1);
    expect(result.ledgers[0].stableInstrumentKey).toBe(
      "instrument_synthetic_unrelated",
    );
  });

  it("keeps distinct currencies covered and separated without a cross-group block", () => {
    const usd = buildSyntheticCanonicalExecution({ charges: [] });
    const cad = buildSyntheticCanonicalExecution({
      currency: "CAD",
      stableInstrumentKey: "instrument_synthetic_cad",
      executionId: "SYNTH-CAD",
      charges: [],
    });
    const result = reconstructAnalyticalPnl(
      buildSyntheticAnalyticalPnlInput([usd, cad]),
    );
    expect(result.status).toBe("completed");
    expect(result.ledgers.map((ledger) => ledger.currency).sort()).toEqual([
      "CAD",
      "USD",
    ]);
  });

  it.each(["correction", "bust"] as const)(
    "blocks an unresolved %s only in its own instrument and currency group",
    (correctionState) => {
      const affected = buildSyntheticCanonicalExecution({
        correctionState,
        correctionReference: "SYNTH-AFFECTED-ORIGINAL",
        executionId: "SYNTH-AFFECTED-REPLACEMENT",
        charges: [],
      });
      const unrelated = buildSyntheticCanonicalExecution({
        currency: "CAD",
        stableInstrumentKey: "instrument_synthetic_cad_unrelated",
        rawBrokerSymbol: "CADX",
        executionId: "SYNTH-CAD-UNRELATED",
        charges: [],
      });
      const result = reconstructAnalyticalPnl(
        buildSyntheticAnalyticalPnlInput([affected, unrelated]),
      );
      expect(result.blockedStates).toEqual([
        expect.objectContaining({
          code: "ti_v3_reconstruction_correction_unresolved",
          relatedExecutionDigests: [affected.canonicalContentDigest],
        }),
      ]);
      expect(result.ledgers).toHaveLength(1);
      expect(result.ledgers[0]).toMatchObject({
        stableInstrumentKey: "instrument_synthetic_cad_unrelated",
        currency: "CAD",
      });
    },
  );

  it("produces the same compact receipt and retained facts under caller permutation", () => {
    const executions = ["A", "B", "C"].map((token) =>
      buildSyntheticCanonicalExecution({
        executionId: `SYNTH-PERMUTE-${token}`,
        originalSourceRowLocator: {
          kind: "record_key",
          value: `permute-${token.toLowerCase()}`,
          rowOrderPreserved: false,
        },
      }),
    );
    const forward = resolveExecutionRelationships(executions);
    const reverse = resolveExecutionRelationships([...executions].reverse());
    expect(reverse.coverageReceipt).toEqual(forward.coverageReceipt);
    expect(
      reverse.retainedExecutions.map((execution) => execution.canonicalContentDigest),
    ).toEqual(
      forward.retainedExecutions.map((execution) => execution.canonicalContentDigest),
    );
  });

  it("fails with a stable resource-limit state for a candidate-heavy partition", () => {
    const execution = buildSyntheticCanonicalExecution({ charges: [] });
    const inputCount = 710;
    const resolution = resolveExecutionRelationships(
      Array.from({ length: inputCount }, () => execution),
    );
    expect(
      (inputCount * (inputCount - 1)) / 2,
    ).toBeGreaterThan(EXECUTION_RELATIONSHIP_RESOURCE_LIMITS.maximumCandidatePairs);
    expect(resolution).toMatchObject({
      retainedExecutions: [],
      coverageReceipt: {
        state: "blocked_resource_limit",
        candidateRelationships: [],
      },
      globalBlocks: [
        { code: "ti_v3_reconstruction_relationship_resource_limit" },
      ],
    });
    expect(resolution.coverageReceipt).not.toHaveProperty("pairs");
  });

  it("resolves 10,000 ordinary distinct executions within the declared structural and resource budget", () => {
    const count = 10_000;
    const executions = Array.from({ length: count }, (_, index) => {
      const token = index.toString().padStart(5, "0");
      return buildSyntheticCanonicalExecution({
        executionId: `SYNTH-SCALE-${token}`,
        originalSourceRowLocator: {
          kind: "record_key",
          value: `scale-${token}`,
          rowOrderPreserved: false,
        },
        brokerExecutionIndex: null,
        brokerFillSequence: null,
        charges: [],
      });
    });
    const before = process.memoryUsage();
    const startedAt = performance.now();
    const resolution = resolveExecutionRelationships(executions);
    const elapsedMilliseconds = Math.ceil(performance.now() - startedAt);
    const after = process.memoryUsage();
    const observedRssDeltaBytes = Math.max(0, after.rss - before.rss);
    console.info(
      JSON.stringify({
        event: "ti_v3_ga0_a2_relationship_scale",
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        inputCount: count,
        elapsedMilliseconds,
        observedRssDeltaBytes,
        elapsedThresholdMilliseconds: 120_000,
        observedRssDeltaThresholdBytes: 805_306_368,
      }),
    );
    expect(resolution.coverageReceipt).toMatchObject({
      state: "complete",
      inputExecutionCount: count,
      candidateRelationshipCount: 0,
      classifiedCandidateCount: 0,
      defaultDistinctPairCount: "49995000",
    });
    expect(resolution.coverageReceipt.candidateRelationships).toEqual([]);
    expect(resolution.coverageReceipt).not.toHaveProperty("pairs");
    expect(elapsedMilliseconds).toBeLessThan(120_000);
    expect(observedRssDeltaBytes).toBeLessThan(805_306_368);
  }, 180_000);
});
