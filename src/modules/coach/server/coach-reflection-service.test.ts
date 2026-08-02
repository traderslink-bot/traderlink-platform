import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import type { JournalProductReadService } from "@/src/modules/journal/server/product/journal-product-read-service";
import type { JournalDashboardReadModelService } from "@/src/modules/journal-analytics/server/journal-dashboard-read-model-service";

import { parseCoachReflectionRequest } from "./coach-reflection-request";
import {
  CoachReflectionService,
  coachReflectionPeriodBounds,
} from "./coach-reflection-service";

const accountId = "00000000-0000-4000-8000-000000000001";
const scope: WorkspaceAccessScope = Object.freeze({
  userId: "00000000-0000-4000-8000-000000000002",
  workspaceId: "00000000-0000-4000-8000-000000000003",
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze([accountId]),
  activeAccountId: accountId,
});

const tradesByDate = Object.freeze({
  "2026-01-31": Object.freeze([Object.freeze({
    roundTripId: "00000000-0000-4000-8000-000000000010",
    instrumentId: "00000000-0000-4000-8000-000000000011",
    symbol: "AAA",
    currency: "USD",
    timezone: "America/New_York",
    direction: "long" as const,
    entryAtUtc: "2026-01-31T14:30:00.000Z",
    exitAtUtc: "2026-01-31T15:00:00.000Z",
    entryPriceDecimal: "10",
    exitPriceDecimal: "11",
    netPnlDecimal: "10",
    gainLossPercentDecimal: "10",
  })]),
  "2026-02-01": Object.freeze([Object.freeze({
    roundTripId: "00000000-0000-4000-8000-000000000020",
    instrumentId: "00000000-0000-4000-8000-000000000021",
    symbol: "BBB",
    currency: "USD",
    timezone: "America/New_York",
    direction: "short" as const,
    entryAtUtc: "2026-02-01T14:30:00.000Z",
    exitAtUtc: "2026-02-01T15:00:00.000Z",
    entryPriceDecimal: "10",
    exitPriceDecimal: "10.5",
    netPnlDecimal: "-5",
    gainLossPercentDecimal: "-5",
  })]),
});

function dashboard(): JournalDashboardReadModelService {
  const service = {
    getCalendar: (_scope: WorkspaceAccessScope, input: Readonly<{
      startDate: string | null;
      endDate: string | null;
    }>) => {
      const dates = Object.keys(tradesByDate).filter((date) =>
        (input.startDate === null || date >= input.startDate) &&
        (input.endDate === null || date <= input.endDate));
      return Object.freeze({
        state: dates.length > 0 ? "ready" as const : "empty" as const,
        currency: "USD",
        availableCurrencies: Object.freeze(["USD"]),
        timezone: "America/New_York",
        activeDate: dates.at(-1) ?? "2026-02-01",
        minimumDate: "2026-01-31",
        maximumDate: "2026-02-01",
        days: Object.freeze(dates.map((date) => Object.freeze({
          date,
          peakGivebackDecimal: null,
          pnlDecimal: date === "2026-01-31" ? "10" : "-5",
          pnlSign: date === "2026-01-31" ? 1 as const : -1 as const,
          tickers: Object.freeze([]),
          tradeCount: 1,
          winRatePercentDecimal: date === "2026-01-31" ? "100" : "0",
        }))),
        symbols: Object.freeze(["AAA", "BBB"]),
        summary: Object.freeze({
          netPnlDecimal: "5",
          netPnlSign: 1 as const,
          tradeCount: dates.length,
          tradingDayCount: dates.length,
          winRatePercentDecimal: "50",
        }),
        coverage: Object.freeze({
          readyClosedCount: 2,
          legitimateOpenCount: 1,
          needsDecisionCount: 2,
          feeCompleteCount: 2,
          feeIncompleteCount: 0,
          limitationReasonCodes: Object.freeze(["source_chain_issue_pending"]),
        }),
      });
    },
    getTradingDay: (_scope: WorkspaceAccessScope, input: Readonly<{
      requestedDate: string;
    }>) => {
      const trades = tradesByDate[input.requestedDate as keyof typeof tradesByDate] ?? [];
      return Object.freeze({
        state: trades.length > 0 ? "ready" as const : "empty" as const,
        date: input.requestedDate,
        currency: "USD",
        availableCurrencies: Object.freeze(["USD"]),
        timezone: "America/New_York",
        netPnlDecimal: trades[0]?.netPnlDecimal ?? null,
        decisionActivity: Object.freeze([]),
        executionActivity: Object.freeze([]),
        previousTradingDate: null,
        nextTradingDate: null,
        latestTradingDate: "2026-02-01",
        tickers: Object.freeze(trades.length > 0 ? [Object.freeze({
          instrumentId: trades[0].instrumentId,
          symbol: trades[0].symbol,
          currency: "USD",
          netPnlDecimal: trades[0].netPnlDecimal,
          gainLossPercentDecimal: trades[0].gainLossPercentDecimal,
          roundTrips: trades,
        })] : []),
        openPositions: Object.freeze([]),
        positionSnapshots: Object.freeze([]),
        week: Object.freeze({
          startDate: "2026-01-26",
          endDate: "2026-02-01",
          days: Object.freeze([]),
          netPnlDecimal: "5",
          tickerCount: 2,
          tradeCount: 2,
        }),
        coverage: Object.freeze({
          readyClosedCount: 2,
          legitimateOpenCount: 1,
          needsDecisionCount: 2,
          feeCompleteCount: 2,
          feeIncompleteCount: 0,
          limitationReasonCodes: Object.freeze(["source_chain_issue_pending"]),
        }),
        factSetRevisionSha256: "a".repeat(64),
      });
    },
  };
  return service as unknown as JournalDashboardReadModelService;
}

