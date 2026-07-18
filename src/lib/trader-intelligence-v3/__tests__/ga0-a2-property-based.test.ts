import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  classifyExecutionRelationship,
  createCanonicalContentIdentity,
  orderCanonicalExecutions,
  reconstructAnalyticalPnl,
  runFifoPositionLedger,
  serializeCanonicalValue,
  type CanonicalExecutionDraft,
  type CanonicalExecutionEnvelope,
} from "../domain";
import {
  buildSyntheticCanonicalExecution,
  runReferenceFifoLedger,
  syntheticSourceDocumentDigest,
} from "../testing";

export const GA0_A2_PROPERTY_TEST_SEEDS = Object.freeze({
  flatLong: 2026071801,
  flatShort: 2026071802,
  partialFills: 2026071803,
  reversals: 2026071804,
  duplicateClassification: 2026071805,
  canonicalPropertyOrder: 2026071806,
  digestSemantics: 2026071807,
  ambiguousOrdering: 2026071808,
});

const TIMESTAMPS = [
  "2026-07-18T15:00:01.000000000Z",
  "2026-07-18T15:00:02.000000000Z",
  "2026-07-18T15:00:03.000000000Z",
];

const positiveCoefficient = fc.bigInt({ min: BigInt(1), max: BigInt(100_000) });
const signedChargeCoefficient = fc.bigInt({ min: BigInt(-1_000), max: BigInt(1_000) });
const scaleArbitrary = fc.integer({ min: 0, max: 4 });

