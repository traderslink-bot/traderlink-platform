import { describe, expect, it } from "vitest";

import { classifyExecutionRelationship } from "../domain";
import {
  applyCollisionTestHash,
  buildSyntheticCanonicalExecution,
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
    const first = applyCollisionTestHash(
      buildSyntheticCanonicalExecution({ executionId: "SYNTH-COLLISION-A" }),
      hash,
    );
    const second = applyCollisionTestHash(
      buildSyntheticCanonicalExecution({ executionId: "SYNTH-COLLISION-B", price: "1.26" }),
      hash,
    );
    expect(classifyExecutionRelationship(first, second)).toMatchObject({
      state: "digest_collision_detected",
      confidence: "conflict",
      suppressionEligible: false,
    });
  });
});
