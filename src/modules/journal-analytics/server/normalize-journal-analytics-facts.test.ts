import type {
  JournalAnalyticsAllocationFact,
  JournalAnalyticsFactSet,
  JournalAnalyticsRoundTripFact,
} from "@/src/modules/journal/contracts/journal-analytics-fact-set";
import { JOURNAL_ANALYTICS_FACT_SET_CONTRACT_VERSION } from "@/src/modules/journal/contracts/journal-analytics-fact-set";

import { normalizeJournalAnalyticsFacts } from "./normalize-journal-analytics-facts";

const ibkrCandidate = Object.freeze({
  sourceSystem: "ibkr",
  adapterId: "ibkr_activity_statement",
  adapterVersion: "ibkr_activity_statement_v1",
  provenanceKind: "broker" as const,
});

function allocation(input: Readonly<{
  allocationId: string;
  sequence: number;
  role: JournalAnalyticsAllocationFact["allocationRole"];
  executionId: string;
  executionVersionId: string;
  side: "buy" | "sell";
  quantity: string;
  executionQuantity?: string;
  price: string;
  fees?: string | null;
  feeSignConvention?: JournalAnalyticsAllocationFact["feeSignConvention"];
  atUtc: string;
}>): JournalAnalyticsAllocationFact {
  const fees = input.fees === undefined ? "-0.1" : input.fees;
  return Object.freeze({
    allocationId: input.allocationId,
    allocationSequence: input.sequence,
    allocationRole: input.role,
    executionId: input.executionId,
    executionVersionId: input.executionVersionId,
    executionState: "accepted",
    executedAtUtc: input.atUtc,
    sourceOrderKey: `${input.atUtc}|${input.executionId}`,
    side: input.side,
    allocatedQuantityDecimal: input.quantity,
    executionQuantityDecimal: input.executionQuantity ?? input.quantity,
    priceDecimal: input.price,
    feesDecimal: fees,
    feeCurrency: fees === null ? null : "USD",
    feeSignConvention: input.feeSignConvention ??
      (fees === null ? "not_reported" : "broker_reported_signed"),
    factCompleteness: "complete",
    provenanceKinds: Object.freeze(["broker"] as const),
    feePolicyCandidates: Object.freeze([ibkrCandidate]),
  });
}

function roundTrip(input: Readonly<{
  id: string;
  instrumentId?: string;
  symbol?: string;
  assetClass?: JournalAnalyticsRoundTripFact["assetClass"];
  direction?: "long" | "short";
  openedAtUtc: string;
  closedAtUtc: string | null;
  finalPosition?: string;
  state?: JournalAnalyticsRoundTripFact["projectionState"];
  reason?: string | null;
  allocations: readonly JournalAnalyticsAllocationFact[];
}>): JournalAnalyticsRoundTripFact {
  const state = input.state ?? "ready_closed";
  return Object.freeze({
    roundTripId: input.id,
    roundTripVersionId: `${input.id}-version`,
    versionNumber: 1,
    accountId: "account",
    instrumentId: input.instrumentId ?? `${input.id}-instrument`,
    displayedSymbol: input.symbol ?? input.id.toUpperCase(),
    assetClass: input.assetClass ?? "stock",
    tradeCurrency: "USD",
    direction: input.direction ?? "long",
    openedAtUtc: input.openedAtUtc,
    closedAtUtc: input.closedAtUtc,
    finalPositionDecimal: input.finalPosition ?? (state === "ready_closed" ? "0" : "1"),
    projectionState: state,
    coverageReasonCode: input.reason ?? (state === "needs_decision" ? "review_required" : null),
    projectionFingerprintSha256: "a".repeat(64),
    rebuild: Object.freeze({
      rebuildId: `${input.id}-rebuild`,
      chainKeySha256: "b".repeat(64),
      algorithmVersion: "test-v1",
      orderedInputSha256: "c".repeat(64),
      outputSha256: "d".repeat(64),
      coverageState: "complete",
      readyClosedCount: state === "ready_closed" ? 1 : 0,
      legitimateOpenCount: state === "legitimate_open" ? 1 : 0,
      needsDecisionCount: state === "needs_decision" ? 1 : 0,
      excludedCount: 0,
      completedAtUtc: "2026-08-01T12:00:00.000Z",
    }),
    allocations: Object.freeze([...input.allocations]),
    pendingDecisionIds: Object.freeze([]),
    pendingDecisionReasonCodes: Object.freeze([]),
  });
}