function coefficientToDecimal(coefficient: bigint, scale: number): string {
  const negative = coefficient < BigInt(0);
  const magnitude = negative ? -coefficient : coefficient;
  const digits = magnitude.toString().padStart(scale + 1, "0");
  const unsigned =
    scale === 0 ? digits : `${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
  const normalized = unsigned.includes(".")
    ? unsigned.replace(/0+$/, "").replace(/\.$/, "")
    : unsigned;
  const canonical = normalized === "" ? "0" : normalized;
  return negative && canonical !== "0" ? `-${canonical}` : canonical;
}

function propertyExecution(
  index: number,
  overrides: Partial<CanonicalExecutionDraft>,
): CanonicalExecutionEnvelope {
  const sequence = String(index + 1);
  return buildSyntheticCanonicalExecution({
    executedAt: TIMESTAMPS[index],
    timestampPrecision: "second",
    brokerExecutionIndex: sequence,
    brokerFillSequence: sequence,
    executionId: `SYNTH-PROPERTY-${sequence}`,
    originalSourceRowLocator: {
      kind: "row_number",
      value: sequence,
      rowOrderPreserved: true,
    },
    ...overrides,
  });
}

function charge(amount: string) {
  return [{ kind: "synthetic_charge", amount, currency: "USD" }] as const;
}

function assertProductionMatchesReference(
  executions: readonly CanonicalExecutionEnvelope[],
): void {
  const ordering = orderCanonicalExecutions(executions);
  const production = runFifoPositionLedger({ ordering });
  const reference = runReferenceFifoLedger(ordering);
  expect(production.status).toBe("completed");
  expect(reference.status).toBe("completed");
  const ledger = production.ledgers[0];
  expect({
    endingQuantity: ledger.endingQuantity,
    grossRealizedPnl: ledger.grossRealizedPnl,
    signedCharges: ledger.signedCharges,
    netAnalyticalPnl: ledger.netAnalyticalPnl,
    signedCashFlow: ledger.signedCashFlow,
  }).toEqual({
    endingQuantity: reference.endingQuantity,
    grossRealizedPnl: reference.grossRealizedPnl,
    signedCharges: reference.signedCharges,
    netAnalyticalPnl: reference.netAnalyticalPnl,
    signedCashFlow: reference.signedCashFlow,
  });
  if (ledger.endingQuantity === "0") {
    expect(ledger.netAnalyticalPnl).toBe(ledger.signedCashFlow);
  }
  const rerun = runFifoPositionLedger({ ordering: orderCanonicalExecutions(executions) });
  expect(rerun).toEqual(production);
}

const financialCaseArbitrary = fc.record({
  firstQuantityCoefficient: positiveCoefficient,
  secondQuantityCoefficient: positiveCoefficient,
  quantityScale: scaleArbitrary,
  firstPriceCoefficient: positiveCoefficient,
  secondPriceCoefficient: positiveCoefficient,
  exitPriceCoefficient: positiveCoefficient,
  priceScale: scaleArbitrary,
  firstChargeCoefficient: signedChargeCoefficient,
  secondChargeCoefficient: signedChargeCoefficient,
  thirdChargeCoefficient: signedChargeCoefficient,
  chargeScale: scaleArbitrary,
});

describe("Trader Intelligence v3 fixed-seed property and differential suites", () => {
  it("runs 1,000 generated flat long sequences", () => {
    fc.assert(
      fc.property(financialCaseArbitrary, (sample) => {
        const firstQuantity = coefficientToDecimal(
          sample.firstQuantityCoefficient,
          sample.quantityScale,
        );
        const secondQuantity = coefficientToDecimal(
          sample.secondQuantityCoefficient,
          sample.quantityScale,
        );
        const totalQuantity = coefficientToDecimal(
          sample.firstQuantityCoefficient + sample.secondQuantityCoefficient,
          sample.quantityScale,
        );
        const executions = [
          propertyExecution(0, {
            side: "buy",
            quantity: firstQuantity,
            price: coefficientToDecimal(sample.firstPriceCoefficient, sample.priceScale),
            charges: charge(coefficientToDecimal(sample.firstChargeCoefficient, sample.chargeScale)),
          }),
          propertyExecution(1, {
            side: "buy",
            quantity: secondQuantity,
            price: coefficientToDecimal(sample.secondPriceCoefficient, sample.priceScale),
            charges: charge(coefficientToDecimal(sample.secondChargeCoefficient, sample.chargeScale)),
          }),
          propertyExecution(2, {
            side: "sell",
            quantity: totalQuantity,
            price: coefficientToDecimal(sample.exitPriceCoefficient, sample.priceScale),
            charges: charge(coefficientToDecimal(sample.thirdChargeCoefficient, sample.chargeScale)),
          }),
        ];
        assertProductionMatchesReference(executions);
        expect(runReferenceFifoLedger(orderCanonicalExecutions(executions)).endingQuantity).toBe("0");
      }),
      { numRuns: 1000, seed: GA0_A2_PROPERTY_TEST_SEEDS.flatLong, verbose: 2 },
    );
  }, 120_000);

  it("runs 1,000 generated flat short sequences", () => {
    fc.assert(
      fc.property(financialCaseArbitrary, (sample) => {
        const firstQuantity = coefficientToDecimal(sample.firstQuantityCoefficient, sample.quantityScale);
        const secondQuantity = coefficientToDecimal(sample.secondQuantityCoefficient, sample.quantityScale);
        const totalQuantity = coefficientToDecimal(
          sample.firstQuantityCoefficient + sample.secondQuantityCoefficient,
          sample.quantityScale,
        );
        const executions = [
          propertyExecution(0, {
            side: "sell",
            quantity: firstQuantity,
            price: coefficientToDecimal(sample.firstPriceCoefficient, sample.priceScale),
            charges: charge(coefficientToDecimal(sample.firstChargeCoefficient, sample.chargeScale)),
          }),
          propertyExecution(1, {
            side: "sell",
            quantity: secondQuantity,
            price: coefficientToDecimal(sample.secondPriceCoefficient, sample.priceScale),
            charges: charge(coefficientToDecimal(sample.secondChargeCoefficient, sample.chargeScale)),
          }),
          propertyExecution(2, {
            side: "buy",
            quantity: totalQuantity,
            price: coefficientToDecimal(sample.exitPriceCoefficient, sample.priceScale),
            charges: charge(coefficientToDecimal(sample.thirdChargeCoefficient, sample.chargeScale)),
          }),
        ];
        assertProductionMatchesReference(executions);
        expect(runReferenceFifoLedger(orderCanonicalExecutions(executions)).endingQuantity).toBe("0");
      }),
      { numRuns: 1000, seed: GA0_A2_PROPERTY_TEST_SEEDS.flatShort, verbose: 2 },
    );
  }, 120_000);

  it("runs 1,000 generated partial-fill sequences", () => {
    fc.assert(
      fc.property(financialCaseArbitrary, (sample) => {
        const firstQuantity = coefficientToDecimal(sample.firstQuantityCoefficient, sample.quantityScale);
        const secondQuantity = coefficientToDecimal(sample.secondQuantityCoefficient, sample.quantityScale);
        const totalQuantity = coefficientToDecimal(
          sample.firstQuantityCoefficient + sample.secondQuantityCoefficient,
          sample.quantityScale,
        );
        const executions = [
          propertyExecution(0, {
            side: "buy",
            quantity: totalQuantity,
            price: coefficientToDecimal(sample.firstPriceCoefficient, sample.priceScale),
            charges: charge(coefficientToDecimal(sample.firstChargeCoefficient, sample.chargeScale)),
          }),
          propertyExecution(1, {
            side: "sell",
            quantity: firstQuantity,
            price: coefficientToDecimal(sample.secondPriceCoefficient, sample.priceScale),
            charges: charge(coefficientToDecimal(sample.secondChargeCoefficient, sample.chargeScale)),
          }),
          propertyExecution(2, {
            side: "sell",
            quantity: secondQuantity,
            price: coefficientToDecimal(sample.exitPriceCoefficient, sample.priceScale),
            charges: charge(coefficientToDecimal(sample.thirdChargeCoefficient, sample.chargeScale)),
          }),
        ];
        assertProductionMatchesReference(executions);
        const reference = runReferenceFifoLedger(orderCanonicalExecutions(executions));
        expect(reference.matchedQuantityByExecution).toEqual(["0", firstQuantity, secondQuantity]);
      }),
      { numRuns: 1000, seed: GA0_A2_PROPERTY_TEST_SEEDS.partialFills, verbose: 2 },
    );
  }, 120_000);

  it("runs 1,000 generated reversal sequences", () => {
    fc.assert(
      fc.property(financialCaseArbitrary, (sample) => {
        const closeQuantity = coefficientToDecimal(sample.firstQuantityCoefficient, sample.quantityScale);
        const remainder = coefficientToDecimal(sample.secondQuantityCoefficient, sample.quantityScale);
        const reversalQuantity = coefficientToDecimal(
          sample.firstQuantityCoefficient + sample.secondQuantityCoefficient,
          sample.quantityScale,
        );
        const executions = [
          propertyExecution(0, {
            side: "buy",
            quantity: closeQuantity,
            price: coefficientToDecimal(sample.firstPriceCoefficient, sample.priceScale),
            charges: charge(coefficientToDecimal(sample.firstChargeCoefficient, sample.chargeScale)),
          }),
          propertyExecution(1, {
            side: "sell",
            quantity: reversalQuantity,
            price: coefficientToDecimal(sample.secondPriceCoefficient, sample.priceScale),
            charges: charge(coefficientToDecimal(sample.secondChargeCoefficient, sample.chargeScale)),
          }),
          propertyExecution(2, {
            side: "buy",
            quantity: remainder,
            price: coefficientToDecimal(sample.exitPriceCoefficient, sample.priceScale),
            charges: charge(coefficientToDecimal(sample.thirdChargeCoefficient, sample.chargeScale)),
          }),
        ];
        assertProductionMatchesReference(executions);
        const production = runFifoPositionLedger({ ordering: orderCanonicalExecutions(executions) });
        expect(production.ledgers[0].reversalEffects[0]).toMatchObject({
          closedQuantity: closeQuantity,
          openedQuantity: remainder,
        });
        expect(runReferenceFifoLedger(orderCanonicalExecutions(executions)).reversalEffects[0]).toEqual({
          closedQuantity: closeQuantity,
          openedQuantity: remainder,
        });
      }),
      { numRuns: 1000, seed: GA0_A2_PROPERTY_TEST_SEEDS.reversals, verbose: 2 },
    );
  }, 120_000);

  it("proves only exact duplicates are suppression eligible", () => {
    fc.assert(
      fc.property(positiveCoefficient, (token) => {
        const executionId = `SYNTH-PROP-${token.toString()}`;
        const original = buildSyntheticCanonicalExecution({ executionId });
        expect(classifyExecutionRelationship(original, original).suppressionEligible).toBe(true);
        const repeated = buildSyntheticCanonicalExecution({ executionId: `${executionId}-OTHER` });
        expect(classifyExecutionRelationship(original, repeated).suppressionEligible).toBe(false);
        const reexport = buildSyntheticCanonicalExecution({
          executionId,
          sourceDocumentDigest: syntheticSourceDocumentDigest(`reexport-${token.toString()}`),
        });
        expect(classifyExecutionRelationship(original, reexport).suppressionEligible).toBe(false);
        const correction = buildSyntheticCanonicalExecution({ executionId, price: "1.2501" });
        expect(classifyExecutionRelationship(original, correction).suppressionEligible).toBe(false);
      }),
      { numRuns: 1000, seed: GA0_A2_PROPERTY_TEST_SEEDS.duplicateClassification, verbose: 2 },
    );
  }, 120_000);

  it("proves object insertion order does not affect canonical bytes or digest", () => {
    fc.assert(
      fc.property(positiveCoefficient, positiveCoefficient, (first, second) => {
        const left = { alpha: first.toString(), beta: second.toString() };
        const right = { beta: second.toString(), alpha: first.toString() };
        expect(serializeCanonicalValue(left)).toEqual(serializeCanonicalValue(right));
        expect(createCanonicalContentIdentity("canonical_content", "v1", left)).toEqual(
          createCanonicalContentIdentity("canonical_content", "v1", right),
        );
      }),
      { numRuns: 1000, seed: GA0_A2_PROPERTY_TEST_SEEDS.canonicalPropertyOrder, verbose: 2 },
    );
  }, 120_000);

  it("proves semantic fields and meaningful array order affect digest", () => {
    fc.assert(
      fc.property(positiveCoefficient, (coefficient) => {
        const base = createCanonicalContentIdentity("canonical_content", "v1", {
          field: coefficient.toString(),
          values: ["first", "second"],
        });
        const changed = createCanonicalContentIdentity("canonical_content", "v1", {
          field: (coefficient + BigInt(1)).toString(),
          values: ["first", "second"],
        });
        const reordered = createCanonicalContentIdentity("canonical_content", "v1", {
          field: coefficient.toString(),
          values: ["second", "first"],
        });
        expect(base.ok && changed.ok && reordered.ok).toBe(true);
        if (!base.ok || !changed.ok || !reordered.ok) return;
        expect(changed.value.identifier).not.toBe(base.value.identifier);
        expect(reordered.value.identifier).not.toBe(base.value.identifier);
        const explicitSortedA = ["zeta", "alpha"].sort();
        const explicitSortedB = ["alpha", "zeta"].sort();
        expect(
          createCanonicalContentIdentity("canonical_content", "v1", explicitSortedA),
        ).toEqual(createCanonicalContentIdentity("canonical_content", "v1", explicitSortedB));
      }),
      { numRuns: 1000, seed: GA0_A2_PROPERTY_TEST_SEEDS.digestSemantics, verbose: 2 },
    );
  }, 120_000);

  it("proves digest sorting never upgrades ambiguous meaningful order", () => {
    fc.assert(
      fc.property(positiveCoefficient, positiveCoefficient, (leftCoefficient, rightCoefficient) => {
        fc.pre(leftCoefficient !== rightCoefficient);
        const left = buildSyntheticCanonicalExecution({
          executionId: null,
          brokerExecutionIndex: null,
          brokerFillSequence: null,
          price: coefficientToDecimal(leftCoefficient, 4),
          originalSourceRowLocator: { kind: "record_key", value: "left", rowOrderPreserved: false },
        });
        const right = buildSyntheticCanonicalExecution({
          executionId: null,
          brokerExecutionIndex: null,
          brokerFillSequence: null,
          price: coefficientToDecimal(rightCoefficient, 4),
          originalSourceRowLocator: { kind: "record_key", value: "right", rowOrderPreserved: false },
        });
        const forward = orderCanonicalExecutions([left, right]);
        const reverse = orderCanonicalExecutions([right, left]);
        expect(forward.state).toBe("ambiguous_meaningful_order");
        expect(reverse.state).toBe("ambiguous_meaningful_order");
        expect(forward.economicallyOrderedExecutions).toBeNull();
        expect(reconstructAnalyticalPnl([left, right]).status).toBe("blocked");
      }),
      { numRuns: 1000, seed: GA0_A2_PROPERTY_TEST_SEEDS.ambiguousOrdering, verbose: 2 },
    );
  }, 120_000);
});
