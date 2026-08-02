import { allocateExecutionCharges } from "./allocate-execution-charges";

const ibkrCandidate = Object.freeze({
  sourceSystem: "ibkr",
  adapterId: "ibkr_activity_statement",
  adapterVersion: "ibkr_activity_statement_v1",
  provenanceKind: "broker" as const,
});

function input(
  overrides: Partial<Parameters<typeof allocateExecutionCharges>[0]> = {},
) {
  return {
    executionId: "execution",
    executionVersionId: "version",
    executionQuantityDecimal: "3",
    feesDecimal: "-0.05",
    feeCurrency: "USD",
    feeSignConvention: "broker_reported_signed" as const,
    feePolicyCandidates: Object.freeze([ibkrCandidate]),
    allocations: Object.freeze([
      Object.freeze({ allocationId: "a", allocationSequence: 1, quantityDecimal: "1" }),
      Object.freeze({ allocationId: "b", allocationSequence: 2, quantityDecimal: "1" }),
      Object.freeze({ allocationId: "c", allocationSequence: 3, quantityDecimal: "1" }),
    ]),
    ...overrides,
  };
}

describe("execution charge allocation", () => {
  it("conserves source-scale units with deterministic largest remainders", () => {
    const result = allocateExecutionCharges(input());
    expect(result).toMatchObject({
      state: "complete",
      originalFeeUnits: "-5",
      feeScale: 2,
    });
    if (result.state !== "complete") throw new Error("expected complete");
    expect(result.allocations.map((entry) => entry.chargeCostDecimal)).toEqual([
      "0.02",
      "0.02",
      "0.01",
    ]);
    expect(result.allocations.map((entry) => entry.allocatedFeeUnits)).toEqual([
      "-2",
      "-2",
      "-1",
    ]);
  });

  it("uses allocation sequence and stable ID to break equal remainders", () => {
    const result = allocateExecutionCharges(input({
      executionQuantityDecimal: "2",
      feesDecimal: "-0.01",
      allocations: Object.freeze([
        Object.freeze({ allocationId: "z", allocationSequence: 2, quantityDecimal: "1" }),
        Object.freeze({ allocationId: "a", allocationSequence: 1, quantityDecimal: "1" }),
      ]),
    }));
    if (result.state !== "complete") throw new Error("expected complete");
    expect(result.allocations).toMatchObject([
      { allocationId: "a", chargeCostDecimal: "0.01" },
      { allocationId: "z", chargeCostDecimal: "0" },
    ]);
  });

  it("separates positive credits from negative costs", () => {
    const result = allocateExecutionCharges(input({ feesDecimal: "0.06" }));
    if (result.state !== "complete") throw new Error("expected complete");
    expect(result.allocations.map((entry) => entry.chargeCostDecimal)).toEqual([
      "0",
      "0",
      "0",
    ]);
    expect(result.allocations.map((entry) => entry.chargeCreditDecimal)).toEqual([
      "0.02",
      "0.02",
      "0.02",
    ]);
  });

  it("supports explicit cash-effect fees without broker provenance", () => {
    const result = allocateExecutionCharges(input({
      feeSignConvention: "cash_effect",
      feePolicyCandidates: Object.freeze([]),
    }));
    expect(result.state).toBe("complete");
  });

  it("returns explicit unavailable states for missing or unknown fee policy", () => {
    expect(allocateExecutionCharges(input({
      feesDecimal: null,
      feeCurrency: null,
      feeSignConvention: "not_reported",
    }))).toMatchObject({ state: "unavailable", reasonCode: "fee_not_reported" });
    expect(allocateExecutionCharges(input({
      feePolicyCandidates: Object.freeze([{
        ...ibkrCandidate,
        adapterVersion: "unknown",
      }]),
    }))).toMatchObject({
      state: "unavailable",
      reasonCode: "fee_sign_policy_unsupported",
    });
  });

  it("fails closed when allocation quantities do not conserve the execution", () => {
    expect(() => allocateExecutionCharges(input({
      executionQuantityDecimal: "4",
    }))).toThrowError("TRADERLINK_PLATFORM_INTEGRITY_FAILED");
  });
});
