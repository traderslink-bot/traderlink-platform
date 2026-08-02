import { describe, expect, it } from "vitest";

import type {
  JournalAnalyticsAllocationFact,
  JournalAnalyticsFactSet,
  JournalAnalyticsRoundTripFact,
} from "@/src/modules/journal/contracts/journal-analytics-fact-set";

import { independentlyReconstructJournalAnalytics } from "./verify-traderlink-platform-journal-analytics";

function allocation(input: Readonly<{
  allocationId: string;
  allocationSequence: number;
  executionId: string;
  executionVersionId: string;
  side: "buy" | "sell";
  quantity: string;
  executionQuantity: string;
  price: string;
  fee: string | null;
  role: JournalAnalyticsAllocationFact["allocationRole"];
}>): JournalAnalyticsAllocationFact {
  return Object.freeze({
    allocationId: input.allocationId,
    allocationSequence: input.allocationSequence,
    allocationRole: input.role,
    executionId: input.executionId,
    executionVersionId: input.executionVersionId,
    executionState: "accepted",
    executedAtUtc: input.side === "buy"
      ? "2026-01-02T14:30:00.000Z"
      : "2026-01-02T15:30:00.000Z",
    sourceOrderKey: `${input.side}-${input.allocationSequence}`,
    side: input.side,
    allocatedQuantityDecimal: input.quantity,
    executionQuantityDecimal: input.executionQuantity,
    priceDecimal: input.price,
    feesDecimal: input.fee,
    feeCurrency: input.fee === null ? null : "USD",
    feeSignConvention: input.fee === null
      ? "not_reported"
      : "broker_reported_signed",
    factCompleteness: "complete",
    provenanceKinds: Object.freeze(["broker" as const]),
    feePolicyCandidates: Object.freeze([Object.freeze({
      sourceSystem: "ibkr",
      adapterId: "ibkr_activity_statement",
      adapterVersion: "ibkr_activity_statement_v1",
      provenanceKind: "broker" as const,
    })]),
  });
}

function roundTrip(
  roundTripId: string,
  allocations: readonly JournalAnalyticsAllocationFact[],
): JournalAnalyticsRoundTripFact {
  return Object.freeze({
    roundTripId,
    roundTripVersionId: `${roundTripId}-version`,
    versionNumber: 1,
    accountId: "account",
    instrumentId: "instrument",
    displayedSymbol: "TEST",
    assetClass: "stock",
    tradeCurrency: "USD",
    direction: "long",
    openedAtUtc: "2026-01-02T14:30:00.000Z",
    closedAtUtc: "2026-01-02T15:30:00.000Z",
    finalPositionDecimal: "0",
    projectionState: "ready_closed",
    coverageReasonCode: null,
    projectionFingerprintSha256: "a".repeat(64),
    rebuild: Object.freeze({
      rebuildId: "rebuild",
      chainKeySha256: "b".repeat(64),
      algorithmVersion: "test",
      orderedInputSha256: "c".repeat(64),
      outputSha256: "d".repeat(64),
      coverageState: "complete",
      readyClosedCount: 2,
      legitimateOpenCount: 0,
      needsDecisionCount: 0,
      excludedCount: 0,
      completedAtUtc: "2026-01-02T16:00:00.000Z",
    }),
    allocations: Object.freeze([...allocations]),
    pendingDecisionIds: Object.freeze([]),
    pendingDecisionReasonCodes: Object.freeze([]),
  });
}

function factSet(
  roundTrips: readonly JournalAnalyticsRoundTripFact[],
): JournalAnalyticsFactSet {
  return Object.freeze({
    contractVersion: "journal_analytics_fact_set_v1",
    workspaceId: "workspace",
    requestedAccountIds: Object.freeze(["account"]),
    requestedClosingDateRange: Object.freeze({ kind: "all_available" }),
    requestedCurrencySelection: Object.freeze({ kind: "all_partitions" }),
    generatedAtUtc: "2026-01-02T16:00:00.000Z",
    sourceRevisionSha256: "e".repeat(64),
    earliestAvailableLocalDate: "2026-01-02",
    latestAvailableLocalDate: "2026-01-02",
    accounts: Object.freeze([]),
    roundTrips: Object.freeze([...roundTrips]),
    pendingDecisions: Object.freeze([]),
  });
}

