import { describe, expect, it } from "vitest";

import {
  compareMeaningfulExecutionOrder,
  orderCanonicalExecutions,
  type CanonicalExecutionDraft,
} from "../domain";
import {
  buildSyntheticCanonicalExecution,
  syntheticSourceDocumentDigest,
} from "../testing";

describe("Trader Intelligence v3 execution ordering", () => {
  it("orders distinct timestamp intervals", () => {
    const earlier = buildSyntheticCanonicalExecution({
      executedAt: "2026-07-18T13:45:12.000000000Z",
      timestampPrecision: "second",
      executionId: "SYNTH-EARLIER",
    });
    const later = buildSyntheticCanonicalExecution({
      executedAt: "2026-07-18T13:45:13.000000000Z",
      timestampPrecision: "second",
      executionId: "SYNTH-LATER",
    });
    expect(compareMeaningfulExecutionOrder(earlier, later)).toMatchObject({
      state: "ordered",
      direction: "left_before_right",
      evidenceUsed: ["canonical_timestamp_interval"],
    });
  });

  it("uses broker sequence for the same timestamp", () => {
    const first = buildSyntheticCanonicalExecution({
      brokerExecutionIndex: "10",
      brokerFillSequence: "10",
      executionId: "SYNTH-SEQUENCE-A",
    });
    const second = buildSyntheticCanonicalExecution({
      brokerExecutionIndex: "11",
      brokerFillSequence: "11",
      executionId: "SYNTH-SEQUENCE-B",
      price: "1.3",
    });
    expect(compareMeaningfulExecutionOrder(first, second)).toMatchObject({
      state: "ordered",
      direction: "left_before_right",
      evidenceUsed: ["scoped_broker_execution_index", "scoped_broker_fill_sequence"],
    });
  });

  it("uses declared preserved source-row order", () => {
    const first = buildSyntheticCanonicalExecution({
      brokerExecutionIndex: null,
      brokerFillSequence: null,
      executionId: null,
      originalSourceRowLocator: { kind: "row_number", value: "7", rowOrderPreserved: true },
    });
    const second = buildSyntheticCanonicalExecution({
      brokerExecutionIndex: null,
      brokerFillSequence: null,
      executionId: null,
      price: "1.3",
      originalSourceRowLocator: { kind: "row_number", value: "8", rowOrderPreserved: true },
    });
    expect(compareMeaningfulExecutionOrder(first, second)).toMatchObject({
      state: "ordered",
      direction: "left_before_right",
      evidenceUsed: ["scoped_declared_source_row_order"],
    });
  });

  it("does not treat lexical execution IDs as economic order without declared semantics", () => {
    const left = buildSyntheticCanonicalExecution({
      brokerExecutionIndex: null,
      brokerFillSequence: null,
      executionId: "SYNTH-EXEC-A",
      price: "1.25",
      originalSourceRowLocator: { kind: "record_key", value: "a", rowOrderPreserved: false },
    });
    const right = buildSyntheticCanonicalExecution({
      brokerExecutionIndex: null,
      brokerFillSequence: null,
      executionId: "SYNTH-EXEC-B",
      price: "1.3",
      originalSourceRowLocator: { kind: "record_key", value: "b", rowOrderPreserved: false },
    });
    expect(compareMeaningfulExecutionOrder(left, right).state).toBe(
      "ambiguous_meaningful_order",
    );
  });

  it("keeps mixed overlapping timestamp precision ambiguous", () => {
    const minute = buildSyntheticCanonicalExecution({
      executedAt: "2026-07-18T13:45:00.000000000Z",
      timestampPrecision: "minute",
      brokerExecutionIndex: null,
      brokerFillSequence: null,
      executionId: null,
      price: "1.25",
      originalSourceRowLocator: { kind: "record_key", value: "minute", rowOrderPreserved: false },
    });
    const second = buildSyntheticCanonicalExecution({
      executedAt: "2026-07-18T13:45:30.000000000Z",
      timestampPrecision: "second",
      brokerExecutionIndex: null,
      brokerFillSequence: null,
      executionId: null,
      price: "1.3",
      originalSourceRowLocator: { kind: "record_key", value: "second", rowOrderPreserved: false },
    });
    expect(compareMeaningfulExecutionOrder(minute, second).state).toBe(
      "ambiguous_meaningful_order",
    );
  });

  it("detects conflicting timestamp and broker sequence evidence", () => {
    const earlier = buildSyntheticCanonicalExecution({
      executedAt: "2026-07-18T13:45:12.000000000Z",
      timestampPrecision: "second",
      brokerExecutionIndex: "2",
      brokerFillSequence: null,
    });
    const later = buildSyntheticCanonicalExecution({
      executedAt: "2026-07-18T13:45:13.000000000Z",
      timestampPrecision: "second",
      brokerExecutionIndex: "1",
      brokerFillSequence: null,
      price: "1.3",
    });
    expect(compareMeaningfulExecutionOrder(earlier, later).state).toBe(
      "conflicting_order_evidence",
    );
  });

  it("does not compare document-scoped broker indices across documents", () => {
    const left = buildSyntheticCanonicalExecution({
      sourceDocumentDigest: syntheticSourceDocumentDigest("ordering-left"),
      brokerExecutionIndex: "1",
      brokerFillSequence: null,
      executionId: null,
      price: "1",
      originalSourceRowLocator: {
        kind: "record_key",
        value: "left",
        rowOrderPreserved: false,
      },
    });
    const right = buildSyntheticCanonicalExecution({
      sourceDocumentDigest: syntheticSourceDocumentDigest("ordering-right"),
      brokerExecutionIndex: "2",
      brokerFillSequence: null,
      executionId: null,
      price: "2",
      originalSourceRowLocator: {
        kind: "record_key",
        value: "right",
        rowOrderPreserved: false,
      },
    });
    expect(compareMeaningfulExecutionOrder(left, right).state).toBe(
      "ambiguous_meaningful_order",
    );
  });

  it("uses broker indices across documents only when both declare global source scope", () => {
    const left = buildSyntheticCanonicalExecution({
      sourceDocumentDigest: syntheticSourceDocumentDigest("global-left"),
      brokerExecutionIndex: "1",
      brokerExecutionIndexOrderingScope: "source_identity_global",
      brokerFillSequence: null,
      executionId: null,
      originalSourceRowLocator: {
        kind: "record_key",
        value: "left",
        rowOrderPreserved: false,
      },
    });
    const right = buildSyntheticCanonicalExecution({
      sourceDocumentDigest: syntheticSourceDocumentDigest("global-right"),
      brokerExecutionIndex: "2",
      brokerExecutionIndexOrderingScope: "source_identity_global",
      brokerFillSequence: null,
      executionId: null,
      price: "2",
      originalSourceRowLocator: {
        kind: "record_key",
        value: "right",
        rowOrderPreserved: false,
      },
    });
    expect(compareMeaningfulExecutionOrder(left, right)).toMatchObject({
      state: "ordered",
      direction: "left_before_right",
      evidenceUsed: ["scoped_broker_execution_index"],
    });
  });

  it("does not compare declared execution IDs from different namespaces", () => {
    const base = {
      brokerExecutionIndex: null,
      brokerFillSequence: null,
      executionIdOrderingSemantics: "declared" as const,
      executionIdOrderingScope: "source_document" as const,
      originalSourceRowLocator: {
        kind: "record_key" as const,
        value: "left",
        rowOrderPreserved: false,
      },
    };
    const left = buildSyntheticCanonicalExecution({
      ...base,
      executionId: "A",
      executionIdOrderingNamespace: "ordering_adapter_alpha",
      price: "1",
    });
    const right = buildSyntheticCanonicalExecution({
      ...base,
      executionId: "B",
      executionIdOrderingNamespace: "ordering_adapter_beta",
      price: "2",
      originalSourceRowLocator: { ...base.originalSourceRowLocator, value: "right" },
    });
    expect(compareMeaningfulExecutionOrder(left, right).state).toBe(
      "ambiguous_meaningful_order",
    );
  });

  it("does not compare fill sequences from different orders", () => {
    const common = {
      brokerExecutionIndex: null,
      executionId: null,
      price: "1",
      originalSourceRowLocator: {
        kind: "record_key" as const,
        value: "left",
        rowOrderPreserved: false,
      },
    };
    const left = buildSyntheticCanonicalExecution({
      ...common,
      orderId: "SYNTH-ORDER-A",
      brokerFillSequence: "1",
    });
    const right = buildSyntheticCanonicalExecution({
      ...common,
      orderId: "SYNTH-ORDER-B",
      brokerFillSequence: "2",
      price: "2",
      originalSourceRowLocator: { ...common.originalSourceRowLocator, value: "right" },
    });
    expect(compareMeaningfulExecutionOrder(left, right).state).toBe(
      "ambiguous_meaningful_order",
    );
  });

  it("does not compare declared execution IDs across broker adapter namespaces", () => {
    const common = {
      brokerExecutionIndex: null,
      brokerFillSequence: null,
      executionIdOrderingSemantics: "declared" as const,
      executionIdOrderingNamespace: "ordering_synthetic_lexical",
      executionIdOrderingScope: "source_document" as const,
      originalSourceRowLocator: {
        kind: "record_key" as const,
        value: "left",
        rowOrderPreserved: false,
      },
    };
    const left = buildSyntheticCanonicalExecution({
      ...common,
      executionId: "A",
      sourceSystem: "synthetic_adapter_alpha",
      brokerCode: "synthetic_broker_alpha",
      price: "1",
    });
    const right = buildSyntheticCanonicalExecution({
      ...common,
      executionId: "B",
      sourceSystem: "synthetic_adapter_beta",
      brokerCode: "synthetic_broker_beta",
      price: "2",
      originalSourceRowLocator: { ...common.originalSourceRowLocator, value: "right" },
    });
    expect(compareMeaningfulExecutionOrder(left, right).state).toBe(
      "ambiguous_meaningful_order",
    );
  });

  it("does not compare ordering evidence across canonical accounts", () => {
    const left = buildSyntheticCanonicalExecution({
      brokerExecutionIndex: "1",
      brokerFillSequence: null,
      executionId: null,
      price: "1",
    });
    const right = buildSyntheticCanonicalExecution({
      canonicalAccountKey: "account_synthetic_secondary",
      brokerExecutionIndex: "2",
      brokerFillSequence: null,
      executionId: null,
      price: "2",
    });
    expect(compareMeaningfulExecutionOrder(left, right).state).toBe(
      "ambiguous_meaningful_order",
    );
  });

  it("recognizes a tie only when all accounting-relevant fields agree", () => {
    const left = buildSyntheticCanonicalExecution({
      brokerExecutionIndex: null,
      brokerFillSequence: null,
      executionId: null,
      charges: [],
      originalSourceRowLocator: {
        kind: "record_key",
        value: "left",
        rowOrderPreserved: false,
      },
    });
    const right = buildSyntheticCanonicalExecution({
      brokerExecutionIndex: null,
      brokerFillSequence: null,
      executionId: null,
      charges: [],
      originalSourceRowLocator: {
        kind: "record_key",
        value: "right",
        rowOrderPreserved: false,
      },
    });
    expect(compareMeaningfulExecutionOrder(left, right).state).toBe(
      "tied_but_economically_equivalent",
    );
  });

  it.each([
    ["owner", { canonicalOwnerKey: "owner_synthetic_secondary" }],
    ["account", { canonicalAccountKey: "account_synthetic_secondary" }],
    ["aggregation", { sourceAggregationState: "broker_average_fill" }],
    [
      "instrument resolution",
      { instrumentResolutionState: "unresolved", stableInstrumentKey: null },
    ],
    ["raw symbol", { rawBrokerSymbol: "OTHER" }],
    ["security type", { securityType: "preferred_stock" }],
    ["basis", { basisContinuityState: "corporate_action_unresolved" }],
    ["side", { side: "sell" }],
    ["position effect", { brokerPositionEffectEvidence: "open" }],
    ["short indicator", { shortSaleIndicator: "broker_marked_not_short" }],
    ["quantity", { quantity: "11" }],
    ["price", { price: "1.3" }],
    ["currency", { currency: "CAD" }],
    ["charges", { charges: [{ kind: "commission", amount: "1", currency: "USD" }] }],
    ["broker net cash", { brokerReportedNetCashAmount: "-12.75" }],
    [
      "correction",
      { correctionState: "correction", correctionReference: "SYNTH-EXEC-0001" },
    ],
    [
      "validation",
      {
        validation: {
          state: "quarantined",
          reasonCodes: ["ti_v3_synthetic_quarantine"],
        },
      },
    ],
  ] as readonly [string, Partial<CanonicalExecutionDraft>][]) (
    "keeps overlapping order ambiguous when %s differs",
    (_label, change) => {
      const common: Partial<CanonicalExecutionDraft> = {
        brokerExecutionIndex: null,
        brokerFillSequence: null,
        executionId: null,
        charges: [],
        originalSourceRowLocator: {
          kind: "record_key",
          value: "left",
          rowOrderPreserved: false,
        },
      };
      const left = buildSyntheticCanonicalExecution(common);
      const right = buildSyntheticCanonicalExecution({
        ...common,
        originalSourceRowLocator: {
          kind: "record_key",
          value: "right",
          rowOrderPreserved: false,
        },
        ...change,
      });
      expect(compareMeaningfulExecutionOrder(left, right).state).toBe(
        "ambiguous_meaningful_order",
      );
    },
  );

  it("keeps storage deterministic without upgrading ambiguity", () => {
    const first = buildSyntheticCanonicalExecution({
      brokerExecutionIndex: null,
      brokerFillSequence: null,
      executionId: null,
      price: "1.1",
      originalSourceRowLocator: { kind: "record_key", value: "first", rowOrderPreserved: false },
    });
    const second = buildSyntheticCanonicalExecution({
      brokerExecutionIndex: null,
      brokerFillSequence: null,
      executionId: null,
      price: "1.2",
      originalSourceRowLocator: { kind: "record_key", value: "second", rowOrderPreserved: false },
    });
    const forward = orderCanonicalExecutions([first, second]);
    const reverse = orderCanonicalExecutions([second, first]);
    expect(forward.state).toBe("ambiguous_meaningful_order");
    expect(forward.economicallyOrderedExecutions).toBeNull();
    expect(forward.storageOrderedExecutions.map((item) => item.canonicalContentDigest)).toEqual(
      reverse.storageOrderedExecutions.map((item) => item.canonicalContentDigest),
    );
  });
});
