import { describe, expect, it } from "vitest";

import {
  orderCanonicalExecutions,
  runFifoPositionLedger,
  type CanonicalExecutionDraft,
} from "../domain";
import {
  buildSyntheticCanonicalExecution,
  runReferenceFifoLedger,
} from "../testing";

const TIMESTAMPS = [
  "2026-07-18T14:00:01.000000000Z",
  "2026-07-18T14:00:02.000000000Z",
  "2026-07-18T14:00:03.000000000Z",
  "2026-07-18T14:00:04.000000000Z",
];

function build(index: number, overrides: Partial<CanonicalExecutionDraft>) {
  const sequence = String(index + 1);
  return buildSyntheticCanonicalExecution({
    executedAt: TIMESTAMPS[index],
    timestampPrecision: "second",
    brokerExecutionIndex: sequence,
    brokerFillSequence: sequence,
    executionId: `SYNTH-DIFF-${sequence}`,
    originalSourceRowLocator: {
      kind: "row_number",
      value: sequence,
      rowOrderPreserved: true,
    },
    charges: [],
    ...overrides,
  });
}

describe("Trader Intelligence v3 production/reference FIFO differential", () => {
  it.each([
    {
      name: "flat long partial fills",
      executions: [
        build(0, { side: "buy", quantity: "1.25", price: "0.125" }),
        build(1, { side: "buy", quantity: "2.75", price: "0.375" }),
        build(2, { side: "sell", quantity: "4", price: "0.5" }),
      ],
    },
    {
      name: "flat short partial covers",
      executions: [
        build(0, { side: "sell", quantity: "3.5", price: "5" }),
        build(1, { side: "buy", quantity: "1.25", price: "4" }),
        build(2, { side: "buy", quantity: "2.25", price: "3.5" }),
      ],
    },
    {
      name: "long short reversal",
      executions: [
        build(0, { side: "buy", quantity: "2", price: "1" }),
        build(1, { side: "sell", quantity: "5", price: "2" }),
        build(2, { side: "buy", quantity: "3", price: "1.25" }),
      ],
    },
    {
      name: "fees and rebate",
      executions: [
        build(0, {
          side: "buy",
          quantity: "10",
          price: "1",
          charges: [{ kind: "commission", amount: "0.15", currency: "USD" }],
        }),
        build(1, {
          side: "sell",
          quantity: "10",
          price: "1.2",
          charges: [{ kind: "rebate", amount: "-0.025", currency: "USD" }],
        }),
      ],
    },
  ])("matches independent reference for $name", ({ executions }) => {
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
  });
});
