import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  buildCanonicalExecution,
  classifyExecutionRelationship,
  createCanonicalContentIdentity,
  orderCanonicalExecutions,
  reconstructAnalyticalPnl,
  resolveExecutionRelationships,
  runFifoPositionLedger,
  serializeCanonicalValue,
  validateExactDecimal,
  verifyCanonicalExecutionEnvelope,
  type CanonicalExecutionDraft,
  type CanonicalExecutionEnvelope,
} from "../domain";
import {
  buildSyntheticCanonicalExecution,
  buildSyntheticAnalyticalPnlInput,
  buildSyntheticFifoLedgerInput,
  addReferenceDecimals,
  compareReferenceDecimals,
  formatReferenceDecimal,
  parseReferenceDecimal,
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
  shortToLongReversals: 2026071809,
  priorInventory: 2026071810,
  currencyIsolation: 2026071811,
  relationshipResolution: 2026071812,
  blockedStates: 2026071813,
  scaleBoundaries: 2026071814,
  precisionBoundaries: 2026071815,
  completeRelationshipCoverage: 2026071816,
  deterministicDuplicateRetention: 2026071817,
  startingInventoryTruth: 2026071818,
  immutableEnvelopeIntegrity: 2026071819,
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
  const fifoInput = buildSyntheticFifoLedgerInput(executions);
  const production = runFifoPositionLedger(fifoInput);
  const reference = runReferenceFifoLedger(ordering, fifoInput.startingInventory);
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
  expect(
    ledger.openLots.map((lot) => ({
      direction: lot.direction,
      quantity: lot.remainingQuantity,
      price: lot.price,
      sourceExecutionDigest: lot.sourceExecutionDigest,
    })),
  ).toEqual(reference.openLots);
  expect(ledger.matchedQuantities).toEqual(reference.matchedQuantityByExecution);
  ledger.matchedQuantities.forEach((match, index) => {
    expect(
      compareReferenceDecimals(
        parseReferenceDecimal(match.matchedQuantity),
        parseReferenceDecimal(executions[index].content.quantity),
      ),
    ).toBeLessThanOrEqual(0);
  });
  expect(ledger.reversalEffects).toEqual(reference.reversalEffects);
  expect(
    ledger.flatToFlatRoundTrips.map((roundTrip) => ({
      direction: roundTrip.direction,
      entryQuantity: roundTrip.entryQuantity,
      exitQuantity: roundTrip.exitQuantity,
      weightedAverageEntryPrice: roundTrip.weightedAverageEntryPrice,
      weightedAverageExitPrice: roundTrip.weightedAverageExitPrice,
      grossRealizedPnl: roundTrip.grossRealizedPnl,
      signedCharges: roundTrip.signedCharges,
      netAnalyticalPnl: roundTrip.netAnalyticalPnl,
      signedCashFlowNetPnl: roundTrip.signedCashFlowNetPnl,
      executionDigests: roundTrip.executionDigests,
    })),
  ).toEqual(reference.flatToFlatRoundTrips);
  if (ledger.endingQuantity === "0") {
    expect(ledger.netAnalyticalPnl).toBe(ledger.signedCashFlow);
  }
  const rerun = runFifoPositionLedger(buildSyntheticFifoLedgerInput(executions));
  expect(rerun).toEqual(production);
}

function runProductionFor(executions: readonly CanonicalExecutionEnvelope[]) {
  return runFifoPositionLedger(buildSyntheticFifoLedgerInput(executions));
}

