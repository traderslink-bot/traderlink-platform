import { describe, expect, it } from "vitest";

import {
  orderCanonicalExecutions,
  reconstructAnalyticalPnl,
  runFifoPositionLedger,
  type CanonicalExecutionDraft,
  type CanonicalExecutionEnvelope,
} from "../domain";
import { buildSyntheticCanonicalExecution } from "../testing";

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
  const result = runFifoPositionLedger({ ordering: orderCanonicalExecutions(executions) });
  expect(result.status).toBe("completed");
  expect(result.ledgers).toHaveLength(1);
  return result.ledgers[0];
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
      ordering: orderCanonicalExecutions([
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
    const result = runFifoPositionLedger({
      ordering: orderCanonicalExecutions([
        execution(0, {
          instrumentResolutionState: instrumentState,
          stableInstrumentKey: instrumentState === "resolved" ? "instrument_synthetic_equity" : null,
          basisContinuityState: basisState,
        }),
      ]),
    });
    expect(result).toMatchObject({ status: "blocked", blockedStates: [{ code }] });
  });

  it("keeps USD and CAD in separate ledgers without a cross-currency total", () => {
    const result = reconstructAnalyticalPnl([
      execution(0, { currency: "USD", charges: [] }),
      execution(1, {
        currency: "CAD",
        stableInstrumentKey: "instrument_synthetic_equity_cad",
        charges: [],
      }),
    ]);
    expect(result.status).toBe("completed");
    expect(result.ledgers.map((item) => item.currency).sort()).toEqual(["CAD", "USD"]);
    expect(result).not.toHaveProperty("netAnalyticalPnl");
  });
});
