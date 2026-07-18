import { describe, expect, it } from "vitest";

import {
  compareMeaningfulExecutionOrder,
  orderCanonicalExecutions,
} from "../domain";
import { buildSyntheticCanonicalExecution } from "../testing";

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
      evidenceUsed: ["broker_execution_index", "broker_fill_sequence"],
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
      evidenceUsed: ["declared_source_row_order"],
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
