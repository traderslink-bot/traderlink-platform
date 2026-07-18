import { describe, expect, it } from "vitest";

import {
  classifyExecutionRelationship,
} from "../domain";
import {
  buildSyntheticCanonicalExecution,
  classifyCollisionWithTestHash,
  syntheticSourceDocumentDigest,
} from "../testing";

describe("Trader Intelligence v3 execution relationship classification", () => {
  it("suppresses only proven exact same-source duplicates", () => {
    const execution = buildSyntheticCanonicalExecution();
    expect(classifyExecutionRelationship(execution, execution)).toMatchObject({
      state: "exact_duplicate_same_source",
      confidence: "proven",
      suppressionEligible: true,
    });
  });

  it("does not suppress equal facts when validation states disagree", () => {
    const accepted = buildSyntheticCanonicalExecution();
    const quarantined = buildSyntheticCanonicalExecution({
      validation: {
        state: "quarantined",
        reasonCodes: ["ti_v3_synthetic_quarantine"],
      },
    });
    const forward = classifyExecutionRelationship(accepted, quarantined);
    const reverse = classifyExecutionRelationship(quarantined, accepted);
    expect(forward).toMatchObject({
      state: "manual_review_required",
      confidence: "conflict",
      suppressionEligible: false,
      reasonCodes: ["ti_v3_relationship_equal_facts_validation_disagreement"],
    });
    expect(reverse.state).toBe(forward.state);
    expect(reverse.suppressionEligible).toBe(false);
  });

  it("does not treat two missing source-document digests as same-source proof", () => {
    const first = buildSyntheticCanonicalExecution({
      sourceDocumentDigest: null,
      brokerExecutionIndexOrderingScope: "source_identity_global",
    });
    const second = buildSyntheticCanonicalExecution({
      sourceDocumentDigest: null,
      brokerExecutionIndexOrderingScope: "source_identity_global",
    });
    expect(classifyExecutionRelationship(first, second)).toMatchObject({
      state: "possible_duplicate_ambiguous",
      confidence: "ambiguous",
      suppressionEligible: false,
      reasonCodes: [
        "ti_v3_relationship_same_source_document_identity_unproven",
      ],
    });
  });

  it("classifies the same broker execution from a new document as a re-export", () => {
    const original = buildSyntheticCanonicalExecution();
    const reexport = buildSyntheticCanonicalExecution({
      sourceDocumentDigest: syntheticSourceDocumentDigest("reexport"),
      originalSourceRowLocator: { kind: "row_number", value: "9", rowOrderPreserved: true },
    });
    expect(classifyExecutionRelationship(original, reexport)).toMatchObject({
      state: "same_execution_reexported",
      suppressionEligible: false,
    });
  });

  it("classifies changed economics under one stable execution ID as correction/conflict", () => {
    const original = buildSyntheticCanonicalExecution();
    const changed = buildSyntheticCanonicalExecution({ price: "1.26" });
    expect(classifyExecutionRelationship(original, changed)).toMatchObject({
      state: "broker_correction_or_bust",
      confidence: "conflict",
      suppressionEligible: false,
    });
  });

  it("never suppresses byte-unequal content at the same source location", () => {
    const original = buildSyntheticCanonicalExecution();
    const changed = buildSyntheticCanonicalExecution({ price: "1.2501" });
    expect(classifyExecutionRelationship(original, changed)).toMatchObject({
      state: "broker_correction_or_bust",
      suppressionEligible: false,
    });
  });

  it.each([
    ["aggregation state", { sourceAggregationState: "broker_average_fill" }],
    ["raw symbol", { rawBrokerSymbol: "SYNTH2" }],
    ["security type", { securityType: "preferred_stock" }],
    ["basis continuity", { basisContinuityState: "corporate_action_unresolved" }],
    ["position effect", { brokerPositionEffectEvidence: "open" }],
    ["short indicator", { shortSaleIndicator: "broker_marked_not_short" }],
    ["broker net cash", { brokerReportedNetCashAmount: "-12.75" }],
    ["order ID", { orderId: "SYNTH-ORDER-CHANGED" }],
    ["broker execution index", { brokerExecutionIndex: "2" }],
    ["fill sequence", { brokerFillSequence: "2" }],
    [
      "execution ID ordering semantics",
      {
        executionIdOrderingSemantics: "declared",
        executionIdOrderingNamespace: "ordering_synthetic_lexical",
        executionIdOrderingScope: "source_document",
      },
    ],
    ["source timezone evidence", { sourceTimezoneEvidence: "UTC" }],
  ] as const)("does not call a re-export equal when %s changes", (_label, overrides) => {
    const original = buildSyntheticCanonicalExecution();
    const changed = buildSyntheticCanonicalExecution({
      sourceDocumentDigest: syntheticSourceDocumentDigest("changed-document"),
      originalSourceRowLocator: {
        kind: "row_number",
        value: "99",
        rowOrderPreserved: true,
      },
      ...overrides,
    });
    expect(classifyExecutionRelationship(original, changed)).toMatchObject({
      state: "broker_correction_or_bust",
      suppressionEligible: false,
    });
  });

  it("keeps a reused stable ID with a changed same-document row locator visible", () => {
    const original = buildSyntheticCanonicalExecution();
    const moved = buildSyntheticCanonicalExecution({
      originalSourceRowLocator: {
        kind: "row_number",
        value: "99",
        rowOrderPreserved: true,
      },
    });
    expect(classifyExecutionRelationship(original, moved)).toMatchObject({
      state: "manual_review_required",
      suppressionEligible: false,
    });
  });

  it("preserves explicit broker bust evidence", () => {
    const original = buildSyntheticCanonicalExecution();
    const bust = buildSyntheticCanonicalExecution({
      correctionState: "bust",
      correctionReference: "SYNTH-EXEC-0001",
      executionId: "SYNTH-BUST-0001",
    });
    expect(classifyExecutionRelationship(original, bust).state).toBe(
      "broker_correction_or_bust",
    );
  });

  it.each(["correction", "bust"] as const)(
    "does not create a %s relationship with an unrelated execution",
    (correctionState) => {
      const affected = buildSyntheticCanonicalExecution({
        correctionState,
        correctionReference: "SYNTH-ORIGINAL-A",
        executionId: "SYNTH-REPLACEMENT-A",
      });
      const unrelated = buildSyntheticCanonicalExecution({
        executionId: "SYNTH-UNRELATED-B",
        stableInstrumentKey: "instrument_synthetic_unrelated",
        rawBrokerSymbol: "OTHER",
      });
      expect(classifyExecutionRelationship(affected, unrelated).state).not.toBe(
        "broker_correction_or_bust",
      );
    },
  );

  it.each(["correction", "bust"] as const)(
    "links a %s reference to its named original execution",
    (correctionState) => {
      const original = buildSyntheticCanonicalExecution({ executionId: "SYNTH-ORIGINAL-A" });
      const replacement = buildSyntheticCanonicalExecution({
        correctionState,
        correctionReference: "SYNTH-ORIGINAL-A",
        executionId: "SYNTH-REPLACEMENT-A",
      });
      expect(classifyExecutionRelationship(original, replacement)).toMatchObject({
        state: "broker_correction_or_bust",
        suppressionEligible: false,
      });
    },
  );

  it("treats distinct stable execution IDs as legitimate repeated fills", () => {
    const first = buildSyntheticCanonicalExecution({ executionId: "SYNTH-EXEC-A" });
    const second = buildSyntheticCanonicalExecution({ executionId: "SYNTH-EXEC-B" });
    expect(classifyExecutionRelationship(first, second)).toMatchObject({
      state: "legitimate_repeated_fill",
      suppressionEligible: false,
    });
  });

  it("keeps identical-looking fills without unique evidence ambiguous", () => {
    const first = buildSyntheticCanonicalExecution({
      executionId: null,
      brokerExecutionIndex: null,
      originalSourceRowLocator: { kind: "record_key", value: "alpha", rowOrderPreserved: false },
    });
    const second = buildSyntheticCanonicalExecution({
      executionId: null,
      brokerExecutionIndex: null,
      originalSourceRowLocator: { kind: "record_key", value: "beta", rowOrderPreserved: false },
    });
    expect(classifyExecutionRelationship(first, second)).toMatchObject({
      state: "possible_duplicate_ambiguous",
      confidence: "ambiguous",
      suppressionEligible: false,
    });
  });

  it("fails closed for an injected digest collision", () => {
    const hash = () => "0".repeat(64);
    const first = buildSyntheticCanonicalExecution({
      executionId: "SYNTH-COLLISION-A",
    });
    const second = buildSyntheticCanonicalExecution({
      executionId: "SYNTH-COLLISION-B",
      price: "1.26",
    });
    expect(classifyCollisionWithTestHash(first, second, hash)).toMatchObject({
      state: "digest_collision_detected",
      confidence: "conflict",
      suppressionEligible: false,
    });
  });
});
