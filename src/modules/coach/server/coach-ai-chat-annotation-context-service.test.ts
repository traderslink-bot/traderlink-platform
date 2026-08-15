import { describe, expect, it, vi } from "vitest";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";

import { COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION } from
  "../contracts/coach-ai-chat-factual-tool-contracts";
import { CoachAiChatAnnotationContextService } from
  "./coach-ai-chat-annotation-context-service";

const accountId = "70000000-0000-4000-8000-000000000003";
const roundTripId = "70000000-0000-4000-8000-000000000004";
const ruleId = "70000000-0000-4000-8000-000000000005";
const scope: WorkspaceAccessScope = Object.freeze({
  userId: "70000000-0000-4000-8000-000000000001",
  workspaceId: "70000000-0000-4000-8000-000000000002",
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze([accountId]),
  activeAccountId: accountId,
});

function rule() {
  return Object.freeze({
    ruleId,
    sourceKind: "template" as const,
    templateKey: "maximum_trades_per_day",
    title: "Maximum completed trades per day",
    statement: "Review completed trades after the selected daily trade limit.",
    category: "day",
    reviewScope: "day" as const,
    isFocus: false,
    configuration: Object.freeze({ maximumTrades: "3" }),
    lifecycleState: "active" as const,
    versionNumber: 2,
    versionId: "70000000-0000-4000-8000-000000000006",
    revision: 2,
    effectiveFromUtc: "2026-08-01T00:00:00.000Z",
    effectiveUntilUtc: null,
    activeIntervals: Object.freeze([]),
    createdAtUtc: "2026-08-01T00:00:00.000Z",
    updatedAtUtc: "2026-08-02T00:00:00.000Z",
  });
}

function fixture() {
  const facts = {
    getJournalAnalyticsFactSet: vi.fn(() => Object.freeze({
      sourceRevisionSha256: "a".repeat(64),
      accounts: Object.freeze([Object.freeze({ accountId, tradingTimezone: "America/New_York" })]),
      roundTrips: Object.freeze([Object.freeze({
        roundTripId,
        accountId,
        displayedSymbol: "TEST",
        tradeCurrency: "USD",
        direction: "long" as const,
        openedAtUtc: "2026-08-05T13:30:00.000Z",
        closedAtUtc: "2026-08-05T14:00:00.000Z",
        projectionState: "ready_closed" as const,
      })]),
    })),
  };
  const dashboard = { getTradingDay: vi.fn() };
  const annotations = {
    listTags: vi.fn(() => Object.freeze([])),
    listRules: vi.fn(() => Object.freeze([rule()])),
    listRulesForEvaluation: vi.fn(() => Object.freeze([])),
    listRuleReviews: vi.fn(() => Object.freeze([Object.freeze({
      ruleReviewId: "private-review-id",
      ruleId,
      ruleVersionId: "70000000-0000-4000-8000-000000000006",
      targetKind: "round_trip" as const,
      tradingDayId: null,
      roundTripId,
      status: "followed" as const,
      note: "Waited for the setup.",
      revision: 1,
      updatedAtUtc: "2026-08-05T15:00:00.000Z",
    })])),
    readRoundTripNotes: vi.fn(() => Object.freeze({
      [roundTripId]: Object.freeze({
        roundTripNoteId: "private-note-id",
        roundTripId,
        revision: 1,
        technicalNote: "private technical note",
        tradeNote: "Kept the entry patient.",
        createdAtUtc: "2026-08-05T15:00:00.000Z",
        updatedAtUtc: "2026-08-05T15:00:00.000Z",
      }),
    })),
    listTagsForRoundTrips: vi.fn(() => Object.freeze({
      [roundTripId]: Object.freeze([Object.freeze({
        tagId: "private-tag-id",
        name: "Patient entry",
        lifecycleState: "active" as const,
        revision: 1,
        assignmentCount: 1,
        createdAtUtc: "2026-08-05T15:00:00.000Z",
        updatedAtUtc: "2026-08-05T15:00:00.000Z",
      })]),
    })),
    resolveTradingDayId: vi.fn(),
  };
  return {
    annotations,
    dashboard,
    service: new CoachAiChatAnnotationContextService(
      facts as never,
      dashboard as never,
      annotations as never,
    ),
  };
}

describe("CoachAiChatAnnotationContextService", () => {
  it("lists exact saved rule settings without private rule identifiers", () => {
    const { service } = fixture();
    const response = service.listRules(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "list_trading_rules",
      state: "active",
    });
    expect(response.result).toMatchObject({
      state: "active",
      rules: [{
        title: "Maximum completed trades per day",
        kind: "Preset",
        appliesTo: "Trading day",
        configuration: { maximumTrades: "3" },
        status: "active",
      }],
    });
    expect(JSON.stringify(response)).not.toContain(ruleId);
  });

  it("returns one trade's saved note, tags, and custom review without private record identifiers", () => {
    const { service } = fixture();
    const response = service.tradeAnnotations(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "get_trade_annotations",
      roundTripId,
    }, Object.freeze({ kind: "recent" }));
    expect(response.result).toMatchObject({
      trade: { ticker: "TEST", currency: "USD", direction: "long" },
      tradeNote: { text: "Kept the entry patient." },
      tags: ["Patient entry"],
      customRuleReviews: [{
        title: "Maximum completed trades per day",
        status: "Followed",
        note: "Waited for the setup.",
      }],
    });
    const serialized = JSON.stringify(response);
    for (const value of [roundTripId, ruleId, "private-review-id", "private-note-id",
      "private-tag-id", "private technical note"]) {
      expect(serialized).not.toContain(value);
    }
  });

  it("rejects oversized rule-result periods and another account before reading Journal data", () => {
    const { annotations, dashboard, service } = fixture();
    expect(() => service.ruleResults(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "get_trading_rule_results",
      startDate: "2026-01-01",
      endDate: "2026-08-05",
    })).toThrow();
    expect(() => service.listRules(scope,
      "70000000-0000-4000-8000-000000000099", {
        contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
        toolName: "list_trading_rules",
        state: "all",
      })).toThrow();
    expect(dashboard.getTradingDay).not.toHaveBeenCalled();
    expect(annotations.listRules).not.toHaveBeenCalled();
  });
});
