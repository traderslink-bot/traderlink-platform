import type {
  JournalAnalyticsAllocationFact,
  JournalAnalyticsFactSet,
  JournalAnalyticsRoundTripFact,
} from "@/src/modules/journal/contracts/journal-analytics-fact-set";
import { JOURNAL_ANALYTICS_FACT_SET_CONTRACT_VERSION } from "@/src/modules/journal/contracts/journal-analytics-fact-set";

import type { JournalAnalyticsQuery } from "../contracts/analytics-query";
import { JOURNAL_ANALYTICS_QUERY_VERSION } from "../contracts/analytics-query";
import { calculateJournalAnalyticsResponse } from "./analytics-service";

const accountId = "00000000-0000-4000-8000-000000000001";

function allocation(
  roundTrip: number,
  sequence: 1 | 2,
): JournalAnalyticsAllocationFact {
  const opening = sequence === 1;
  return Object.freeze({
    allocationId: `allocation-${roundTrip}-${sequence}`,
    allocationSequence: sequence,
    allocationRole: opening ? "opening" : "closing",
    executionId: `execution-${roundTrip}-${sequence}`,
    executionVersionId: `execution-version-${roundTrip}-${sequence}`,
    executionState: "accepted",
    executedAtUtc: opening
      ? "2026-01-05T14:30:00.000Z"
      : "2026-01-05T15:00:00.000Z",
    sourceOrderKey: `order-${roundTrip}-${sequence}`,
    side: opening ? "buy" : "sell",
    allocatedQuantityDecimal: "1",
    executionQuantityDecimal: "1",
    priceDecimal: opening ? "10" : roundTrip % 2 === 0 ? "11" : "9",
    feesDecimal: "-0.01",
    feeCurrency: "USD",
    feeSignConvention: "cash_effect",
    factCompleteness: "complete",
    provenanceKinds: Object.freeze(["manual"] as const),
    feePolicyCandidates: Object.freeze([]),
  });
}

function roundTrip(index: number): JournalAnalyticsRoundTripFact {
  return Object.freeze({
    roundTripId: `round-trip-${String(index).padStart(5, "0")}`,
    roundTripVersionId: `round-trip-version-${String(index).padStart(5, "0")}`,
    versionNumber: 1,
    accountId,
    instrumentId: `instrument-${index % 20}`,
    displayedSymbol: `S${String(index % 20).padStart(2, "0")}`,
    assetClass: "stock",
    tradeCurrency: "USD",
    direction: "long",
    openedAtUtc: "2026-01-05T14:30:00.000Z",
    closedAtUtc: "2026-01-05T15:00:00.000Z",
    finalPositionDecimal: "0",
    projectionState: "ready_closed",
    coverageReasonCode: null,
    projectionFingerprintSha256: "a".repeat(64),
    rebuild: Object.freeze({
      rebuildId: `rebuild-${index}`,
      chainKeySha256: "b".repeat(64),
      algorithmVersion: "scale-test-v1",
      orderedInputSha256: "c".repeat(64),
      outputSha256: "d".repeat(64),
      coverageState: "complete",
      readyClosedCount: 1,
      legitimateOpenCount: 0,
      needsDecisionCount: 0,
      excludedCount: 0,
      completedAtUtc: "2026-08-01T12:00:00.000Z",
    }),
    allocations: Object.freeze([
      allocation(index, 1),
      allocation(index, 2),
    ]),
    pendingDecisionIds: Object.freeze([]),
    pendingDecisionReasonCodes: Object.freeze([]),
  });
}

