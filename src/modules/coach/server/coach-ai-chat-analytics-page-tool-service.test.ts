import { describe, expect, it, vi } from "vitest";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";

import {
  COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  COACH_AI_CHAT_TRADE_EXPLORER_METRIC_IDS,
  COACH_AI_CHAT_TRADE_EXPLORER_TRADE_SORTS,
} from
  "../contracts/coach-ai-chat-factual-tool-contracts";
import {
  TRADE_EXPLORER_DAY_STATISTIC_GROUPS,
  TRADE_EXPLORER_TRADE_SORT_OPTIONS,
  TRADE_EXPLORER_TRADE_STATISTIC_GROUPS,
} from "@/src/modules/journal-analytics/presentation/trade-explorer-ordering";
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
  it("keeps Chat's Trade Explorer choices aligned with the current page contract", () => {
    expect(COACH_AI_CHAT_TRADE_EXPLORER_TRADE_SORTS).toEqual(
      TRADE_EXPLORER_TRADE_SORT_OPTIONS.map((option) => option.value),
    );
    expect(new Set(COACH_AI_CHAT_TRADE_EXPLORER_METRIC_IDS)).toEqual(new Set([
      ...TRADE_EXPLORER_DAY_STATISTIC_GROUPS.flatMap((group) => group.metricIds),
      ...TRADE_EXPLORER_TRADE_STATISTIC_GROUPS.flatMap((group) => group.metricIds),
    ]));
  });

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
      resultView: "trades",
      tradeSort: "shares_asc",
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
      resultView: "trades",
      selectedMetricId: null,
      grouping: null,
      tradeSort: "shares_asc",
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
    expect(analytics.getRoundTripAnalyticsTable).toHaveBeenCalledWith(
      scope,
      expect.anything(),
      { field: "entered_quantity", direction: "ascending" },
    );
  });

  it("rejects reversed exact decimal ranges rather than comparing rounded JavaScript numbers", () => {
    const { service } = subject();
    expect(() => service.tradeExplorer(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "query_trade_explorer",
      resultView: "trades",
      tradeSort: "closed_desc",
      moneyBasis: "net",
      pageSize: 25,
      afterCursor: null,
      filters: {
        minimumEnteredQuantity: "9007199254740994",
        maximumEnteredQuantity: "9007199254740993",
      },
    }, asOfUtc)).toThrow("not valid");
  });

  it("rejects an account outside the server-selected workspace scope before analytics reads", () => {
    const { analytics, service } = subject();
    expect(() => service.tradeExplorer(
      scope,
      "70000000-0000-4000-8000-000000000099",
      {
        contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
        toolName: "query_trade_explorer",
        resultView: "trades",
        tradeSort: "closed_desc",
        moneyBasis: "net",
        pageSize: 25,
        afterCursor: null,
      },
      asOfUtc,
    )).toThrow();
    expect(analytics.getAnalyticsOverview).not.toHaveBeenCalled();
    expect(analytics.getRoundTripAnalyticsTable).not.toHaveBeenCalled();
  });

  it("ranks grouped results by the selected population metric without returning trade rows", () => {
    const { analytics, service } = subject();
    analytics.getAnalyticsOverview.mockReturnValueOnce(Object.freeze({
      partitions: Object.freeze([Object.freeze({
        currency: "USD",
        groups: Object.freeze([
          Object.freeze({
            label: "AAA",
            metrics: Object.freeze([Object.freeze({
              metricId: "profit_factor",
              value: Object.freeze({
                kind: "rational",
                numeratorDecimal: "3",
                denominatorInteger: "2",
              }),
            })]),
          }),
          Object.freeze({
            label: "BBB",
            metrics: Object.freeze([Object.freeze({
              metricId: "profit_factor",
              value: Object.freeze({
                kind: "rational",
                numeratorDecimal: "7",
                denominatorInteger: "2",
              }),
            })]),
          }),
        ]),
      })]),
    }) as never);

    const result = service.tradeExplorer(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "query_trade_explorer",
      resultView: "tickers",
      metricId: "profit_factor",
      grouping: "instrument",
      rankDirection: "descending",
      moneyBasis: "net",
      filters: { currency: "USD" },
    }, asOfUtc);

    expect(result.result).toMatchObject({
      resultView: "tickers",
      selectedMetricId: "profit_factor",
      grouping: "instrument",
      rankDirection: "descending",
      response: { partitions: [{ groups: [{ label: "BBB" }, { label: "AAA" }] }] },
      evidence: null,
      evidenceUnavailableReason: null,
    });
    expect(analytics.getRoundTripAnalyticsTable).not.toHaveBeenCalled();
  });
});
