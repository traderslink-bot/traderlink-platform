import { describe, expect, it } from "vitest";

import {
  buildStartingInventoryContract,
  buildStartingInventoryForExecution,
  orderCanonicalExecutions,
  reconstructAnalyticalPnl,
  runFifoPositionLedger,
  type CanonicalExecutionDraft,
  type CanonicalExecutionEnvelope,
  type CanonicalExecutionOrderingResult,
  type CompleteExecutionRelationshipResolution,
} from "../domain";
import {
  buildSyntheticAnalyticalPnlInput,
  buildSyntheticCanonicalExecution,
  buildSyntheticFifoLedgerInput,
} from "../testing";

const TIMESTAMPS = [
  "2026-07-18T13:45:01.000000000Z",
  "2026-07-18T13:45:02.000000000Z",
  "2026-07-18T13:45:03.000000000Z",
  "2026-07-18T13:45:04.000000000Z",
  "2026-07-18T13:45:05.000000000Z",
  "2026-07-18T13:45:06.000000000Z",
];

function execution(
  index: number,
  overrides: Partial<CanonicalExecutionDraft>,
): CanonicalExecutionEnvelope {
  const sequence = String(index + 1);
  return buildSyntheticCanonicalExecution({
    executedAt: TIMESTAMPS[index],
    timestampPrecision: "second",
    brokerExecutionIndex: sequence,
    brokerFillSequence: sequence,
    executionId: `SYNTH-FIFO-${sequence}`,
    originalSourceRowLocator: {
      kind: "row_number",
      value: sequence,
      rowOrderPreserved: true,
    },
    charges: [],
    ...overrides,
  });
}

function ledger(executions: readonly CanonicalExecutionEnvelope[]) {
  const result = runFifoPositionLedger(buildSyntheticFifoLedgerInput(executions));
  expect(result.status).toBe("completed");
  expect(result.ledgers).toHaveLength(1);
  return result.ledgers[0];
}

function priorLotInput(
  provenance: CanonicalExecutionEnvelope,
  ledgerExecution: CanonicalExecutionEnvelope,
  overrides: Record<string, unknown> = {},
) {
  return {
    lotId: `prior_lot_${provenance.content.originalSourceRowLocator.value}`,
    direction: provenance.content.side === "buy" ? "long" : "short",
    acquiredAt: provenance.content.executedAt,
    fifoOrdinal: provenance.content.originalSourceRowLocator.value,
    remainingQuantity: provenance.content.quantity,
    price: provenance.content.price,
    basisPolicy: "execution_price_with_explicit_charges",
    signedCharges: [],
    chargeCoverageState: "complete",
    canonicalOwnerKey: ledgerExecution.content.canonicalOwnerKey,
    canonicalAccountKey: ledgerExecution.content.canonicalAccountKey,
    stableInstrumentKey: ledgerExecution.content.stableInstrumentKey,
    currency: ledgerExecution.content.currency,
    sourceIdentity: provenance.content.sourceIdentity,
    sourceKind: provenance.content.sourceKind,
    evidenceClass: provenance.content.evidenceClass,
    sourceDocumentDigest: provenance.content.sourceDocumentDigest,
    originalSourceRowLocator: provenance.content.originalSourceRowLocator,
    sourceExecutionDigest: provenance.canonicalContentDigest,
    ...overrides,
  };
}

function acceptedStartingInventory(
  ledgerExecution: CanonicalExecutionEnvelope,
  priorLots: readonly Record<string, unknown>[],
  overrides: Record<string, unknown> = {},
) {
  return buildStartingInventoryContract({
    state: "accepted_prior_lots",
    asOf: ledgerExecution.content.executedAt,
    coverageState: "complete",
    ledgerIdentity: {
      canonicalOwnerKey: ledgerExecution.content.canonicalOwnerKey,
      canonicalAccountKey: ledgerExecution.content.canonicalAccountKey,
      stableInstrumentKey: ledgerExecution.content.stableInstrumentKey,
      currency: ledgerExecution.content.currency,
    },
    priorLots,
    ...overrides,
  });
}