function coverage() {
  return Object.freeze({
    workspaceId: "workspace",
    accountId: "account",
    accountScope: Object.freeze({
      baseCurrency: "USD",
      tradingTimezone: "America/New_York",
    }),
    sourceRecords: Object.freeze({ total: 0, byClassification: Object.freeze({}) }),
    imports: Object.freeze({ total: 0, byState: Object.freeze({}) }),
    executions: Object.freeze({ total: 0, byState: Object.freeze({}) }),
    decisions: Object.freeze({
      total: 0,
      byState: Object.freeze({}),
      pendingByReason: Object.freeze({}),
      resolvedByAction: Object.freeze({}),
      acceptedSourceLimitationsByIssue: Object.freeze({}),
    }),
    roundTrips: Object.freeze({
      activeTotal: 0,
      byProjectionState: Object.freeze({}),
      affectedChainCount: 0,
      unaffectedChainCount: 0,
    }),
    positionFacts: Object.freeze({ currentTotal: 0, byKind: Object.freeze({}) }),
    coverageIntervals: Object.freeze({
      total: 0,
      byKind: Object.freeze({}),
      accountTimezoneCompatibleCompleteCount: 0,
      accountTimezoneMismatchCount: 0,
      overlappingCompleteIntervalCount: 0,
      completeCoverageGapCount: 0,
      earliestLocalDate: null,
      latestLocalDate: null,
    }),
    unsupportedSourceRecords: Object.freeze({
      total: 0,
      byAssetCategory: Object.freeze({}),
    }),
    rebuilds: Object.freeze({
      latestByChain: Object.freeze([]),
      freshness: "unavailable" as const,
    }),
  });
}

function factSet(roundTrips: readonly JournalAnalyticsRoundTripFact[]): JournalAnalyticsFactSet {
  return Object.freeze({
    contractVersion: JOURNAL_ANALYTICS_FACT_SET_CONTRACT_VERSION,
    workspaceId: "workspace",
    requestedAccountIds: Object.freeze(["account"]),
    requestedClosingDateRange: Object.freeze({ kind: "all_available" }),
    requestedCurrencySelection: Object.freeze({ kind: "all_partitions" }),
    generatedAtUtc: "2026-08-01T12:00:00.000Z",
    sourceRevisionSha256: "e".repeat(64),
    earliestAvailableLocalDate: null,
    latestAvailableLocalDate: null,
    accounts: Object.freeze([Object.freeze({
      accountId: "account",
      baseCurrency: "USD",
      tradingTimezone: "America/New_York",
      earliestAvailableLocalDate: null,
      latestAvailableLocalDate: null,
      coverage: coverage(),
    })]),
    roundTrips: Object.freeze([...roundTrips]),
    pendingDecisions: Object.freeze([]),
  });
}