describe("private Journal Analytics independent reconciliation", () => {
  it("reconstructs split execution charges with exact largest-remainder allocation", () => {
    const first = roundTrip("round-trip-1", [
      allocation({
        allocationId: "buy-1",
        allocationSequence: 1,
        executionId: "buy",
        executionVersionId: "buy-v1",
        side: "buy",
        quantity: "1",
        executionQuantity: "3",
        price: "10",
        fee: "-0.01",
        role: "opening",
      }),
      allocation({
        allocationId: "sell-1",
        allocationSequence: 1,
        executionId: "sell",
        executionVersionId: "sell-v1",
        side: "sell",
        quantity: "1",
        executionQuantity: "3",
        price: "11",
        fee: "-0.02",
        role: "closing",
      }),
    ]);
    const second = roundTrip("round-trip-2", [
      allocation({
        allocationId: "buy-2",
        allocationSequence: 2,
        executionId: "buy",
        executionVersionId: "buy-v1",
        side: "buy",
        quantity: "2",
        executionQuantity: "3",
        price: "10",
        fee: "-0.01",
        role: "opening",
      }),
      allocation({
        allocationId: "sell-2",
        allocationSequence: 2,
        executionId: "sell",
        executionVersionId: "sell-v1",
        side: "sell",
        quantity: "2",
        executionQuantity: "3",
        price: "12",
        fee: "-0.02",
        role: "closing",
      }),
    ]);

    const result = independentlyReconstructJournalAnalytics(
      factSet([first, second]),
    );

    expect(result.realizedCount).toBe(2);
    expect(result.feeCompleteCount).toBe(2);
    expect(result.feeIncompleteCount).toBe(0);
    expect(result.grossPnlDecimal).toBe("5");
    expect(result.chargeCostDecimal).toBe("0.03");
    expect(result.chargeCreditDecimal).toBe("0");
    expect(result.netPnlDecimal).toBe("4.97");
    expect(result.rows).toEqual([
      expect.objectContaining({
        roundTripId: "round-trip-1",
        grossPnlDecimal: "1",
        chargeCostDecimal: "0.01",
        netPnlDecimal: "0.99",
      }),
      expect.objectContaining({
        roundTripId: "round-trip-2",
        grossPnlDecimal: "4",
        chargeCostDecimal: "0.02",
        netPnlDecimal: "3.98",
      }),
    ]);
    expect(result.rowDigestSha256).toMatch(/^[0-9a-f]{64}$/u);
  });

  it("keeps gross facts while excluding fee-incomplete rows from net totals", () => {
    const trade = roundTrip("round-trip-1", [
      allocation({
        allocationId: "buy-1",
        allocationSequence: 1,
        executionId: "buy",
        executionVersionId: "buy-v1",
        side: "buy",
        quantity: "1",
        executionQuantity: "1",
        price: "10",
        fee: null,
        role: "opening",
      }),
      allocation({
        allocationId: "sell-1",
        allocationSequence: 1,
        executionId: "sell",
        executionVersionId: "sell-v1",
        side: "sell",
        quantity: "1",
        executionQuantity: "1",
        price: "11",
        fee: null,
        role: "closing",
      }),
    ]);

    const result = independentlyReconstructJournalAnalytics(factSet([trade]));

    expect(result.realizedCount).toBe(1);
    expect(result.feeCompleteCount).toBe(0);
    expect(result.feeIncompleteCount).toBe(1);
    expect(result.grossPnlDecimal).toBe("1");
    expect(result.netPnlDecimal).toBe("0");
    expect(result.rows[0]).toEqual(expect.objectContaining({
      chargeCoverage: "unavailable",
      chargeCostDecimal: null,
      chargeCreditDecimal: null,
      netPnlDecimal: null,
    }));
  });
});
