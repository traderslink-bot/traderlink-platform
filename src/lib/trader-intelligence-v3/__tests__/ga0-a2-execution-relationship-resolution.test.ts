import { describe, expect, it } from "vitest";

import {
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
  it("creates an opaque exhaustive receipt for every unordered input pair", () => {
    const executions = [
      buildSyntheticCanonicalExecution({ executionId: "SYNTH-A" }),
      buildSyntheticCanonicalExecution({ executionId: "SYNTH-B" }),
      buildSyntheticCanonicalExecution({ executionId: "SYNTH-C" }),
    ];
    const resolution = resolveExecutionRelationships(executions);
    expect(isCompleteExecutionRelationshipResolution(resolution)).toBe(true);
    expect(resolution.coverageReceipt).toMatchObject({
      state: "complete",
      inputExecutionCount: 3,
      expectedPairCount: 3,
      classifiedPairCount: 3,
    });
    expect(resolution.coverageReceipt.pairs).toHaveLength(3);
    expect(Object.isFrozen(resolution)).toBe(true);
    expect(Object.isFrozen(resolution.coverageReceipt.pairs)).toBe(true);
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
    expect(resolution.coverageReceipt.pairs).toHaveLength(3);
    expect(
      resolution.coverageReceipt.pairs.every(
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
          expectedPairCount: 1,
          classifiedPairCount: 0,
          pairs: [],
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
});