function runReferenceFor(executions: readonly CanonicalExecutionEnvelope[]) {
  const input = buildSyntheticFifoLedgerInput(executions);
  return runReferenceFifoLedger(orderCanonicalExecutions(executions), input.startingInventory);
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
        expect(runReferenceFor(executions).endingQuantity).toBe("0");
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
        expect(runReferenceFor(executions).endingQuantity).toBe("0");
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
        const reference = runReferenceFor(executions);
        expect(reference.matchedQuantityByExecution.map((item) => item.matchedQuantity)).toEqual([
          "0",
          firstQuantity,
          secondQuantity,
        ]);
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
        const production = runProductionFor(executions);
        expect(production.ledgers[0].reversalEffects[0]).toMatchObject({
          closedQuantity: closeQuantity,
          openedQuantity: remainder,
        });
        expect(runReferenceFor(executions).reversalEffects[0]).toEqual({
          sourceExecutionDigest: executions[1].canonicalContentDigest,
          closedDirection: "long",
          closedQuantity: closeQuantity,
          openedDirection: "short",
          openedQuantity: remainder,
        });
        const effect = runReferenceFor(executions).reversalEffects[0];
        expect(
          formatReferenceDecimal(
            addReferenceDecimals(
              parseReferenceDecimal(effect.closedQuantity),
              parseReferenceDecimal(effect.openedQuantity),
            ),
          ),
        ).toBe(reversalQuantity);
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
        expect(
          reconstructAnalyticalPnl(
            buildSyntheticAnalyticalPnlInput([left, right]),
          ).status,
        ).toBe("blocked");
      }),
      { numRuns: 1000, seed: GA0_A2_PROPERTY_TEST_SEEDS.ambiguousOrdering, verbose: 2 },
    );
  }, 120_000);

  it("runs 1,000 generated short-to-long reversal sequences", () => {
    fc.assert(
      fc.property(financialCaseArbitrary, (sample) => {
        const closeQuantity = coefficientToDecimal(
          sample.firstQuantityCoefficient,
          sample.quantityScale,
        );
        const remainder = coefficientToDecimal(
          sample.secondQuantityCoefficient,
          sample.quantityScale,
        );
        const reversalQuantity = coefficientToDecimal(
          sample.firstQuantityCoefficient + sample.secondQuantityCoefficient,
          sample.quantityScale,
        );
        const executions = [
          propertyExecution(0, {
            side: "sell",
            quantity: closeQuantity,
            price: coefficientToDecimal(
              sample.firstPriceCoefficient,
              sample.priceScale,
            ),
            charges: charge(
              coefficientToDecimal(
                sample.firstChargeCoefficient,
                sample.chargeScale,
              ),
            ),
          }),
          propertyExecution(1, {
            side: "buy",
            quantity: reversalQuantity,
            price: coefficientToDecimal(
              sample.secondPriceCoefficient,
              sample.priceScale,
            ),
            charges: charge(
              coefficientToDecimal(
                sample.secondChargeCoefficient,
                sample.chargeScale,
              ),
            ),
          }),
          propertyExecution(2, {
            side: "sell",
            quantity: remainder,
            price: coefficientToDecimal(
              sample.exitPriceCoefficient,
              sample.priceScale,
            ),
            charges: charge(
              coefficientToDecimal(
                sample.thirdChargeCoefficient,
                sample.chargeScale,
              ),
            ),
          }),
        ];
        assertProductionMatchesReference(executions);
        const effect = runReferenceFor(executions).reversalEffects[0];
        expect(effect).toMatchObject({
          closedDirection: "short",
          closedQuantity: closeQuantity,
          openedDirection: "long",
          openedQuantity: remainder,
        });
        expect(
          formatReferenceDecimal(
            addReferenceDecimals(
              parseReferenceDecimal(effect.closedQuantity),
              parseReferenceDecimal(effect.openedQuantity),
            ),
          ),
        ).toBe(reversalQuantity);
      }),
      {
        numRuns: 1000,
        seed: GA0_A2_PROPERTY_TEST_SEEDS.shortToLongReversals,
        verbose: 2,
      },
    );
  }, 120_000);

  it("runs 1,000 generated prior-inventory fail-closed cases", () => {
    fc.assert(
      fc.property(
        positiveCoefficient,
        positiveCoefficient,
        scaleArbitrary,
        fc.constantFrom("buy" as const, "sell" as const),
        (quantityCoefficient, priceCoefficient, scale, side) => {
          const execution = propertyExecution(0, {
            side,
            quantity: coefficientToDecimal(quantityCoefficient, scale),
            price: coefficientToDecimal(priceCoefficient, scale),
            brokerPositionEffectEvidence: "close",
            charges: [],
          });
          const production = runProductionFor([execution]);
          const reference = runReferenceFor([execution]);
          expect(production).toMatchObject({
            status: "blocked",
            blockedStates: [
              { code: "ti_v3_reconstruction_prior_inventory_required" },
            ],
          });
          expect(reference).toMatchObject({
            status: "blocked",
            blockedCode: "ti_v3_reconstruction_prior_inventory_required",
          });
        },
      ),
      {
        numRuns: 1000,
        seed: GA0_A2_PROPERTY_TEST_SEEDS.priorInventory,
        verbose: 2,
      },
    );
  }, 120_000);

  it("runs 1,000 generated cross-currency isolation cases", () => {
    fc.assert(
      fc.property(positiveCoefficient, scaleArbitrary, (coefficient, scale) => {
        const quantity = coefficientToDecimal(coefficient, scale);
        const usd = propertyExecution(0, {
          quantity,
          currency: "USD",
          charges: [],
        });
        const cad = propertyExecution(1, {
          quantity,
          currency: "CAD",
          stableInstrumentKey: "instrument_synthetic_equity_cad",
          rawBrokerSymbol: "SYNTHCAD",
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
        expect(result).not.toHaveProperty("netAnalyticalPnl");
      }),
      {
        numRuns: 1000,
        seed: GA0_A2_PROPERTY_TEST_SEEDS.currencyIsolation,
        verbose: 2,
      },
    );
  }, 120_000);

  it("runs 1,000 generated exhaustive relationship-resolution cases", () => {
    fc.assert(
      fc.property(positiveCoefficient, (token) => {
        const opening = buildSyntheticCanonicalExecution({
          executionId: `SYNTH-REL-${token.toString()}`,
          charges: [],
        });
        const close = propertyExecution(1, {
          side: "sell",
          quantity: opening.content.quantity,
          price: opening.content.price,
          executionId: `SYNTH-REL-CLOSE-${token.toString()}`,
          charges: [],
        });
        const input = buildSyntheticAnalyticalPnlInput([
          opening,
          opening,
          close,
        ]);
        expect(input.relationshipResolution.coverageReceipt).toMatchObject({
          candidateRelationshipCount: 1,
          classifiedCandidateCount: 1,
          defaultDistinctPairCount: "2",
        });
        expect(reconstructAnalyticalPnl(input)).toMatchObject({
          status: "completed",
          ledgers: [{ endingQuantity: "0" }],
        });
      }),
      {
        numRuns: 1000,
        seed: GA0_A2_PROPERTY_TEST_SEEDS.relationshipResolution,
        verbose: 2,
      },
    );
  }, 120_000);

  it("runs 1,000 generated production/reference blocked-state parity cases", () => {
    const blockedCase = fc.constantFrom(
      "unsupported_security" as const,
      "corporate_action" as const,
      "symbol_change" as const,
    );
    fc.assert(
      fc.property(blockedCase, positiveCoefficient, (kind, token) => {
        const common = { executionId: `SYNTH-BLOCK-${token.toString()}` };
        const execution =
          kind === "unsupported_security"
              ? buildSyntheticCanonicalExecution({
                  ...common,
                  securityType: "preferred_stock",
                })
              : kind === "corporate_action"
                ? buildSyntheticCanonicalExecution({
                    ...common,
                    basisContinuityState: "corporate_action_unresolved",
                  })
                : buildSyntheticCanonicalExecution({
                    ...common,
                    basisContinuityState: "symbol_change_unresolved",
                  });
        const production = runProductionFor([execution]);
        const reference = runReferenceFor([execution]);
        expect(production.status).toBe("blocked");
        expect(reference.status).toBe("blocked");
        expect(production.blockedStates[0].code).toBe(reference.blockedCode);
      }),
      {
        numRuns: 1000,
        seed: GA0_A2_PROPERTY_TEST_SEEDS.blockedStates,
        verbose: 2,
      },
    );
  }, 120_000);

  it("runs 1,000 generated complete relationship-coverage receipts", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 8 }),
        positiveCoefficient,
        (count, token) => {
          const executions = Array.from({ length: count }, (_, index) =>
            buildSyntheticCanonicalExecution({
              executionId: `SYNTH-COVERAGE-${token.toString()}-${index}`,
              brokerExecutionIndex: null,
              brokerFillSequence: null,
              originalSourceRowLocator: {
                kind: "record_key",
                value: `coverage-${index}`,
                rowOrderPreserved: false,
              },
            }),
          );
          const resolution = resolveExecutionRelationships(executions);
          const expectedPairs = (count * (count - 1)) / 2;
          expect(resolution.coverageReceipt).toMatchObject({
            state: "complete",
            inputExecutionCount: count,
            candidateRelationshipCount: 0,
            classifiedCandidateCount: 0,
            defaultDistinctPairCount: expectedPairs.toString(),
          });
          expect(resolution.coverageReceipt.candidateRelationships).toHaveLength(0);
          expect(resolution.coverageReceipt).not.toHaveProperty("pairs");
        },
      ),
      {
        numRuns: 1000,
        seed: GA0_A2_PROPERTY_TEST_SEEDS.completeRelationshipCoverage,
        verbose: 2,
      },
    );
  }, 120_000);

  it("runs 1,000 generated deterministic duplicate-retention cases", () => {
    fc.assert(
      fc.property(fc.boolean(), positiveCoefficient, (validationAgrees, token) => {
        const common = {
          executionId: `SYNTH-RETENTION-${token.toString()}`,
          charges: [],
        };
        const accepted = buildSyntheticCanonicalExecution(common);
        const counterpart = buildSyntheticCanonicalExecution({
          ...common,
          validation: validationAgrees
            ? { state: "accepted", reasonCodes: [] }
            : {
                state: "quarantined",
                reasonCodes: ["ti_v3_synthetic_quarantine"],
              },
        });
        for (const executions of [
          [accepted, counterpart],
          [counterpart, accepted],
        ]) {
          const resolution = resolveExecutionRelationships(executions);
          expect(resolution.retainedExecutions).toHaveLength(
            validationAgrees ? 1 : 2,
          );
          expect(resolution.groupBlocks).toHaveLength(
            validationAgrees ? 0 : 1,
          );
        }
      }),
      {
        numRuns: 1000,
        seed: GA0_A2_PROPERTY_TEST_SEEDS.deterministicDuplicateRetention,
        verbose: 2,
      },
    );
  }, 120_000);

  it("runs 1,000 generated explicit starting-inventory truth cases", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("buy" as const, "sell" as const),
        positiveCoefficient,
        (side, token) => {
          const execution = buildSyntheticCanonicalExecution({
            side,
            executionId: `SYNTH-START-${token.toString()}`,
            charges: [],
          });
          expect(
            reconstructAnalyticalPnl(
              buildSyntheticAnalyticalPnlInput([execution], "unknown"),
            ),
          ).toMatchObject({
            status: "blocked",
            blockedStates: [
              { code: "ti_v3_reconstruction_prior_inventory_required" },
            ],
          });
          expect(
            reconstructAnalyticalPnl(
              buildSyntheticAnalyticalPnlInput([execution], "proven_flat"),
            ),
          ).toMatchObject({
            status: "completed",
            ledgers: [{ startingInventoryState: "proven_flat" }],
          });
        },
      ),
      {
        numRuns: 1000,
        seed: GA0_A2_PROPERTY_TEST_SEEDS.startingInventoryTruth,
        verbose: 2,
      },
    );
  }, 120_000);

  it("runs 1,000 generated immutable-envelope integrity cases", () => {
    fc.assert(
      fc.property(positiveCoefficient, (token) => {
        const execution = buildSyntheticCanonicalExecution({
          executionId: `SYNTH-INTEGRITY-${token.toString()}`,
        });
        const bytes = execution.canonicalBytes;
        bytes[0] = 0;
        expect(verifyCanonicalExecutionEnvelope(execution).ok).toBe(true);
        const forged = {
          ...execution,
          content: { ...execution.content, quantity: "999" },
        } as CanonicalExecutionEnvelope;
        expect(verifyCanonicalExecutionEnvelope(forged).ok).toBe(false);
        expect(resolveExecutionRelationships([forged])).toMatchObject({
          retainedExecutions: [],
          globalBlocks: [
            {
              code: "ti_v3_reconstruction_execution_envelope_integrity_invalid",
            },
          ],
        });
      }),
      {
        numRuns: 1000,
        seed: GA0_A2_PROPERTY_TEST_SEEDS.immutableEnvelopeIntegrity,
        verbose: 2,
      },
    );
  }, 120_000);

  it("runs 1,000 generated exact scale-boundary cases", () => {
    fc.assert(
      fc.property(
        positiveCoefficient,
        fc.integer({ min: 0, max: 13 }),
        (coefficient, scale) => {
          fc.pre(coefficient % BigInt(10) !== BigInt(0));
          const value = coefficientToDecimal(coefficient, scale);
          const result = buildCanonicalExecution({
            ...buildSyntheticCanonicalExecution().content,
            quantity: value,
            price: value,
            validation: { state: "accepted", reasonCodes: [] },
          });
          expect(result.ok).toBe(scale <= 12);
          if (!result.ok) {
            expect(result.error.reasonCodes).toEqual(
              expect.arrayContaining([
                "ti_v3_execution_price_invalid",
                "ti_v3_execution_quantity_invalid",
              ]),
            );
          }
        },
      ),
      {
        numRuns: 1000,
        seed: GA0_A2_PROPERTY_TEST_SEEDS.scaleBoundaries,
        verbose: 2,
      },
    );
  }, 120_000);

  it("runs 1,000 generated exact precision-boundary cases", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 47, max: 49 }),
        fc.integer({ min: 1, max: 9 }),
        (digits, leadingDigit) => {
          const value = `${leadingDigit}${"7".repeat(digits - 1)}`;
          const result = validateExactDecimal(value);
          expect(result.ok).toBe(digits <= 48);
          if (!result.ok) {
            expect(result.error.code).toBe("ti_v3_decimal_precision_exceeded");
          }
        },
      ),
      {
        numRuns: 1000,
        seed: GA0_A2_PROPERTY_TEST_SEEDS.precisionBoundaries,
        verbose: 2,
      },
    );
  }, 120_000);
});