describe("Trader Intelligence v3 FIFO analytical P/L", () => {
  it("calculates an exact simple long round trip", () => {
    const result = ledger([
      execution(0, { side: "buy", quantity: "10", price: "1" }),
      execution(1, { side: "sell", quantity: "10", price: "1.5" }),
    ]);
    expect(result).toMatchObject({
      endingQuantity: "0",
      grossRealizedPnl: "5",
      signedCharges: "0",
      netAnalyticalPnl: "5",
      signedCashFlow: "5",
      openLots: [],
    });
    expect(result.flatToFlatRoundTrips[0]).toMatchObject({
      weightedAverageEntryPrice: { numerator: "1", denominator: "1" },
      weightedAverageExitPrice: { numerator: "3", denominator: "2" },
    });
  });

  it("matches multiple long entries and exits FIFO exactly", () => {
    const result = ledger([
      execution(0, { side: "buy", quantity: "10", price: "1" }),
      execution(1, { side: "buy", quantity: "5", price: "2" }),
      execution(2, { side: "sell", quantity: "8", price: "3" }),
      execution(3, { side: "sell", quantity: "7", price: "2.5" }),
    ]);
    expect(result.endingQuantity).toBe("0");
    expect(result.grossRealizedPnl).toBe("21.5");
    expect(result.flatToFlatRoundTrips[0].weightedAverageEntryPrice).toEqual({
      numerator: "4",
      denominator: "3",
    });
  });

  it("calculates a simple short and multiple covers", () => {
    const result = ledger([
      execution(0, { side: "sell", quantity: "12", price: "2" }),
      execution(1, { side: "buy", quantity: "5", price: "1.5" }),
      execution(2, { side: "buy", quantity: "7", price: "1" }),
    ]);
    expect(result).toMatchObject({
      endingQuantity: "0",
      grossRealizedPnl: "9.5",
      netAnalyticalPnl: "9.5",
    });
  });

  it("conserves positive commissions and negative rebates exactly", () => {
    const result = ledger([
      execution(0, {
        side: "buy",
        quantity: "10",
        price: "1",
        charges: [{ kind: "commission", amount: "0.1", currency: "USD" }],
      }),
      execution(1, {
        side: "sell",
        quantity: "10",
        price: "1.5",
        charges: [{ kind: "liquidity_rebate", amount: "-0.025", currency: "USD" }],
      }),
    ]);
    expect(result).toMatchObject({
      grossRealizedPnl: "5",
      signedCharges: "0.075",
      netAnalyticalPnl: "4.925",
      signedCashFlow: "4.925",
    });
  });

  it("handles long-to-short reversal without fabricating executions", () => {
    const result = ledger([
      execution(0, { side: "buy", quantity: "10", price: "1" }),
      execution(1, { side: "sell", quantity: "15", price: "2" }),
      execution(2, { side: "buy", quantity: "5", price: "1.5" }),
    ]);
    expect(result).toMatchObject({ endingQuantity: "0", grossRealizedPnl: "12.5" });
    expect(result.reversalEffects).toEqual([
      expect.objectContaining({
        closedDirection: "long",
        closedQuantity: "10",
        openedDirection: "short",
        openedQuantity: "5",
      }),
    ]);
    expect(result.reversalEffects[0].sourceExecutionDigest).toBe(
      result.inputExecutionDigests[1],
    );
  });

  it("handles short-to-long reversal", () => {
    const result = ledger([
      execution(0, { side: "sell", quantity: "8", price: "2" }),
      execution(1, { side: "buy", quantity: "11", price: "1" }),
      execution(2, { side: "sell", quantity: "3", price: "1.5" }),
    ]);
    expect(result).toMatchObject({ endingQuantity: "0", grossRealizedPnl: "9.5" });
    expect(result.reversalEffects[0]).toMatchObject({
      closedDirection: "short",
      closedQuantity: "8",
      openedDirection: "long",
      openedQuantity: "3",
    });
  });

  it("preserves open long and short lots without unrealized P/L", () => {
    const long = ledger([
      execution(0, { side: "buy", quantity: "2.5", price: "0.123456789012" }),
    ]);
    expect(long).toMatchObject({
      endingQuantity: "2.5",
      grossRealizedPnl: "0",
      limitations: ["ti_v3_open_inventory_remaining"],
    });
    const short = ledger([
      execution(0, { side: "sell", quantity: "1.25", price: "3" }),
    ]);
    expect(short.endingQuantity).toBe("-1.25");
    expect(short.openLots[0].direction).toBe("short");
  });

  it.each([
    ["sell", "ti_v3_reconstruction_prior_inventory_required"],
    ["buy", "ti_v3_reconstruction_prior_inventory_required"],
  ] as const)("blocks missing prior inventory for a declared %s close", (side, code) => {
    const result = runFifoPositionLedger({
      ...buildSyntheticFifoLedgerInput([
        execution(0, {
          side,
          brokerPositionEffectEvidence: "close",
          quantity: "5",
          price: "1",
        }),
      ]),
    });
    expect(result).toMatchObject({ status: "blocked", blockedStates: [{ code }] });
  });

  it.each([
    ["unresolved", "resolved", "ti_v3_reconstruction_instrument_unresolved"],
    ["resolved", "corporate_action_unresolved", "ti_v3_reconstruction_corporate_action_basis_unresolved"],
    ["resolved", "symbol_change_unresolved", "ti_v3_reconstruction_symbol_continuity_unresolved"],
  ] as const)("blocks unsafe instrument or basis continuity", (instrumentState, basisState, code) => {
    const executions = [
      execution(0, {
          instrumentResolutionState: instrumentState,
          stableInstrumentKey: instrumentState === "resolved" ? "instrument_synthetic_equity" : null,
          basisContinuityState: basisState,
      }),
    ];
    const result = reconstructAnalyticalPnl(
      buildSyntheticAnalyticalPnlInput(executions),
    );
    expect(result).toMatchObject({ status: "blocked", blockedStates: [{ code }] });
  });

  it("keeps USD and CAD in separate ledgers without a cross-currency total", () => {
    const executions = [
      execution(0, { currency: "USD", charges: [] }),
      execution(1, {
        currency: "CAD",
        stableInstrumentKey: "instrument_synthetic_equity_cad",
        charges: [],
      }),
    ];
    const result = reconstructAnalyticalPnl(
      buildSyntheticAnalyticalPnlInput(executions),
    );
    expect(result.status).toBe("completed");
    expect(result.ledgers.map((item) => item.currency).sort()).toEqual(["CAD", "USD"]);
    expect(result).not.toHaveProperty("netAnalyticalPnl");
  });

  it.each(["buy", "sell"] as const)(
    "blocks an unknown starting inventory before interpreting an opening %s",
    (side) => {
      const first = execution(0, { side, brokerPositionEffectEvidence: "unknown" });
      const startingInventory = buildStartingInventoryForExecution(first, "unknown");
      expect(startingInventory.ok).toBe(true);
      if (!startingInventory.ok) return;
      const result = runFifoPositionLedger(
        buildSyntheticFifoLedgerInput([first], startingInventory.value),
      );
      expect(result).toMatchObject({
        status: "blocked",
        blockedStates: [{ code: "ti_v3_reconstruction_prior_inventory_required" }],
      });
    },
  );

  it.each([
    ["long", "sell", "2", "3", "5"],
    ["short", "buy", "3", "2", "5"],
  ] as const)(
    "matches accepted prior %s lots with exact provenance",
    (direction, side, entryPrice, exitPrice, expectedGross) => {
      const close = execution(1, {
        side,
        quantity: "5",
        price: exitPrice,
        brokerPositionEffectEvidence: "close",
      });
      const provenance = execution(0, {
        side: direction === "long" ? "buy" : "sell",
        quantity: "5",
        price: entryPrice,
      });
      const startingInventory = buildStartingInventoryContract({
        state: "accepted_prior_lots",
        asOf: close.content.executedAt,
        coverageState: "complete",
        ledgerIdentity: {
          canonicalOwnerKey: close.content.canonicalOwnerKey,
          canonicalAccountKey: close.content.canonicalAccountKey,
          stableInstrumentKey: close.content.stableInstrumentKey,
          currency: close.content.currency,
        },
        priorLots: [
          {
            lotId: `prior_lot_synthetic_${direction}`,
            direction,
            acquiredAt: provenance.content.executedAt,
            fifoOrdinal: "1",
            remainingQuantity: "5",
            price: entryPrice,
            basisPolicy: "execution_price_with_explicit_charges",
            signedCharges: [],
            chargeCoverageState: "complete",
            canonicalOwnerKey: close.content.canonicalOwnerKey,
            canonicalAccountKey: close.content.canonicalAccountKey,
            stableInstrumentKey: close.content.stableInstrumentKey,
            currency: close.content.currency,
            sourceIdentity: provenance.content.sourceIdentity,
            sourceKind: provenance.content.sourceKind,
            evidenceClass: provenance.content.evidenceClass,
            sourceDocumentDigest: provenance.content.sourceDocumentDigest,
            originalSourceRowLocator: provenance.content.originalSourceRowLocator,
            sourceExecutionDigest: provenance.canonicalContentDigest,
          },
        ],
      });
      expect(startingInventory.ok).toBe(true);
      if (!startingInventory.ok) return;
      const result = runFifoPositionLedger(
        buildSyntheticFifoLedgerInput([close], startingInventory.value),
      );
      expect(result).toMatchObject({
        status: "completed",
        ledgers: [
          {
            endingQuantity: "0",
            grossRealizedPnl: expectedGross,
            startingInventoryState: "accepted_prior_lots",
            inputStartingLotIds: [`prior_lot_synthetic_${direction}`],
          },
        ],
      });
    },
  );

  it("does not allow raw FIFO to bypass opaque relationship coverage", () => {
    const first = execution(0, { side: "buy" });
    const input = buildSyntheticFifoLedgerInput([first]);
    const forgedResolution = {
      ...input.relationshipResolution,
    } as CompleteExecutionRelationshipResolution;
    expect(
      runFifoPositionLedger({
        ...input,
        relationshipResolution: forgedResolution,
      }),
    ).toMatchObject({
      status: "blocked",
      ledgers: [],
      blockedStates: [
        { code: "ti_v3_reconstruction_relationship_coverage_incomplete" },
      ],
    });
  });

  it.each([
    ["reversed", (items: readonly CanonicalExecutionEnvelope[]) => [...items].reverse()],
    ["empty", () => []],
    ["omitted", (items: readonly CanonicalExecutionEnvelope[]) => items.slice(0, -1)],
    ["duplicated", (items: readonly CanonicalExecutionEnvelope[]) => [...items, items[0]]],
    [
      "substituted",
      (items: readonly CanonicalExecutionEnvelope[]) => [
        ...items.slice(0, -1),
        execution(4, { side: "sell", quantity: "5", price: "9" }),
      ],
    ],
  ] as const)("rejects a forged %s economic ordering array", (_case, mutate) => {
    const executions = [
      execution(0, { side: "buy", quantity: "5", price: "1" }),
      execution(1, { side: "buy", quantity: "5", price: "2" }),
      execution(2, { side: "sell", quantity: "5", price: "3" }),
    ];
    const input = buildSyntheticFifoLedgerInput(executions);
    const forgedOrdering = {
      ...input.ordering,
      economicallyOrderedExecutions: mutate(
        input.ordering.economicallyOrderedExecutions ?? [],
      ),
    } as CanonicalExecutionOrderingResult;
    expect(runFifoPositionLedger({ ...input, ordering: forgedOrdering })).toMatchObject({
      status: "blocked",
      ledgers: [],
      blockedStates: [{ code: "ti_v3_reconstruction_order_integrity_invalid" }],
    });
  });

  it("rejects a copied ordering receipt containing a modified envelope", () => {
    const input = buildSyntheticFifoLedgerInput([
      execution(0, { side: "buy", quantity: "5", price: "1" }),
      execution(1, { side: "sell", quantity: "5", price: "2" }),
    ]);
    const authentic = input.ordering.economicallyOrderedExecutions ?? [];
    const modified = {
      ...authentic[0],
      content: { ...authentic[0].content, price: "99" },
    } as CanonicalExecutionEnvelope;
    const forgedOrdering = {
      ...input.ordering,
      economicallyOrderedExecutions: [modified, ...authentic.slice(1)],
    } as CanonicalExecutionOrderingResult;
    expect(runFifoPositionLedger({ ...input, ordering: forgedOrdering })).toMatchObject({
      status: "blocked",
      blockedStates: [{ code: "ti_v3_reconstruction_order_integrity_invalid" }],
    });
  });

  it("rejects an authentic ordering receipt built from substituted equivalent envelopes", () => {
    const originals = [
      execution(0, { side: "buy", quantity: "5", price: "1" }),
      execution(1, { side: "sell", quantity: "5", price: "2" }),
    ];
    const input = buildSyntheticFifoLedgerInput(originals);
    const substitutes = [
      execution(0, { side: "buy", quantity: "5", price: "1" }),
      execution(1, { side: "sell", quantity: "5", price: "2" }),
    ];
    expect(substitutes[0]).not.toBe(originals[0]);
    expect(substitutes[0].canonicalContentDigest).toBe(
      originals[0].canonicalContentDigest,
    );
    expect(
      runFifoPositionLedger({
        ...input,
        ordering: orderCanonicalExecutions(substitutes),
      }),
    ).toMatchObject({
      status: "blocked",
      blockedStates: [{ code: "ti_v3_reconstruction_order_integrity_invalid" }],
    });
  });

  it("uses only an authentic frozen order and is invariant to caller permutation", () => {
    const executions = [
      execution(0, { side: "buy", quantity: "5", price: "1" }),
      execution(1, { side: "buy", quantity: "5", price: "2" }),
      execution(2, { side: "sell", quantity: "5", price: "3" }),
    ];
    const forward = runFifoPositionLedger(buildSyntheticFifoLedgerInput(executions));
    const reverse = runFifoPositionLedger(
      buildSyntheticFifoLedgerInput([...executions].reverse()),
    );
    expect(forward).toMatchObject({
      status: "completed",
      ledgers: [{ grossRealizedPnl: "10", endingQuantity: "5" }],
    });
    expect(reverse).toEqual(forward);
    const ordering = buildSyntheticFifoLedgerInput(executions).ordering;
    expect(Object.isFrozen(ordering)).toBe(true);
    expect(Object.isFrozen(ordering.storageOrderedExecutions)).toBe(true);
    expect(Object.isFrozen(ordering.economicallyOrderedExecutions)).toBe(true);
  });

  it("rejects accepted prior lots whose ledger identity does not match", () => {
    const close = execution(1, { side: "sell" });
    const provenance = execution(0, { side: "buy" });
    expect(
      buildStartingInventoryContract({
        state: "accepted_prior_lots",
        asOf: close.content.executedAt,
        coverageState: "complete",
        ledgerIdentity: {
          canonicalOwnerKey: close.content.canonicalOwnerKey,
          canonicalAccountKey: close.content.canonicalAccountKey,
          stableInstrumentKey: close.content.stableInstrumentKey,
          currency: close.content.currency,
        },
        priorLots: [
          {
            lotId: "prior_lot_identity_mismatch",
            direction: "long",
            acquiredAt: provenance.content.executedAt,
            fifoOrdinal: "1",
            remainingQuantity: "5",
            price: "1",
            basisPolicy: "execution_price_with_explicit_charges",
            signedCharges: [],
            chargeCoverageState: "complete",
            canonicalOwnerKey: close.content.canonicalOwnerKey,
            canonicalAccountKey: "account_synthetic_other",
            stableInstrumentKey: close.content.stableInstrumentKey,
            currency: close.content.currency,
            sourceIdentity: provenance.content.sourceIdentity,
            sourceKind: provenance.content.sourceKind,
            evidenceClass: provenance.content.evidenceClass,
            sourceDocumentDigest: provenance.content.sourceDocumentDigest,
            originalSourceRowLocator: provenance.content.originalSourceRowLocator,
            sourceExecutionDigest: provenance.canonicalContentDigest,
          },
        ],
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "ti_v3_starting_inventory_invalid",
        reasonCodes: [
          "ti_v3_starting_inventory_prior_lot_identity_mismatch",
        ],
      },
    });
  });

  it("canonicalizes prior-lot FIFO order independently of caller array order", () => {
    const firstPrior = execution(0, { side: "buy", quantity: "5", price: "1" });
    const secondPrior = execution(1, { side: "buy", quantity: "5", price: "2" });
    const close = execution(2, {
      side: "sell",
      quantity: "5",
      price: "3",
      brokerPositionEffectEvidence: "close",
    });
    const firstLot = priorLotInput(firstPrior, close, { lotId: "prior_lot_first" });
    const secondLot = priorLotInput(secondPrior, close, { lotId: "prior_lot_second" });
    const forward = acceptedStartingInventory(close, [firstLot, secondLot]);
    const reverse = acceptedStartingInventory(close, [secondLot, firstLot]);
    expect(forward.ok).toBe(true);
    expect(reverse).toEqual(forward);
    if (!forward.ok || !reverse.ok) return;
    expect(forward.value.priorLots.map((lot) => lot.lotId)).toEqual([
      "prior_lot_first",
      "prior_lot_second",
    ]);
    const forwardResult = runFifoPositionLedger(
      buildSyntheticFifoLedgerInput([close], forward.value),
    );
    const reverseResult = runFifoPositionLedger(
      buildSyntheticFifoLedgerInput([close], reverse.value),
    );
    expect(forwardResult).toEqual(reverseResult);
    expect(forwardResult).toMatchObject({
      ledgers: [{ grossRealizedPnl: "10", endingQuantity: "5" }],
    });
  });

  it.each([
    ["lot ID", { lotId: "prior_lot_duplicate" }, "ti_v3_starting_inventory_prior_lot_duplicate_id"],
    [
      "source execution",
      { sourceExecutionDigest: "reuse-first" },
      "ti_v3_starting_inventory_prior_lot_duplicate_execution",
    ],
  ] as const)("rejects duplicate prior-lot %s evidence", (_case, duplicate, code) => {
    const firstPrior = execution(0, { side: "buy", quantity: "5", price: "1" });
    const secondPrior = execution(1, { side: "buy", quantity: "5", price: "2" });
    const close = execution(2, { side: "sell", quantity: "5", price: "3" });
    const first = priorLotInput(firstPrior, close, {
      lotId: "prior_lot_duplicate",
      fifoOrdinal: "1",
    });
    const secondOverrides =
      "sourceExecutionDigest" in duplicate &&
      duplicate.sourceExecutionDigest === "reuse-first"
        ? { sourceExecutionDigest: firstPrior.canonicalContentDigest }
        : duplicate;
    const second = priorLotInput(secondPrior, close, {
      lotId: "prior_lot_second_unique",
      fifoOrdinal: "2",
      ...secondOverrides,
    });
    const result = acceptedStartingInventory(close, [first, second]);
    expect(result).toMatchObject({ ok: false, error: { reasonCodes: [code] } });
  });

  it("blocks overlap between a prior source execution and current occurrences", () => {
    const provenance = execution(0, { side: "buy", quantity: "5", price: "1" });
    const current = execution(2, { side: "sell", quantity: "5", price: "2" });
    const start = acceptedStartingInventory(current, [
      priorLotInput(provenance, current, {
        sourceExecutionDigest: current.canonicalContentDigest,
      }),
    ]);
    expect(start.ok).toBe(true);
    if (!start.ok) return;
    expect(
      runFifoPositionLedger(buildSyntheticFifoLedgerInput([current], start.value)),
    ).toMatchObject({
      status: "blocked",
      blockedStates: [{ code: "ti_v3_reconstruction_prior_inventory_overlap" }],
    });
  });

  it("includes prior signed commission in exact net analytical P/L", () => {
    const provenance = execution(0, { side: "buy", quantity: "5", price: "1" });
    const close = execution(2, {
      side: "sell",
      quantity: "5",
      price: "2",
      brokerPositionEffectEvidence: "close",
    });
    const start = acceptedStartingInventory(close, [
      priorLotInput(provenance, close, {
        signedCharges: [{ kind: "commission", amount: "0.25", currency: "USD" }],
      }),
    ]);
    expect(start.ok).toBe(true);
    if (!start.ok) return;
    expect(runFifoPositionLedger(buildSyntheticFifoLedgerInput([close], start.value))).toMatchObject({
      status: "completed",
      ledgers: [
        {
          grossRealizedPnl: "5",
          signedCharges: "0.25",
          netAnalyticalPnl: "4.75",
          signedCashFlow: "4.75",
        },
      ],
    });
  });

  it("blocks incomplete prior-charge coverage", () => {
    const provenance = execution(0, { side: "buy", quantity: "5", price: "1" });
    const close = execution(2, { side: "sell", quantity: "5", price: "2" });
    const start = acceptedStartingInventory(
      close,
      [priorLotInput(provenance, close, { chargeCoverageState: "incomplete" })],
      { coverageState: "incomplete_prior_charges" },
    );
    expect(start.ok).toBe(true);
    if (!start.ok) return;
    expect(runFifoPositionLedger(buildSyntheticFifoLedgerInput([close], start.value))).toMatchObject({
      status: "blocked",
      blockedStates: [
        { code: "ti_v3_reconstruction_prior_charge_coverage_incomplete" },
      ],
    });
  });

  it.each([
    ["long", "buy", "5"],
    ["short", "sell", "-5"],
  ] as const)("preserves starting-only open %s inventory", (_direction, side, endingQuantity) => {
    const provenance = execution(0, { side, quantity: "5", price: "1" });
    const start = buildStartingInventoryContract({
      state: "accepted_prior_lots",
      asOf: TIMESTAMPS[2],
      coverageState: "complete",
      ledgerIdentity: {
        canonicalOwnerKey: provenance.content.canonicalOwnerKey,
        canonicalAccountKey: provenance.content.canonicalAccountKey,
        stableInstrumentKey: provenance.content.stableInstrumentKey,
        currency: provenance.content.currency,
      },
      priorLots: [priorLotInput(provenance, provenance)],
    });
    expect(start.ok).toBe(true);
    if (!start.ok) return;
    const result = reconstructAnalyticalPnl({
      relationshipResolution: buildSyntheticAnalyticalPnlInput([]).relationshipResolution,
      startingInventories: [start.value],
    });
    expect(result).toMatchObject({
      status: "completed",
      ledgers: [
        {
          endingQuantity,
          limitations: ["ti_v3_open_inventory_remaining"],
          inputExecutionDigests: [],
        },
      ],
    });
  });

  it("fails closed for prior-lot and current-execution as-of violations", () => {
    const provenance = execution(1, { side: "buy", quantity: "5", price: "1" });
    const close = execution(2, { side: "sell", quantity: "5", price: "2" });
    expect(
      acceptedStartingInventory(close, [
        priorLotInput(provenance, close, { acquiredAt: close.content.executedAt }),
      ]),
    ).toMatchObject({
      ok: false,
      error: { reasonCodes: ["ti_v3_starting_inventory_prior_lot_order_invalid"] },
    });

    const start = acceptedStartingInventory(close, [priorLotInput(provenance, close)], {
      asOf: "2026-07-18T13:45:04.000000000Z",
    });
    expect(start.ok).toBe(true);
    if (!start.ok) return;
    expect(runFifoPositionLedger(buildSyntheticFifoLedgerInput([close], start.value))).toMatchObject({
      status: "blocked",
      blockedStates: [
        { code: "ti_v3_reconstruction_starting_inventory_as_of_violation" },
      ],
    });
  });
});
