import { describe, expect, it, vi } from "vitest";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";

import { COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION } from
  "../contracts/coach-ai-chat-factual-tool-contracts";
import { CoachAiChatAnalyticsPageToolService } from
  "./coach-ai-chat-analytics-page-tool-service";

const accountId = "70000000-0000-4000-8000-000000000003";
const scope: WorkspaceAccessScope = Object.freeze({
  userId: "70000000-0000-4000-8000-000000000001",
  workspaceId: "70000000-0000-4000-8000-000000000002",
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze([accountId]),
  activeAccountId: accountId,
});
const asOfUtc = "2026-08-15T12:00:00.000Z";

function response(currency = "USD") {
  return Object.freeze({
    partitions: Object.freeze([Object.freeze({ currency })]),
  });
}

function subject() {
  const analytics = {
    getAnalyticsOverview: vi.fn(() => response()),
    getResultAnalytics: vi.fn(() => response()),
    getTimingAnalytics: vi.fn(() => response()),
    getExecutionAnalytics: vi.fn(() => response()),
    getRoundTripAnalyticsTable: vi.fn(() => Object.freeze({ rows: Object.freeze([]) })),
  };
  return {
    analytics,
    service: new CoachAiChatAnalyticsPageToolService(analytics as never),
  };
}

describe("CoachAiChatAnalyticsPageToolService", () => {
  it("uses the exact canonical contract for each current analytics page", () => {
    const { analytics, service } = subject();
    service.readPage(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "get_results_by_ticker",
      moneyBasis: "net",
      filters: { closingDateRange: { startDate: "2026-08-01", endDate: "2026-08-15" } },
    }, asOfUtc);

    expect(analytics.getResultAnalytics).toHaveBeenCalledWith(scope, expect.objectContaining({
      accountIds: [accountId],
      groupings: ["instrument"],
      metricIds: ["average_pnl", "net_pnl", "profit_factor", "total_trades", "trading_day_count", "win_rate"],
      closingDateRange: {
        kind: "inclusive_closing_date",
        startDate: "2026-08-01",
        endDate: "2026-08-15",
      },
    }));
  });

  it("returns only bounded canonical Trade Explorer evidence and preserves exact decimal ranges", () => {
    const { analytics, service } = subject();
    const result = service.tradeExplorer(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "query_trade_explorer",
      metricId: "net_pnl",
      grouping: "instrument",
      moneyBasis: "net",
      pageSize: 25,
      afterCursor: null,
      filters: {
        currency: "USD",
        symbols: ["test"],
        minimumEnteredQuantity: "9007199254740993",
        maximumEnteredQuantity: "9007199254740994",
      },
    }, asOfUtc);

    expect(result.result).toMatchObject({
      selectedMetricId: "net_pnl",
      grouping: "instrument",
      evidenceUnavailableReason: null,
    });
    expect(analytics.getAnalyticsOverview).toHaveBeenCalledWith(scope, expect.objectContaining({
      symbols: ["TEST"],
      enteredQuantityRange: {
        minimumInclusive: "9007199254740993",
        maximumInclusive: "9007199254740994",
      },
      table: { pageSize: 25, afterCursor: null },
    }));
    expect(analytics.getRoundTripAnalyticsTable).toHaveBeenCalledTimes(1);
  });

  it("rejects reversed exact decimal ranges rather than comparing rounded JavaScript numbers", () => {
    const { service } = subject();
    expect(() => service.tradeExplorer(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "query_trade_explorer",
      metricId: "net_pnl",
      grouping: "instrument",
      moneyBasis: "net",
      pageSize: 25,
      afterCursor: null,
      filters: {
        minimumEnteredQuantity: "9007199254740994",
        maximumEnteredQuantity: "9007199254740993",
      },
    }, asOfUtc)).toThrow("not valid");
  });
});
