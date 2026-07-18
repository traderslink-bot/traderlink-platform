import { describe, expect, it } from "vitest";

import { buildCanonicalExecution } from "../domain";
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
});
