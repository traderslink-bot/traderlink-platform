import { describe, expect, it, vi } from "vitest";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type {
  JournalAnalyticsPartitionedResponse,
  JournalAnalyticsRoundTripTableResponse,
} from "@/src/modules/journal-analytics/contracts/analytics-result";

import {
  COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  COACH_AI_CHAT_FACTUAL_TOOL_MAX_GROUPS,
  CoachAiChatFactualToolError,
} from "../contracts/coach-ai-chat-factual-tool-contracts";
import { CoachAiChatFactualToolService } from "./coach-ai-chat-factual-tool-service";

const userId = "10000000-0000-4000-8000-000000000001";
const workspaceId = "10000000-0000-4000-8000-000000000002";
const accountId = "10000000-0000-4000-8000-000000000003";
const otherAccountId = "10000000-0000-4000-8000-000000000004";
const asOfUtc = "2026-08-05T12:00:00.000Z";

const scope: WorkspaceAccessScope = Object.freeze({
  userId,
  workspaceId,
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze([accountId, otherAccountId]),
  activeAccountId: accountId,
});

const overview = Object.freeze({
  resultVersion: "journal_analytics_result_v1",
  factSetRevisionSha256: "fact-set-revision",
  registryVersion: "journal_analytics_metrics_v1",
  generatedAtUtc: asOfUtc,
  partitions: Object.freeze([Object.freeze({
    resultVersion: "journal_analytics_result_v1",
    factSetRevisionSha256: "fact-set-revision",
    registryVersion: "journal_analytics_metrics_v1",
    generatedAtUtc: asOfUtc,
    currency: "USD",
    timezone: "America/New_York",
    metrics: Object.freeze([Object.freeze({
      metricId: "net_pnl",
      formulaVersion: "journal_analytics_formula_v1",
      title: "Net P/L",
      description: "Fee-covered result.",
      valueKind: "money",
      unit: "trade_currency",
      state: "unavailable",
      value: null,
      moneyBasis: "net",
      chargePolicy: "complete_charge_coverage",
      currency: "USD",
      timezonePolicy: "account_timezone",
      dateAttributionPolicy: "closing_date",
      coverage: Object.freeze({
        state: "unavailable", candidateCount: 1, includedCount: 0, excludedCount: 0,
        readyClosedCount: 1, legitimateOpenCount: 0, needsDecisionCount: 0,
        unsupportedCount: 0, feeCompleteCount: 0, feeIncompleteCount: 1,
        unavailableCount: 1, reasonCounts: Object.freeze({ fee_missing: 1 }),
      }),
      limitationReasonCodes: Object.freeze(["fee_missing"]),
      factSetRevisionSha256: "fact-set-revision",
      registryVersion: "journal_analytics_metrics_v1",
      resultDigestSha256: "metric-digest",
    })]),
    groups: Object.freeze([]),
    coverage: Object.freeze({
      state: "unavailable", candidateCount: 1, includedCount: 0, excludedCount: 0,
      readyClosedCount: 1, legitimateOpenCount: 0, needsDecisionCount: 0,
      unsupportedCount: 0, feeCompleteCount: 0, feeIncompleteCount: 1,
      unavailableCount: 1, reasonCounts: Object.freeze({ fee_missing: 1 }),
    }),
    continuationCursor: null,
    limitations: Object.freeze(["fee_missing"]),
    reconciliation: Object.freeze({ status: "not_applicable", reasonCode: null }),
  })]),
  selectedAccountSourceCoverage: Object.freeze({
    excludedExecutionCount: 0,
    unsupportedSourceRecordCount: 0,
    attribution: "selected_accounts_full_scope",
  }),
  crossPartitionCounts: Object.freeze({
    candidateCount: 1, includedCount: 0, readyClosedCount: 1, legitimateOpenCount: 0,
    needsDecisionCount: 0, feeCompleteCount: 0, feeIncompleteCount: 1,
  }),
  limitations: Object.freeze(["fee_missing"]),
}) as JournalAnalyticsPartitionedResponse;

const table = Object.freeze({
  resultVersion: "journal_analytics_result_v1",
  factSetRevisionSha256: "fact-set-revision",
  generatedAtUtc: asOfUtc,
  moneyBasis: "gross",
  currency: "USD",
  timezone: "America/New_York",
  totalRowCount: 2,
  rows: Object.freeze([]),
  continuationCursor: "opaque-next-page",
  limitations: Object.freeze(["rows_bounded"]),
}) as JournalAnalyticsRoundTripTableResponse;

function subject() {
  const analytics = {
    getAnalyticsOverview: vi.fn(() => overview),
    getRoundTripAnalyticsTable: vi.fn(() => table),
  };
  return { analytics, service: new CoachAiChatFactualToolService(analytics) };
}

