import { describe, expect, it, vi } from "vitest";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";

import { COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION } from
  "../contracts/coach-ai-chat-factual-tool-contracts";
import { CoachAiChatDashboardContextService } from
  "./coach-ai-chat-dashboard-context-service";

const accountId = "80000000-0000-4000-8000-000000000003";
const scope: WorkspaceAccessScope = Object.freeze({
  userId: "80000000-0000-4000-8000-000000000001",
  workspaceId: "80000000-0000-4000-8000-000000000002",
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze([accountId]),
  activeAccountId: accountId,
});

function subject() {
  const dashboard = {
    getCalendar: vi.fn(),
    getOpenPositions: vi.fn(),
    getTradingDay: vi.fn(() => Object.freeze({
      state: "ready",
      date: "2026-08-05",
      currency: "USD",
      availableCurrencies: Object.freeze(["USD"]),
      timezone: "America/New_York",
      netPnlDecimal: "15.25",
      previousTradingDate: "2026-08-04",
      nextTradingDate: null,
      latestTradingDate: "2026-08-05",
      tickers: Object.freeze([Object.freeze({
        symbol: "TEST",
        currency: "USD",
        netPnlDecimal: "15.25",
        gainLossPercentDecimal: "12.2",
        roundTrips: Object.freeze([Object.freeze({
          roundTripId: "opaque-trade-ref",
          direction: "long",
          entryAtUtc: "2026-08-05T13:30:00.000Z",
          exitAtUtc: "2026-08-05T14:00:00.000Z",
          entryPriceDecimal: "1.25",
          exitPriceDecimal: "1.5",
          netPnlDecimal: "15.25",
          gainLossPercentDecimal: "12.2",
        })]),
      })]),
      executionActivity: Object.freeze([Object.freeze({
        symbol: "TEST",
        currency: "USD",
        executedAtUtc: "2026-08-05T13:30:00.000Z",
        side: "buy",
        quantityDecimal: "100",
        priceDecimal: "1.25",
        projectionStates: Object.freeze(["ready_closed"]),
        needsDecision: false,
        sourceRecordId: "must-not-leak",
        brokerAccountNumber: "must-not-leak",
      })]),
      decisionActivity: Object.freeze([]),
      openPositions: Object.freeze([]),
      week: null,
      coverage: Object.freeze({ needsDecisionCount: 0 }),
    })),
  };
  const journalContext = { summarize: vi.fn(() => Object.freeze({ dailyNotes: Object.freeze({}) })) };
  const savedReviews = { list: vi.fn(() => Object.freeze([])) };
  const tracker = { listPositions: vi.fn(), listSwings: vi.fn(), positionDetail: vi.fn(), swingDetail: vi.fn() };
  return {
    dashboard,
    journalContext,
    service: new CoachAiChatDashboardContextService(
      {} as never,
      dashboard as never,
      tracker as never,
      journalContext as never,
      savedReviews as never,
    ),
  };
}

describe("CoachAiChatDashboardContextService", () => {
  it("returns bounded trading-day facts without raw broker or source identifiers", () => {
    const { dashboard, journalContext, service } = subject();
    const response = service.tradingDayDetails(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "get_trading_day_details",
      tradingDate: "2026-08-05",
      currency: "USD",
    }, "2026-08-15T12:00:00.000Z");

    expect(response.result).toMatchObject({
      tradingDate: "2026-08-05",
      currency: "USD",
      tickers: [{ ticker: "TEST", trades: [{ tradeRef: "opaque-trade-ref" }] }],
      executions: [{ ticker: "TEST", quantityDecimal: "100", priceDecimal: "1.25" }],
      link: "/trade-tracker/2026-08-05",
    });
    expect(JSON.stringify(response)).not.toContain("must-not-leak");
    expect(dashboard.getTradingDay).toHaveBeenCalledWith(scope, {
      requestedDate: "2026-08-05",
      currency: "USD",
      asOfUtc: "2026-08-15T12:00:00.000Z",
    });
    expect(journalContext.summarize).toHaveBeenCalledWith(scope, {
      period: "daily",
      anchorDate: "2026-08-05",
      currency: "USD",
    });
  });

  it("rejects another account before calling a dashboard read model", () => {
    const { dashboard, service } = subject();
    expect(() => service.tradingDayDetails(scope,
      "80000000-0000-4000-8000-000000000099", {
        contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
        toolName: "get_trading_day_details",
        tradingDate: "2026-08-05",
      }, "2026-08-15T12:00:00.000Z")).toThrow();
    expect(dashboard.getTradingDay).not.toHaveBeenCalled();
  });
});