function annotations(): JournalAnnotationService {
  function requireAccount(candidate: Readonly<{ accountId: string }>): void {
    if (candidate.accountId !== accountId) throw new Error("wrong account");
  }
  const service = {
    listRules: (account: Readonly<{ accountId: string }>) => {
      requireAccount(account);
      return Object.freeze([Object.freeze({
        ruleId: "00000000-0000-4000-8000-000000000030",
        title: "Cut risk quickly",
        statement: "Exit when the risk limit is reached.",
        reviewScope: "both" as const,
        isFocus: true,
        lifecycleState: "active" as const,
      })]);
    },
    resolveTradingDayId: (account: Readonly<{ accountId: string }>, date: string) => {
      requireAccount(account);
      return date === "2026-01-31"
        ? "00000000-0000-4000-8000-000000000040"
        : "00000000-0000-4000-8000-000000000041";
    },
    listRuleReviews: (
      account: Readonly<{ accountId: string }>,
      input: Readonly<{ tradingDayId: string; roundTripIds: readonly string[] }>,
    ) => {
      requireAccount(account);
      return input.tradingDayId.endsWith("40")
        ? Object.freeze([
            Object.freeze({ targetKind: "trading_day" as const, roundTripId: null, status: "followed" as const }),
            Object.freeze({ targetKind: "round_trip" as const, roundTripId: input.roundTripIds[0], status: "broken" as const }),
          ])
        : Object.freeze([]);
    },
    listTagsForRoundTrips: (
      account: Readonly<{ accountId: string }>,
      roundTripIds: readonly string[],
    ) => {
      requireAccount(account);
      return Object.freeze(Object.fromEntries(roundTripIds.map((roundTripId) => [
        roundTripId,
        roundTripId.endsWith("10")
          ? Object.freeze([Object.freeze({ name: "Reviewed" })])
          : Object.freeze([]),
      ])));
    },
    readRoundTripNotes: (
      account: Readonly<{ accountId: string }>,
      roundTripIds: readonly string[],
    ) => {
      requireAccount(account);
      return Object.freeze(Object.fromEntries(roundTripIds
        .filter((roundTripId) => roundTripId.endsWith("10"))
        .map((roundTripId) => [roundTripId, Object.freeze({ roundTripNoteId: "note" })])));
    },
    readDailyNote: (account: Readonly<{ accountId: string }>, date: string) => {
      requireAccount(account);
      return date === "2026-01-31" ? Object.freeze({ dailyNoteId: "day-note" }) : null;
    },
  };
  return service as unknown as JournalAnnotationService;
}