describe("Journal Analytics normalization", () => {
  it("normalizes a long round trip with exact gross, net, size and local time", () => {
    const input = factSet([roundTrip({
      id: "closed",
      openedAtUtc: "2026-01-05T14:30:00.000Z",
      closedAtUtc: "2026-01-05T15:00:00.000Z",
      allocations: [
        allocation({
          allocationId: "buy",
          sequence: 1,
          role: "opening",
          executionId: "buy-execution",
          executionVersionId: "buy-version",
          side: "buy",
          quantity: "10",
          price: "10",
          fees: "-1",
          atUtc: "2026-01-05T14:30:00.000Z",
        }),
        allocation({
          allocationId: "sell",
          sequence: 2,
          role: "closing",
          executionId: "sell-execution",
          executionVersionId: "sell-version",
          side: "sell",
          quantity: "10",
          price: "11",
          fees: "-1",
          atUtc: "2026-01-05T15:00:00.000Z",
        }),
      ],
    })]);
    const result = normalizeJournalAnalyticsFacts(input);
    expect(result.realizedRows).toHaveLength(1);
    expect(result.realizedRows[0]).toMatchObject({
      grossPnlDecimal: "10",
      chargeCostDecimal: "2",
      chargeCreditDecimal: "0",
      netPnlDecimal: "8",
      enteredQuantityDecimal: "10",
      maximumPositionQuantityDecimal: "10",
      entryNotionalDecimal: "100",
      exitNotionalDecimal: "110",
      holdingDurationMilliseconds: 1_800_000,
      provenanceGroup: "broker_only",
      grossOutcome: "win",
      netOutcome: "win",
    });
    expect(result.realizedRows[0]?.entryLocal).toMatchObject({
      localDate: "2026-01-05",
      weekday: "monday",
      bucket30Minute: "09:30",
    });
    expect(result.normalizationDigestSha256).toMatch(/^[0-9a-f]{64}$/u);
  });

  it("preserves exact scale-in and partial-exit facts for one closed trade", () => {
    const result = normalizeJournalAnalyticsFacts(factSet([roundTrip({
      id: "scaled",
      openedAtUtc: "2026-01-05T14:30:00.000Z",
      closedAtUtc: "2026-01-05T16:00:00.000Z",
      allocations: [
        allocation({
          allocationId: "scaled-open",
          sequence: 1,
          role: "opening",
          executionId: "scaled-open",
          executionVersionId: "scaled-open-v",
          side: "buy",
          quantity: "5",
          price: "10",
          atUtc: "2026-01-05T14:30:00.000Z",
        }),
        allocation({
          allocationId: "scaled-add",
          sequence: 2,
          role: "adding",
          executionId: "scaled-add",
          executionVersionId: "scaled-add-v",
          side: "buy",
          quantity: "5",
          price: "12",
          atUtc: "2026-01-05T14:45:00.000Z",
        }),
        allocation({
          allocationId: "scaled-reduce",
          sequence: 3,
          role: "reducing",
          executionId: "scaled-reduce",
          executionVersionId: "scaled-reduce-v",
          side: "sell",
          quantity: "4",
          price: "13",
          atUtc: "2026-01-05T15:15:00.000Z",
        }),
        allocation({
          allocationId: "scaled-close",
          sequence: 4,
          role: "closing",
          executionId: "scaled-close",
          executionVersionId: "scaled-close-v",
          side: "sell",
          quantity: "6",
          price: "14",
          atUtc: "2026-01-05T16:00:00.000Z",
        }),
      ],
    })]));
    expect(result.realizedRows[0]).toMatchObject({
      grossPnlDecimal: "26",
      netPnlDecimal: "25.6",
      enteredQuantityDecimal: "10",
      maximumPositionQuantityDecimal: "10",
      entryNotionalDecimal: "110",
      exitNotionalDecimal: "136",
      allocationCount: 4,
      uniqueExecutionCount: 4,
    });
  });

  it("keeps gross facts usable when a fee is not reported", () => {
    const result = normalizeJournalAnalyticsFacts(factSet([roundTrip({
      id: "missing-fee",
      openedAtUtc: "2026-01-05T14:30:00.000Z",
      closedAtUtc: "2026-01-05T15:00:00.000Z",
      allocations: [
        allocation({
          allocationId: "buy",
          sequence: 1,
          role: "opening",
          executionId: "buy",
          executionVersionId: "buy-v",
          side: "buy",
          quantity: "1",
          price: "10",
          fees: null,
          atUtc: "2026-01-05T14:30:00.000Z",
        }),
        allocation({
          allocationId: "sell",
          sequence: 2,
          role: "closing",
          executionId: "sell",
          executionVersionId: "sell-v",
          side: "sell",
          quantity: "1",
          price: "11",
          atUtc: "2026-01-05T15:00:00.000Z",
        }),
      ],
    })]));
    expect(result.realizedRows[0]).toMatchObject({
      grossPnlDecimal: "1",
      chargeCoverage: "unavailable",
      chargeUnavailableReasonCodes: ["fee_not_reported"],
      chargeCostDecimal: null,
      netPnlDecimal: null,
    });
  });

  it("normalizes a short round trip without changing cash-effect signs", () => {
    const result = normalizeJournalAnalyticsFacts(factSet([roundTrip({
      id: "short",
      direction: "short",
      openedAtUtc: "2026-01-05T14:30:00.000Z",
      closedAtUtc: "2026-01-06T15:00:00.000Z",
      allocations: [
        allocation({
          allocationId: "short-open",
          sequence: 1,
          role: "opening",
          executionId: "short-open",
          executionVersionId: "short-open-v",
          side: "sell",
          quantity: "5",
          price: "10",
          fees: "0.1",
          atUtc: "2026-01-05T14:30:00.000Z",
        }),
        allocation({
          allocationId: "short-close",
          sequence: 2,
          role: "closing",
          executionId: "short-close",
          executionVersionId: "short-close-v",
          side: "buy",
          quantity: "5",
          price: "8",
          fees: "-0.1",
          atUtc: "2026-01-06T15:00:00.000Z",
        }),
      ],
    })]));
    expect(result.realizedRows[0]).toMatchObject({
      grossPnlDecimal: "10",
      chargeCostDecimal: "0.1",
      chargeCreditDecimal: "0.1",
      netPnlDecimal: "10",
      isOvernight: true,
    });
  });

  it("allocates one flip execution fee across adjacent round trips exactly", () => {
    const flipLong = allocation({
      allocationId: "flip-close",
      sequence: 2,
      role: "flip_closing",
      executionId: "flip",
      executionVersionId: "flip-v",
      side: "sell",
      quantity: "10",
      executionQuantity: "15",
      price: "11",
      fees: "-0.15",
      atUtc: "2026-01-05T15:00:00.000Z",
    });
    const flipShort = allocation({
      allocationId: "flip-open",
      sequence: 1,
      role: "flip_opening",
      executionId: "flip",
      executionVersionId: "flip-v",
      side: "sell",
      quantity: "5",
      executionQuantity: "15",
      price: "11",
      fees: "-0.15",
      atUtc: "2026-01-05T15:00:00.000Z",
    });
    const result = normalizeJournalAnalyticsFacts(factSet([
      roundTrip({
        id: "long",
        openedAtUtc: "2026-01-05T14:30:00.000Z",
        closedAtUtc: "2026-01-05T15:00:00.000Z",
        allocations: [
          allocation({
            allocationId: "long-open",
            sequence: 1,
            role: "opening",
            executionId: "long-open",
            executionVersionId: "long-open-v",
            side: "buy",
            quantity: "10",
            price: "10",
            fees: "-0.1",
            atUtc: "2026-01-05T14:30:00.000Z",
          }),
          flipLong,
        ],
      }),
      roundTrip({
        id: "short",
        direction: "short",
        openedAtUtc: "2026-01-05T15:00:00.000Z",
        closedAtUtc: "2026-01-05T16:00:00.000Z",
        allocations: [
          flipShort,
          allocation({
            allocationId: "short-close",
            sequence: 2,
            role: "closing",
            executionId: "short-close",
            executionVersionId: "short-close-v",
            side: "buy",
            quantity: "5",
            price: "9",
            fees: "-0.05",
            atUtc: "2026-01-05T16:00:00.000Z",
          }),
        ],
      }),
    ]));
    expect(result.realizedRows.map((row) => row.chargeCostDecimal)).toEqual([
      "0.2",
      "0.1",
    ]);
  });

  it("keeps open, decision and unsupported rows out of realized money", () => {
    const result = normalizeJournalAnalyticsFacts(factSet([
      roundTrip({
        id: "open",
        openedAtUtc: "2026-01-05T14:30:00.000Z",
        closedAtUtc: null,
        state: "legitimate_open",
        allocations: [allocation({
          allocationId: "open-a",
          sequence: 1,
          role: "opening",
          executionId: "open-e",
          executionVersionId: "open-v",
          side: "buy",
          quantity: "1",
          price: "10",
          atUtc: "2026-01-05T14:30:00.000Z",
        })],
      }),
      roundTrip({
        id: "decision",
        openedAtUtc: "2026-01-05T14:30:00.000Z",
        closedAtUtc: null,
        state: "needs_decision",
        allocations: [allocation({
          allocationId: "decision-a",
          sequence: 1,
          role: "opening",
          executionId: "decision-e",
          executionVersionId: "decision-v",
          side: "buy",
          quantity: "1",
          price: "10",
          atUtc: "2026-01-05T14:30:00.000Z",
        })],
      }),
      roundTrip({
        id: "option",
        assetClass: "option",
        openedAtUtc: "2026-01-05T14:30:00.000Z",
        closedAtUtc: "2026-01-05T15:00:00.000Z",
        allocations: [
          allocation({
            allocationId: "option-open",
            sequence: 1,
            role: "opening",
            executionId: "option-open",
            executionVersionId: "option-open-v",
            side: "buy",
            quantity: "1",
            price: "10",
            atUtc: "2026-01-05T14:30:00.000Z",
          }),
          allocation({
            allocationId: "option-close",
            sequence: 2,
            role: "closing",
            executionId: "option-close",
            executionVersionId: "option-close-v",
            side: "sell",
            quantity: "1",
            price: "11",
            atUtc: "2026-01-05T15:00:00.000Z",
          }),
        ],
      }),
    ]));
    expect(result.realizedRows).toHaveLength(0);
    expect(result.legitimateOpenRoundTrips).toHaveLength(1);
    expect(result.needsDecisionRoundTrips).toHaveLength(1);
    expect(result.unavailableRoundTrips).toEqual([
      expect.objectContaining({ reasonCode: "instrument_value_convention_missing" }),
    ]);
  });
});
