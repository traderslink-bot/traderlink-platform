import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type {
  JournalAnalyticsAllocationFact,
  JournalAnalyticsFactSet,
  JournalAnalyticsRoundTripFact,
} from "@/src/modules/journal/contracts/journal-analytics-fact-set";
import { JOURNAL_ANALYTICS_FACT_SET_CONTRACT_VERSION } from "@/src/modules/journal/contracts/journal-analytics-fact-set";
import type { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";

import { JournalDashboardReadModelService } from "./journal-dashboard-read-model-service";

const accountId = "00000000-0000-4000-8000-000000000001";
const workspaceId = "00000000-0000-4000-8000-000000000002";
const userId = "00000000-0000-4000-8000-000000000003";

const scope: WorkspaceAccessScope = Object.freeze({
  userId,
  workspaceId,
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze([accountId]),
  activeAccountId: accountId,
});

const brokerCandidate = Object.freeze({
  sourceSystem: "ibkr",
  adapterId: "ibkr_activity_statement",
  adapterVersion: "ibkr_activity_statement_v1",
  provenanceKind: "broker" as const,
});

function allocation(input: Readonly<{
  id: string;
  sequence: number;
  role: JournalAnalyticsAllocationFact["allocationRole"];
  side: "buy" | "sell";
  quantity: string;
  price: string;
  atUtc: string;
}>): JournalAnalyticsAllocationFact {
  return Object.freeze({
    allocationId: input.id,
    allocationSequence: input.sequence,
    allocationRole: input.role,
    executionId: `${input.id}-execution`,
    executionVersionId: `${input.id}-execution-version`,
    executionState: "accepted",
    executedAtUtc: input.atUtc,
    sourceOrderKey: `${input.atUtc}|${input.id}`,
    side: input.side,
    allocatedQuantityDecimal: input.quantity,
    executionQuantityDecimal: input.quantity,
    priceDecimal: input.price,
    feesDecimal: "-1",
    feeCurrency: "USD",
    feeSignConvention: "broker_reported_signed",
    factCompleteness: "complete",
    provenanceKinds: Object.freeze(["broker"] as const),
    feePolicyCandidates: Object.freeze([brokerCandidate]),
  });
}

function roundTrip(input: Readonly<{
  id: string;
  instrumentId: string;
  symbol: string;
  direction?: "long" | "short";
  openedAtUtc: string;
  closedAtUtc: string | null;
  state?: JournalAnalyticsRoundTripFact["projectionState"];
  finalPosition?: string;
  allocations: readonly JournalAnalyticsAllocationFact[];
}>): JournalAnalyticsRoundTripFact {
  const state = input.state ?? "ready_closed";
  return Object.freeze({
    roundTripId: input.id,
    roundTripVersionId: `${input.id}-version`,
    versionNumber: 1,
    accountId,
    instrumentId: input.instrumentId,
    displayedSymbol: input.symbol,
    assetClass: "stock",
    tradeCurrency: "USD",
    direction: input.direction ?? "long",
    openedAtUtc: input.openedAtUtc,
    closedAtUtc: input.closedAtUtc,
    finalPositionDecimal: input.finalPosition ??
      (state === "ready_closed" ? "0" : "5"),
    projectionState: state,
    coverageReasonCode: state === "needs_decision" ? "review_required" : null,
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
    pendingDecisionIds: state === "needs_decision"
      ? Object.freeze([`${input.id}-decision`])
      : Object.freeze([]),
    pendingDecisionReasonCodes: state === "needs_decision"
      ? Object.freeze(["statement_boundary_unresolved"])
      : Object.freeze([]),
  });
}

function coverage() {
  return Object.freeze({
    workspaceId,
    accountId,
    accountScope: Object.freeze({
      baseCurrency: "USD",
      tradingTimezone: "America/New_York",
    }),
    sourceRecords: Object.freeze({ total: 0, byClassification: Object.freeze({}) }),
    imports: Object.freeze({ total: 1, byState: Object.freeze({ accepted: 1 }) }),
    executions: Object.freeze({ total: 7, byState: Object.freeze({ accepted: 7 }) }),
    decisions: Object.freeze({
      total: 1,
      byState: Object.freeze({ pending: 1 }),
      pendingByReason: Object.freeze({ statement_boundary_unresolved: 1 }),
      resolvedByAction: Object.freeze({}),
      acceptedSourceLimitationsByIssue: Object.freeze({}),
    }),
    roundTrips: Object.freeze({
      activeTotal: 4,
      byProjectionState: Object.freeze({
        ready_closed: 2,
        legitimate_open: 1,
        needs_decision: 1,
      }),
      affectedChainCount: 1,
      unaffectedChainCount: 3,
    }),
    positionFacts: Object.freeze({ currentTotal: 0, byKind: Object.freeze({}) }),
    coverageIntervals: Object.freeze({
      total: 1,
      byKind: Object.freeze({ statement: 1 }),
      accountTimezoneCompatibleCompleteCount: 1,
      accountTimezoneMismatchCount: 0,
      overlappingCompleteIntervalCount: 0,
      completeCoverageGapCount: 0,
      earliestLocalDate: "2026-01-05",
      latestLocalDate: "2026-01-06",
    }),
    unsupportedSourceRecords: Object.freeze({
      total: 0,
      byAssetCategory: Object.freeze({}),
    }),
    rebuilds: Object.freeze({
      latestByChain: Object.freeze([]),
      freshness: "recorded_not_recomputed" as const,
    }),
  });
}

function facts(): JournalAnalyticsFactSet {
  const first = roundTrip({
    id: "closed-a",
    instrumentId: "00000000-0000-4000-8000-000000000010",
    symbol: "AAA",
    openedAtUtc: "2026-01-05T14:30:00.000Z",
    closedAtUtc: "2026-01-05T15:00:00.000Z",
    allocations: [
      allocation({ id: "a-open", sequence: 1, role: "opening", side: "buy", quantity: "10", price: "10", atUtc: "2026-01-05T14:30:00.000Z" }),
      allocation({ id: "a-close", sequence: 2, role: "closing", side: "sell", quantity: "10", price: "12", atUtc: "2026-01-05T15:00:00.000Z" }),
    ],
  });
  const second = roundTrip({
    id: "closed-b",
    instrumentId: "00000000-0000-4000-8000-000000000011",
    symbol: "BBB",
    openedAtUtc: "2026-01-05T15:30:00.000Z",
    closedAtUtc: "2026-01-05T16:00:00.000Z",
    allocations: [
      allocation({ id: "b-open", sequence: 1, role: "opening", side: "buy", quantity: "10", price: "10", atUtc: "2026-01-05T15:30:00.000Z" }),
      allocation({ id: "b-close", sequence: 2, role: "closing", side: "sell", quantity: "10", price: "8", atUtc: "2026-01-05T16:00:00.000Z" }),
    ],
  });
  const open = roundTrip({
    id: "open-c",
    instrumentId: "00000000-0000-4000-8000-000000000012",
    symbol: "CCC",
    openedAtUtc: "2026-01-06T14:30:00.000Z",
    closedAtUtc: null,
    state: "legitimate_open",
    finalPosition: "5",
    allocations: [
      allocation({ id: "c-open", sequence: 1, role: "opening", side: "buy", quantity: "5", price: "4", atUtc: "2026-01-06T14:30:00.000Z" }),
    ],
  });
  const decision = roundTrip({
    id: "decision-d",
    instrumentId: "00000000-0000-4000-8000-000000000013",
    symbol: "DDD",
    openedAtUtc: "2026-01-06T15:00:00.000Z",
    closedAtUtc: null,
    state: "needs_decision",
    finalPosition: "2",
    allocations: [
      allocation({ id: "d-open", sequence: 1, role: "opening", side: "buy", quantity: "2", price: "3", atUtc: "2026-01-06T15:00:00.000Z" }),
    ],
  });
  return Object.freeze({
    contractVersion: JOURNAL_ANALYTICS_FACT_SET_CONTRACT_VERSION,
    workspaceId,
    requestedAccountIds: Object.freeze([accountId]),
    requestedClosingDateRange: Object.freeze({ kind: "all_available" }),
    requestedCurrencySelection: Object.freeze({ kind: "all_partitions" }),
    generatedAtUtc: "2026-08-01T12:00:00.000Z",
    sourceRevisionSha256: "e".repeat(64),
    earliestAvailableLocalDate: "2026-01-05",
    latestAvailableLocalDate: "2026-01-06",
    accounts: Object.freeze([Object.freeze({
      accountId,
      baseCurrency: "USD",
      tradingTimezone: "America/New_York",
      earliestAvailableLocalDate: "2026-01-05",
      latestAvailableLocalDate: "2026-01-06",
      coverage: coverage(),
    })]),
    roundTrips: Object.freeze([first, second, open, decision]),
    pendingDecisions: Object.freeze([]),
  });
}

function service(): JournalDashboardReadModelService {
  const factSet = facts();
  const source = {
    getJournalAnalyticsFactSet: () => factSet,
  } as unknown as JournalAnalyticsFactSetService;
  return new JournalDashboardReadModelService(source);
}

function calendarInput() {
  return Object.freeze({
    currency: "USD",
    startDate: null,
    endDate: null,
    symbol: null,
    direction: null,
    performance: null,
    pnlBand: null,
    tradeCountBand: null,
    session: null,
  });
}

describe("Journal dashboard read models", () => {
  it("builds an exact calendar without hiding unrelated valid trades", () => {
    const result = service().getCalendar(scope, calendarInput());

    expect(result.state).toBe("ready");
    expect(result.availableCurrencies).toEqual(["USD"]);
    expect(result.days).toHaveLength(1);
    expect(result.days[0]).toMatchObject({
      date: "2026-01-05",
      peakGivebackDecimal: "22",
      pnlDecimal: "-4",
      pnlSign: -1,
      tradeCount: 2,
      winRatePercentDecimal: "50",
    });
    expect(result.summary).toMatchObject({
      netPnlDecimal: "-4",
      tradeCount: 2,
      tradingDayCount: 1,
      winRatePercentDecimal: "50",
    });
    expect(result.coverage).toMatchObject({
      readyClosedCount: 2,
      legitimateOpenCount: 1,
      needsDecisionCount: 1,
    });
  });

  it("applies factual filters and refuses unsupported session claims", () => {
    const filtered = service().getCalendar(scope, {
      ...calendarInput(),
      symbol: "AAA",
      performance: "profitable",
    });
    expect(filtered.days[0]).toMatchObject({
      pnlDecimal: "18",
      tradeCount: 1,
      winRatePercentDecimal: "100",
    });

    const unavailable = service().getCalendar(scope, {
      ...calendarInput(),
      session: "regular",
    });
    expect(unavailable.state).toBe("unavailable");
    expect(unavailable.days).toEqual([]);
    expect(unavailable.coverage.limitationReasonCodes)
      .toContain("market_session_fact_unavailable");
  });

  it("groups ticker history by stable instrument and currency", () => {
    const result = service().getTickerHistory(scope);
    expect(result.rows).toEqual([
      expect.objectContaining({ symbol: "AAA", currency: "USD", roundTripCount: 1, netPnlDecimal: "18", winRatePercentDecimal: "100" }),
      expect.objectContaining({ symbol: "BBB", currency: "USD", roundTripCount: 1, netPnlDecimal: "-22", winRatePercentDecimal: "0" }),
    ]);
  });

  it("separates legitimate open positions from pending trader decisions", () => {
    const result = service().getOpenPositions(
      scope,
      "2026-01-07T14:30:00.000Z",
    );
    expect(result.positions).toEqual([
      expect.objectContaining({
        symbol: "CCC",
        remainingQuantityDecimal: "5",
        averageEntryPriceDecimal: "4",
        ageMilliseconds: 86_400_000,
      }),
    ]);
    expect(result.decisions).toEqual([
      expect.objectContaining({
        symbol: "DDD",
        reasonCodes: ["statement_boundary_unresolved"],
      }),
    ]);
  });

  it("builds a date-specific Trade Tracker model from the whole ledger", () => {
    const result = service().getTradingDay(scope, {
      requestedDate: "2026-01-05",
      currency: "USD",
      asOfUtc: "2026-01-07T14:30:00.000Z",
    });
    expect(result.state).toBe("ready");
    expect(result.netPnlDecimal).toBe("-4");
    expect(result.tickers).toHaveLength(2);
    expect(result.week).toMatchObject({
      startDate: "2026-01-05",
      endDate: "2026-01-11",
      netPnlDecimal: "-4",
      tradeCount: 2,
      tickerCount: 2,
    });
    expect(result.nextTradingDate).toBe("2026-01-06");
    expect(result.latestTradingDate).toBe("2026-01-06");

    const decisionDay = service().getTradingDay(scope, {
      requestedDate: "2026-01-06",
      currency: "USD",
      asOfUtc: "2026-01-07T14:30:00.000Z",
    });
    expect(decisionDay.decisionActivity).toEqual([
      expect.objectContaining({
        symbol: "DDD",
        executionCountOnDate: 1,
        reasonCodes: ["statement_boundary_unresolved"],
      }),
    ]);
    expect(decisionDay.executionActivity).toEqual([
      expect.objectContaining({ symbol: "CCC", quantityDecimal: "5", needsDecision: false }),
      expect.objectContaining({ symbol: "DDD", quantityDecimal: "2", needsDecision: true }),
    ]);
    expect(decisionDay.positionSnapshots).toEqual([
      expect.objectContaining({
        symbol: "CCC",
        openingQuantityDecimal: "0",
        closingQuantityDecimal: "5",
        state: "opened_and_carried_out",
      }),
    ]);
  });
});