function factSet(): JournalAnalyticsFactSet {
  return Object.freeze({
    contractVersion: JOURNAL_ANALYTICS_FACT_SET_CONTRACT_VERSION,
    workspaceId: "workspace",
    sourceRevisionSha256: "e".repeat(64),
    generatedAtUtc: "2026-08-01T12:00:00.000Z",
    requestedAccountIds: Object.freeze([accountId]),
    requestedClosingDateRange: Object.freeze({ kind: "all_available" }),
    requestedCurrencySelection: Object.freeze({ kind: "all_partitions" }),
    earliestAvailableLocalDate: "2026-01-05",
    latestAvailableLocalDate: "2026-01-05",
    accounts: Object.freeze([Object.freeze({
      accountId,
      baseCurrency: "USD",
      tradingTimezone: "America/New_York",
      earliestAvailableLocalDate: "2026-01-05",
      latestAvailableLocalDate: "2026-01-05",
      coverage: Object.freeze({
        workspaceId: "workspace",
        accountId,
        accountScope: Object.freeze({ baseCurrency: "USD", tradingTimezone: "America/New_York" }),
        sourceRecords: Object.freeze({ total: 10_000, byClassification: Object.freeze({ execution: 10_000 }) }),
        imports: Object.freeze({ total: 1, byState: Object.freeze({ accepted: 1 }) }),
        executions: Object.freeze({ total: 10_000, byState: Object.freeze({ accepted: 10_000 }) }),
        decisions: Object.freeze({ total: 0, byState: Object.freeze({}), pendingByReason: Object.freeze({}), resolvedByAction: Object.freeze({}), acceptedSourceLimitationsByIssue: Object.freeze({}) }),
        roundTrips: Object.freeze({ activeTotal: 5_000, byProjectionState: Object.freeze({ ready_closed: 5_000 }), affectedChainCount: 0, unaffectedChainCount: 5_000 }),
        positionFacts: Object.freeze({ currentTotal: 0, byKind: Object.freeze({}) }),
        coverageIntervals: Object.freeze({ total: 0, byKind: Object.freeze({}), accountTimezoneCompatibleCompleteCount: 0, accountTimezoneMismatchCount: 0, overlappingCompleteIntervalCount: 0, completeCoverageGapCount: 0, earliestLocalDate: null, latestLocalDate: null }),
        unsupportedSourceRecords: Object.freeze({ total: 0, byAssetCategory: Object.freeze({}) }),
        rebuilds: Object.freeze({
          latestByChain: Object.freeze([]),
          freshness: "recorded_not_recomputed",
        }),
      }),
    })]),
    roundTrips: Object.freeze(Array.from({ length: 5_000 }, (_, index) =>
      roundTrip(index))),
    pendingDecisions: Object.freeze([]),
  });
}

function query(): JournalAnalyticsQuery {
  const emptyDecimalRange = Object.freeze({
    minimumInclusive: null,
    maximumInclusive: null,
  });
  return Object.freeze({
    queryVersion: JOURNAL_ANALYTICS_QUERY_VERSION,
    accountIds: Object.freeze([accountId]),
    metricIds: Object.freeze([
      "total_trades",
      "gross_pnl",
      "net_pnl",
      "total_execution_count",
    ]),
    moneyBasis: "gross",
    closingDateRange: Object.freeze({ kind: "all_available" }),
    currency: null,
    instrumentIds: Object.freeze([]),
    symbols: Object.freeze([]),
    directions: Object.freeze([]),
    provenance: Object.freeze([]),
    outcomes: Object.freeze([]),
    entryWeekdays: Object.freeze([]),
    entryTimeBuckets: Object.freeze([]),
    holdingDurationRange: Object.freeze({
      minimumMillisecondsInclusive: null,
      maximumMillisecondsInclusive: null,
    }),
    enteredQuantityRange: emptyDecimalRange,
    maximumPositionRange: emptyDecimalRange,
    entryNotionalRange: emptyDecimalRange,
    groupings: Object.freeze([
      "total",
      "closing_day",
      "instrument",
      "entry_time_bucket",
    ] as const),
    entryTimeBucketMinutes: 30,
    asOfUtc: "2026-08-01T12:00:00.000Z",
    table: Object.freeze({ pageSize: 100, afterCursor: null }),
  });
}

describe("Journal Analytics 10,000-execution scale proof", () => {
  it("normalizes and reconciles the full graph within one bounded worker", () => {
    const beforeHeap = process.memoryUsage().heapUsed;
    const started = performance.now();
    const response = calculateJournalAnalyticsResponse(factSet(), query());
    const durationMilliseconds = performance.now() - started;
    const heapDeltaBytes = Math.max(0, process.memoryUsage().heapUsed - beforeHeap);
    expect(response.partitions).toHaveLength(1);
    expect(response.partitions[0].coverage.includedCount).toBe(5_000);
    expect(response.partitions[0].reconciliation.status).toBe("reconciled");
    expect(response.partitions[0].metrics.find((metric) =>
      metric.metricId === "total_execution_count")?.value).toEqual({
      kind: "integer",
      value: 10_000,
    });
    expect(durationMilliseconds).toBeLessThan(15_000);
    expect(heapDeltaBytes).toBeLessThan(512 * 1024 * 1024);
    console.info(JSON.stringify({
      scaleExecutionCount: 10_000,
      scaleRoundTripCount: 5_000,
      durationMilliseconds: Math.round(durationMilliseconds),
      heapDeltaBytes,
    }));
  });
});