function products(pendingCount = 2): JournalProductReadService {
  return {
    listDataDecisions: (account: Readonly<{ accountId: string }>) => {
      if (account.accountId !== accountId) throw new Error("wrong account");
      return Object.freeze({
        pending: Object.freeze(Array.from({ length: pendingCount }, (_, index) =>
          Object.freeze({ decisionId: String(index) }))),
        resolved: Object.freeze([]),
      });
    },
  } as unknown as JournalProductReadService;
}

describe("Coach reflection service", () => {
  it("uses exact daily, Monday-Sunday weekly and calendar-month bounds", () => {
    expect(coachReflectionPeriodBounds("daily", "2026-02-01")).toEqual({
      startDate: "2026-02-01",
      endDate: "2026-02-01",
    });
    expect(coachReflectionPeriodBounds("weekly", "2026-02-01")).toEqual({
      startDate: "2026-01-26",
      endDate: "2026-02-01",
    });
    expect(coachReflectionPeriodBounds("monthly", "2026-02-01")).toEqual({
      startDate: "2026-02-01",
      endDate: "2026-02-28",
    });
    expect(() => coachReflectionPeriodBounds("daily", "2026-02-31"))
      .toThrowError("TRADERLINK_COACH_REFLECTION_INVALID_DATE");
  });

  it("normalizes untrusted period/date/currency query values", () => {
    expect(parseCoachReflectionRequest({
      period: "invalid",
      date: "2026-02-31",
      currency: "usd",
    })).toEqual({ period: "daily", anchorDate: null, currency: "USD" });
  });

  it("keeps Data Decisions out of ready P/L and binds annotations to stable account trades", () => {
    const result = new CoachReflectionService(
      dashboard(),
      annotations(),
      products(),
    ).read(scope, Object.freeze({
      period: "weekly",
      anchorDate: "2026-02-01",
      currency: "USD",
    }));

    expect(result.source).toBe("journal_facts");
    expect(result.summary).toMatchObject({
      tradingDayCount: 2,
      readyClosedTradeCount: 2,
      netPnlDecimal: "5",
      winRatePercentDecimal: "50",
      dailyNotesSavedCount: 1,
      roundTripNotesSavedCount: 1,
      taggedTradeCount: 1,
      accountPendingDataDecisionCount: 2,
    });
    expect(result.coverage).toMatchObject({
      readyClosedCount: 2,
      legitimateOpenCount: 1,
      needsDecisionCount: 2,
    });
    expect(result.days[0].trades[0]).toMatchObject({
      roundTripId: "00000000-0000-4000-8000-000000000010",
      noteSaved: true,
      tagNames: ["Reviewed"],
      ruleReviews: { broken: 1 },
    });
    expect(result.prompts.map((prompt) => prompt.code)).toContain(
      "resolve_data_decisions",
    );
    expect(JSON.stringify(result)).not.toContain("sample");
    expect(JSON.stringify(result)).not.toContain("trader-intelligence-v3");
  });

  it("treats missing annotations as incomplete trader reflection, not a behavior fact", () => {
    const emptyAnnotations = {
      listRules: () => Object.freeze([]),
      resolveTradingDayId: () => null,
      listRuleReviews: () => Object.freeze([]),
      listTagsForRoundTrips: () => Object.freeze({}),
      readRoundTripNotes: () => Object.freeze({}),
      readDailyNote: () => null,
    } as unknown as JournalAnnotationService;
    const result = new CoachReflectionService(
      dashboard(),
      emptyAnnotations,
      products(0),
    ).read(scope, Object.freeze({
      period: "daily",
      anchorDate: "2026-02-01",
      currency: "USD",
    }));

    expect(result.summary.dailyNotesSavedCount).toBe(0);
    expect(result.summary.roundTripNotesSavedCount).toBe(0);
    expect(result.prompts.map((prompt) => prompt.code)).toEqual([
      "review_trading_days",
      "review_round_trips",
      "choose_focus_rule",
    ]);
    expect(JSON.stringify(result)).not.toMatch(/mistake|strategy|bag.?hold/iu);
  });

  it("rejects a selected account outside the authorized workspace scope", () => {
    expect(() => new CoachReflectionService(
      dashboard(),
      annotations(),
      products(),
    ).read(Object.freeze({
      ...scope,
      activeAccountId: "00000000-0000-4000-8000-000000000099",
    }), Object.freeze({
      period: "daily",
      anchorDate: null,
      currency: null,
    }))).toThrowError("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  });
});