describe("CoachAiChatFactualToolService", () => {
  it("uses the selected server account and forwards exact unavailable analytics state", () => {
    const { analytics, service } = subject();
    const response = service.summarizeClosedTrades(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "summarize_closed_trades",
      metricIds: ["net_pnl"],
      moneyBasis: "net",
      filters: { closingDateRange: { startDate: "2026-08-01", endDate: "2026-08-05" } },
    }, asOfUtc);

    expect(response.result).toBe(overview);
    expect(response.result.partitions[0]?.metrics[0]?.state).toBe("unavailable");
    expect(response.result.partitions[0]?.coverage.reasonCounts).toEqual({ fee_missing: 1 });
    expect(analytics.getAnalyticsOverview).toHaveBeenCalledWith(scope, expect.objectContaining({
      accountIds: [accountId],
      closingDateRange: { kind: "inclusive_closing_date", startDate: "2026-08-01", endDate: "2026-08-05" },
      moneyBasis: "net",
      metricIds: ["net_pnl"],
      asOfUtc,
    }));
  });

  it("rejects model-invented metrics, unsupported filters, and invalid dates", () => {
    const { service } = subject();
    const base = {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "summarize_closed_trades" as const,
      metricIds: ["gross_pnl"] as const,
      moneyBasis: "gross" as const,
    };
    expect(() => service.summarizeClosedTrades(scope, accountId, {
      ...base, metricIds: ["arbitrary_sql"],
    } as never, asOfUtc)).toThrow(CoachAiChatFactualToolError);
    expect(() => service.summarizeClosedTrades(scope, accountId, {
      ...base, filters: { closingDateRange: { startDate: "2026-08-06", endDate: "2026-08-05" } },
    }, asOfUtc)).toThrow("not valid");
    expect(() => service.summarizeClosedTrades(scope, accountId, {
      ...base, filters: { symbols: ["OK", "bad symbol"] },
    }, asOfUtc)).toThrow("not valid");
  });

  it("only permits approved grouping and forwards it as an analytics grouping", () => {
    const { analytics, service } = subject();
    service.groupClosedTrades(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "group_closed_trades",
      metricIds: ["gross_pnl"],
      grouping: "closing_day",
      moneyBasis: "gross",
    }, asOfUtc);
    expect(analytics.getAnalyticsOverview).toHaveBeenCalledWith(scope, expect.objectContaining({
      groupings: ["closing_day"],
    }));
    expect(() => service.groupClosedTrades(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "group_closed_trades",
      metricIds: ["gross_pnl"],
      grouping: "account",
      moneyBasis: "gross",
    } as never, asOfUtc)).toThrow("not valid");
  });

  it("rejects grouped results that are too large instead of truncating facts", () => {
    const oversizedGroups = Object.freeze(Array.from(
      { length: COACH_AI_CHAT_FACTUAL_TOOL_MAX_GROUPS + 1 },
      (_, index) => Object.freeze({
        grouping: "closing_day" as const,
        groupKey: `2026-01-${String(index + 1).padStart(2, "0")}`,
        label: `Day ${index + 1}`,
        metrics: Object.freeze([]),
      }),
    ));
    const oversizedOverview = Object.freeze({
      ...overview,
      partitions: Object.freeze([Object.freeze({
        ...overview.partitions[0]!,
        groups: oversizedGroups,
      })]),
    }) as JournalAnalyticsPartitionedResponse;
    const analytics = {
      getAnalyticsOverview: vi.fn(() => oversizedOverview),
      getRoundTripAnalyticsTable: vi.fn(() => table),
    };
    const service = new CoachAiChatFactualToolService(analytics);

    expect(() => service.groupClosedTrades(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "group_closed_trades",
      metricIds: ["gross_pnl"],
      grouping: "closing_day",
      moneyBasis: "gross",
    }, asOfUtc)).toThrow("shorter period or narrower filters");
  });

  it("bounds pagination and forwards an opaque cursor unchanged", () => {
    const { analytics, service } = subject();
    const response = service.listClosedTrades(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "list_closed_trades",
      moneyBasis: "gross",
      pageSize: 50,
      afterCursor: "opaque-previous-page",
    }, asOfUtc);
    expect(response.result).toBe(table);
    expect(response.result.continuationCursor).toBe("opaque-next-page");
    expect(analytics.getRoundTripAnalyticsTable).toHaveBeenCalledWith(scope, expect.objectContaining({
      accountIds: [accountId],
      table: { pageSize: 50, afterCursor: "opaque-previous-page" },
    }));
    for (const pageSize of [0, 51]) {
      expect(() => service.listClosedTrades(scope, accountId, {
        contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
        toolName: "list_closed_trades",
        moneyBasis: "gross",
        pageSize,
        afterCursor: null,
      }, asOfUtc)).toThrow("not valid");
    }
  });
});
