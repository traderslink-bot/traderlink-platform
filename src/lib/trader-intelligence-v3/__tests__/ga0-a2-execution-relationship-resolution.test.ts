import { describe, expect, it } from "vitest";

import {
  classifyExecutionRelationship,
  reconstructAnalyticalPnl,
  type CanonicalExecutionDigest,
} from "../domain";
import {
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
  it("suppresses one occurrence only for a proven pair-addressed exact duplicate", () => {
    const opening = buildSyntheticCanonicalExecution({ charges: [] });
    const relationship = classifyExecutionRelationship(opening, opening);
    const result = reconstructAnalyticalPnl(
      [opening, opening, closingExecution()],
      [relationship],
    );
    expect(result.status).toBe("completed");
    expect(result.ledgers[0]).toMatchObject({
      endingQuantity: "0",
      grossRealizedPnl: "0",
    });
    expect(result.ledgers[0].inputExecutionDigests).toHaveLength(2);
  });

  it("blocks repeated identical content when the duplicate relationship is absent", () => {
    const opening = buildSyntheticCanonicalExecution({ charges: [] });
    const result = reconstructAnalyticalPnl([opening, opening, closingExecution()]);
    expect(result).toMatchObject({
      status: "blocked",
      blockedStates: [
        { code: "ti_v3_reconstruction_duplicate_relationship_missing" },
      ],
    });
    expect(result.ledgers).toHaveLength(0);
  });

  it("requires one proven pair relationship for each suppressed occurrence", () => {
    const opening = buildSyntheticCanonicalExecution({ charges: [] });
    const relationship = classifyExecutionRelationship(opening, opening);
    const result = reconstructAnalyticalPnl(
      [opening, opening, opening, closingExecution()],
      [relationship],
    );
    expect(result).toMatchObject({
      status: "blocked",
      blockedStates: [
        { code: "ti_v3_reconstruction_duplicate_relationship_missing" },
      ],
    });
  });

  it("blocks a re-export instead of silently suppressing it", () => {
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
    const result = reconstructAnalyticalPnl(
      [original, reexport],
      [classifyExecutionRelationship(original, reexport)],
    );
    expect(result.blockedStates).toEqual([
      expect.objectContaining({ code: "ti_v3_reconstruction_reexport_unresolved" }),
    ]);
  });

  it("prevents a possible duplicate from reaching P/L", () => {
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
    const second = buildSyntheticCanonicalExecution({
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
    const relationship = classifyExecutionRelationship(first, second);
    expect(relationship.state).toBe("possible_duplicate_ambiguous");
    expect(reconstructAnalyticalPnl([first, second], [relationship])).toMatchObject({
      status: "blocked",
      blockedStates: [
        { code: "ti_v3_reconstruction_possible_duplicate_unresolved" },
      ],
    });
  });

  it("prevents a manual-review relationship from reaching P/L", () => {
    const first = buildSyntheticCanonicalExecution({ charges: [] });
    const moved = buildSyntheticCanonicalExecution({
      charges: [],
      originalSourceRowLocator: {
        kind: "row_number",
        value: "99",
        rowOrderPreserved: true,
      },
    });
    const relationship = classifyExecutionRelationship(first, moved);
    expect(relationship.state).toBe("manual_review_required");
    expect(reconstructAnalyticalPnl([first, moved], [relationship])).toMatchObject({
      status: "blocked",
      blockedStates: [
        { code: "ti_v3_reconstruction_manual_review_required" },
      ],
    });
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
    const relationship = classifyExecutionRelationship(first, second);
    expect(relationship.state).toBe("legitimate_repeated_fill");
    expect(reconstructAnalyticalPnl([first, second], [relationship])).toMatchObject({
      status: "completed",
      ledgers: [{ endingQuantity: "20" }],
    });
  });

  it("fails closed for a forged relationship classification", () => {
    const opening = buildSyntheticCanonicalExecution({ charges: [] });
    const close = closingExecution();
    const computed = classifyExecutionRelationship(opening, close);
    const result = reconstructAnalyticalPnl([opening, close], [
      { ...computed, state: "exact_duplicate_same_source", suppressionEligible: true },
    ]);
    expect(result.blockedStates).toEqual([
      expect.objectContaining({
        code: "ti_v3_reconstruction_relationship_classification_mismatch",
      }),
    ]);
  });

  it("fails closed when relationship digests do not identify input executions", () => {
    const opening = buildSyntheticCanonicalExecution({ charges: [] });
    const computed = classifyExecutionRelationship(opening, opening);
    const result = reconstructAnalyticalPnl([opening], [
      {
        ...computed,
        rightExecutionDigest:
          "ti_v3:canonical_execution:v1:sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" as CanonicalExecutionDigest,
      },
    ]);
    expect(result).toMatchObject({
      status: "blocked",
      ledgers: [],
      blockedStates: [
        { code: "ti_v3_reconstruction_relationship_unknown_execution" },
      ],
    });
  });

  it("blocks only the affected ledger group for correction evidence", () => {
    const original = buildSyntheticCanonicalExecution({ charges: [] });
    const changed = buildSyntheticCanonicalExecution({ price: "1.3", charges: [] });
    const unrelated = buildSyntheticCanonicalExecution({
      stableInstrumentKey: "instrument_synthetic_unrelated",
      rawBrokerSymbol: "OTHER",
      executionId: "SYNTH-UNRELATED",
      charges: [],
    });
    const result = reconstructAnalyticalPnl(
      [original, changed, unrelated],
      [classifyExecutionRelationship(original, changed)],
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

  it("rejects a relationship that crosses ledger groups", () => {
    const usd = buildSyntheticCanonicalExecution({ charges: [] });
    const cad = buildSyntheticCanonicalExecution({
      currency: "CAD",
      charges: [],
      executionId: "SYNTH-CAD",
    });
    const result = reconstructAnalyticalPnl(
      [usd, cad],
      [classifyExecutionRelationship(usd, cad)],
    );
    expect(result.blockedStates.map((state) => state.code)).toEqual([
      "ti_v3_reconstruction_relationship_group_mismatch",
      "ti_v3_reconstruction_relationship_group_mismatch",
    ]);
    expect(result.ledgers).toHaveLength(0);
  });
});
