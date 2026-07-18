import { describe, expect, it } from "vitest";

import {
  buildCanonicalExecution,
  orderCanonicalExecutions,
  serializeCanonicalValue,
  verifyCanonicalExecutionEnvelope,
  type CanonicalExecutionEnvelope,
} from "../domain";
import {
  buildSyntheticCanonicalExecution,
  syntheticSourceDocumentDigest,
} from "../testing";

describe("Trader Intelligence v3 canonical execution v1", () => {
  it("builds a content-addressed accepted execution with synthetic provenance", () => {
    const execution = buildSyntheticCanonicalExecution();
    expect(execution.content.schemaVersion).toBe("ti_v3_canonical_execution_v1");
    expect(execution.validation).toEqual({ state: "accepted", reasonCodes: [] });
    expect(execution.canonicalContentDigest).toMatch(
      /^ti_v3:canonical_execution:v1:sha256:[0-9a-f]{64}$/,
    );
    expect(new TextDecoder().decode(execution.canonicalBytes)).not.toContain(
      execution.canonicalContentDigest,
    );
  });

  it("returns the normalized canonical content that exactly produced its bytes", () => {
    const execution = buildSyntheticCanonicalExecution({
      orderId: "SYNTH-Cafe\u0301",
      executionId: "SYNTH-Exe\u0301cution",
    });
    const serialized = serializeCanonicalValue(execution.content);
    expect(serialized.ok).toBe(true);
    if (serialized.ok) {
      expect(serialized.value.utf8).toEqual(execution.canonicalBytes);
    }
    expect(execution.content.orderId).toBe("SYNTH-Café");
    expect(execution.content.executionId).toBe("SYNTH-Exécution");
  });

  it("deep-freezes authoritative facts and validation while exposing defensive bytes", () => {
    const execution = buildSyntheticCanonicalExecution({
      charges: [{ kind: "commission", amount: "0.25", currency: "USD" }],
    });
    expect(Object.isFrozen(execution)).toBe(true);
    expect(Object.isFrozen(execution.content)).toBe(true);
    expect(Object.isFrozen(execution.content.originalSourceRowLocator)).toBe(true);
    expect(Object.isFrozen(execution.content.charges)).toBe(true);
    expect(Object.isFrozen(execution.content.charges[0])).toBe(true);
    expect(Object.isFrozen(execution.validation)).toBe(true);
    expect(Object.isFrozen(execution.validation.reasonCodes)).toBe(true);
    expect(() => {
      (execution.content as { price: string }).price = "999";
    }).toThrow(TypeError);
    const exposedBytes = execution.canonicalBytes;
    exposedBytes[0] = 0;
    expect(execution.canonicalBytes[0]).not.toBe(0);
    expect(verifyCanonicalExecutionEnvelope(execution)).toEqual({
      ok: true,
      value: execution,
    });
  });

  it.each(["content", "bytes", "digest"])(
    "rejects a forged envelope with %s drift at integrity and ordering boundaries",
    (drift) => {
      const execution = buildSyntheticCanonicalExecution();
      const forged = {
        ...execution,
        content:
          drift === "content"
            ? { ...execution.content, price: "999" }
            : execution.content,
        canonicalBytes:
          drift === "bytes"
            ? new TextEncoder().encode("{\"forged\":true}")
            : execution.canonicalBytes,
        canonicalContentDigest:
          drift === "digest"
            ? "ti_v3:canonical_execution:v1:sha256:0000000000000000000000000000000000000000000000000000000000000000"
            : execution.canonicalContentDigest,
      } as CanonicalExecutionEnvelope;
      expect(verifyCanonicalExecutionEnvelope(forged).ok).toBe(false);
      expect(orderCanonicalExecutions([forged])).toMatchObject({
        state: "conflicting_order_evidence",
        economicallyOrderedExecutions: null,
        reasonCodes: ["ti_v3_order_execution_envelope_integrity_invalid"],
      });
    },
  );

  it("gives composed and decomposed identifiers identical canonical content and identity", () => {
    const composed = buildSyntheticCanonicalExecution({
      orderId: "SYNTH-Café",
      executionId: "SYNTH-Exécution",
    });
    const decomposed = buildSyntheticCanonicalExecution({
      orderId: "SYNTH-Cafe\u0301",
      executionId: "SYNTH-Exe\u0301cution",
    });
    expect(decomposed.content).toEqual(composed.content);
    expect(decomposed.canonicalBytes).toEqual(composed.canonicalBytes);
    expect(decomposed.canonicalContentDigest).toBe(
      composed.canonicalContentDigest,
    );
  });

  it("rejects CRLF in source identifiers instead of canonicalizing identity evidence", () => {
    const base = buildSyntheticCanonicalExecution();
    const result = buildCanonicalExecution({
      ...base.content,
      executionId: "SYNTH\r\nEXECUTION",
      validation: base.validation,
    });
    expect(result).toEqual({
      ok: false,
      error: {
        code: "ti_v3_canonical_execution_invalid",
        reasonCodes: ["ti_v3_execution_identifier_invalid"],
      },
    });
  });

  it("keeps persistence metadata outside content identity", () => {
    const execution = buildSyntheticCanonicalExecution();
    const firstPersistenceEnvelope = { databaseId: "101", execution };
    const secondPersistenceEnvelope = { databaseId: "909", execution };
    expect(firstPersistenceEnvelope.execution.canonicalContentDigest).toBe(
      secondPersistenceEnvelope.execution.canonicalContentDigest,
    );
  });

  it("changes identity for source and economic changes", () => {
    const original = buildSyntheticCanonicalExecution();
    const sourceChanged = buildSyntheticCanonicalExecution({
      sourceDocumentDigest: syntheticSourceDocumentDigest("changed"),
    });
    const economicChanged = buildSyntheticCanonicalExecution({ price: "1.2501" });
    expect(sourceChanged.canonicalContentDigest).not.toBe(original.canonicalContentDigest);
    expect(economicChanged.canonicalContentDigest).not.toBe(original.canonicalContentDigest);
  });

  it("prevents owner provenance from masquerading as broker confirmed", () => {
    const base = buildSyntheticCanonicalExecution();
    const result = buildCanonicalExecution({
      ...base.content,
      sourceKind: "owner_manual",
      evidenceClass: "broker_confirmed",
      executedAt: base.content.executedAt,
      quantity: base.content.quantity,
      price: base.content.price,
      currency: base.content.currency,
      charges: base.content.charges,
      brokerReportedNetCashAmount: base.content.brokerReportedNetCashAmount,
      sourceDocumentDigest: base.content.sourceDocumentDigest,
      validation: base.validation,
    });
    expect(result).toEqual({
      ok: false,
      error: {
        code: "ti_v3_canonical_execution_invalid",
        reasonCodes: ["ti_v3_execution_evidence_source_conflict"],
      },
    });
  });

  it("preserves a broker average-fill row as one aggregated execution", () => {
    const execution = buildSyntheticCanonicalExecution({
      sourceAggregationState: "broker_average_fill",
      quantity: "125.5",
      price: "0.412345678901",
    });
    expect(execution.content.sourceAggregationState).toBe("broker_average_fill");
    expect(execution.content.quantity).toBe("125.5");
  });

  it("returns stable reason codes for invalid quantity, currency, and instrument state", () => {
    const base = buildSyntheticCanonicalExecution();
    const result = buildCanonicalExecution({
      ...base.content,
      executedAt: base.content.executedAt,
      quantity: "1.0000000000001",
      price: base.content.price,
      currency: "usd",
      charges: base.content.charges,
      brokerReportedNetCashAmount: base.content.brokerReportedNetCashAmount,
      sourceDocumentDigest: base.content.sourceDocumentDigest,
      instrumentResolutionState: "unresolved",
      stableInstrumentKey: base.content.stableInstrumentKey,
      validation: base.validation,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.reasonCodes).toEqual([
        "ti_v3_execution_currency_invalid",
        "ti_v3_execution_instrument_key_invalid",
        "ti_v3_execution_quantity_invalid",
      ]);
    }
  });

  it.each(["-1", "01", "+1", "1.0", "row-seven", "9".repeat(39)])(
    "rejects noncanonical row_number value %s without throwing",
    (value) => {
      const base = buildSyntheticCanonicalExecution();
      const input = {
        ...base.content,
        originalSourceRowLocator: {
          kind: "row_number",
          value,
          rowOrderPreserved: true,
        },
        validation: base.validation,
      };
      expect(() => buildCanonicalExecution(input)).not.toThrow();
      expect(buildCanonicalExecution(input)).toEqual({
        ok: false,
        error: {
          code: "ti_v3_canonical_execution_invalid",
          reasonCodes: ["ti_v3_execution_row_locator_invalid"],
        },
      });
    },
  );

  it("keeps arbitrary bounded source keys under record_key", () => {
    expect(
      buildSyntheticCanonicalExecution({
        originalSourceRowLocator: {
          kind: "record_key",
          value: "synthetic-row-key/A-7",
          rowOrderPreserved: false,
        },
      }).content.originalSourceRowLocator.value,
    ).toBe("synthetic-row-key/A-7");
  });

  it.each([
    ["null input", null, "ti_v3_execution_input_invalid"],
    ["array input", [], "ti_v3_execution_input_invalid"],
    ["missing input", undefined, "ti_v3_execution_input_invalid"],
    ["non-array charges", { charges: null }, "ti_v3_execution_charge_invalid"],
    ["non-object charge", { charges: [null] }, "ti_v3_execution_charge_invalid"],
    ["null locator", { originalSourceRowLocator: null }, "ti_v3_execution_row_locator_invalid"],
    ["null validation", { validation: null }, "ti_v3_execution_validation_state_invalid"],
    [
      "non-array validation reasons",
      { validation: { state: "accepted", reasonCodes: null } },
      "ti_v3_execution_validation_state_invalid",
    ],
    ["invalid source kind", { sourceKind: "csv" }, "ti_v3_execution_source_identity_invalid"],
    [
      "invalid ordering semantics",
      { executionIdOrderingSemantics: "lexical" },
      "ti_v3_execution_ordering_semantics_invalid",
    ],
    [
      "invalid ordering scope",
      { brokerExecutionIndexOrderingScope: "broker" },
      "ti_v3_execution_ordering_scope_invalid",
    ],
  ])("returns a structured failure for %s", (_label, change, reasonCode) => {
    const base = buildSyntheticCanonicalExecution();
    const input =
      change === null || Array.isArray(change) || change === undefined
        ? change
        : { ...base.content, validation: base.validation, ...change };
    expect(() => buildCanonicalExecution(input)).not.toThrow();
    const result = buildCanonicalExecution(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.reasonCodes).toContain(reasonCode);
    }
  });
});
