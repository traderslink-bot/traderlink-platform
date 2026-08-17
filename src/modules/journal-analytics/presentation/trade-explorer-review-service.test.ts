import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => {
  const account = Object.freeze({
    accountId: "10000000-0000-4000-8000-000000000003",
    userId: "10000000-0000-4000-8000-000000000001",
    workspaceId: "10000000-0000-4000-8000-000000000002",
    workspaceRole: "owner" as const,
  });
  const annotations = {
    createTag: vi.fn(),
    listRuleReviews: vi.fn(),
    listRulesForEvaluation: vi.fn(),
    listTags: vi.fn(),
    listTagsForRoundTrips: vi.fn(),
    readRoundTripNotes: vi.fn(),
    resolveTradingDayId: vi.fn(),
    saveTradeReview: vi.fn(),
  };
  const dashboard = { getTradingDay: vi.fn() };
  const facts = { getJournalAnalyticsFactSet: vi.fn() };
  return {
    account,
    annotations,
    dashboard,
    evaluateJournalPresetRules: vi.fn(),
    facts,
    requireActiveJournalAnalyticsAccountId: vi.fn(),
    requireExpectedJournalAccountSelection: vi.fn(),
  };
});

vi.mock("@/src/modules/journal/server/annotations/journal-preset-rule-evaluator", () => ({
  evaluateJournalPresetRules: mocks.evaluateJournalPresetRules,
}));

vi.mock("@/src/modules/journal/server/annotations/journal-annotation-runtime", () => ({
  withReadonlyJournalAnnotations: (
    _scope: unknown,
    operation: (service: typeof mocks.annotations, account: typeof mocks.account) => unknown,
  ) => operation(mocks.annotations, mocks.account),
  withWritableJournalAnnotations: (
    _scope: unknown,
    operation: (service: typeof mocks.annotations, account: typeof mocks.account) => unknown,
  ) => operation(mocks.annotations, mocks.account),
}));

vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireExpectedJournalAccountSelection: mocks.requireExpectedJournalAccountSelection,
}));

vi.mock("@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime", () => ({
  requireActiveJournalAnalyticsAccountId: mocks.requireActiveJournalAnalyticsAccountId,
  withJournalAnalyticsDashboardRuntime: (
    _scope: unknown,
    operation: (runtime: Readonly<{
      dashboard: typeof mocks.dashboard;
      facts: typeof mocks.facts;
    }>) => unknown,
  ) => operation({ dashboard: mocks.dashboard, facts: mocks.facts }),
}));

import {
  readTradeExplorerReview,
  saveTradeExplorerReview,
} from "../../../../app/(dashboard)/analytics/trade-explorer/trade-review-service";

const roundTripId = "20000000-0000-4000-8000-000000000001";
const dayId = "20000000-0000-4000-8000-000000000002";
const customRuleId = "20000000-0000-4000-8000-000000000003";
const customVersionId = "20000000-0000-4000-8000-000000000004";
const presetRuleId = "20000000-0000-4000-8000-000000000005";
const presetVersionId = "20000000-0000-4000-8000-000000000006";
const tagId = "20000000-0000-4000-8000-000000000007";
const closeLocalDate = "2026-08-15";
const scope: WorkspaceAccessScope = Object.freeze({
  activeAccountId: mocks.account.accountId,
  allowedAccountIds: Object.freeze([mocks.account.accountId]),
  userId: mocks.account.userId,
  workspaceId: mocks.account.workspaceId,
  workspaceRole: "owner",
});

const customRule = Object.freeze({
  activeIntervals: Object.freeze([Object.freeze({
    fromUtc: "2026-01-01T00:00:00.000Z",
    untilUtc: null,
  })]),
  effectiveFromUtc: "2026-01-01T00:00:00.000Z",
  effectiveUntilUtc: null,
  reviewScope: "trade" as const,
  ruleId: customRuleId,
  sourceKind: "custom" as const,
  statement: "Wait for the planned confirmation before entering.",
  title: "Wait for confirmation",
  versionId: customVersionId,
});

const presetRule = Object.freeze({
  activeIntervals: Object.freeze([Object.freeze({
    fromUtc: "2026-01-01T00:00:00.000Z",
    untilUtc: null,
  })]),
  effectiveFromUtc: "2026-01-01T00:00:00.000Z",
  effectiveUntilUtc: null,
  reviewScope: "trade" as const,
  ruleId: presetRuleId,
  sourceKind: "template" as const,
  statement: "Keep risk within the recorded limit.",
  title: "Risk limit",
  versionId: presetVersionId,
});

function readyFactSet(projectionState = "ready_closed") {
  return Object.freeze({
    accounts: Object.freeze([Object.freeze({
      accountId: mocks.account.accountId,
      tradingTimezone: "America/Toronto",
    })]),
    roundTrips: Object.freeze([Object.freeze({
      accountId: mocks.account.accountId,
      closedAtUtc: "2026-08-15T15:00:00.000Z",
      direction: "long" as const,
      displayedSymbol: "TEST",
      openedAtUtc: "2026-08-15T14:00:00.000Z",
      projectionState,
      roundTripId,
      tradeCurrency: "USD",
    })]),
  });
}

function seedReviewFacts(): void {
  mocks.requireActiveJournalAnalyticsAccountId.mockReturnValue(mocks.account.accountId);
  mocks.facts.getJournalAnalyticsFactSet.mockReturnValue(readyFactSet());
  mocks.dashboard.getTradingDay.mockReturnValue(Object.freeze({ tradingDate: closeLocalDate }));
  mocks.annotations.listRulesForEvaluation.mockReturnValue(Object.freeze([
    customRule,
    presetRule,
  ]));
  mocks.annotations.resolveTradingDayId.mockReturnValue(dayId);
  mocks.annotations.listRuleReviews.mockReturnValue(Object.freeze([Object.freeze({
    revision: 2,
    roundTripId,
    ruleId: customRuleId,
    ruleVersionId: customVersionId,
    status: "followed" as const,
    targetKind: "round_trip" as const,
  })]));
  mocks.annotations.readRoundTripNotes.mockReturnValue(Object.freeze({
    [roundTripId]: Object.freeze({
      revision: 3,
      technicalNote: "Preserved technical note",
      tradeNote: "Waited for the setup.",
    }),
  }));
  const tag = Object.freeze({
    assignmentCount: 4,
    name: "Patient entry",
    revision: 1,
    tagId,
  });
  mocks.annotations.listTags.mockReturnValue(Object.freeze([tag]));
  mocks.annotations.listTagsForRoundTrips.mockReturnValue(Object.freeze({
    [roundTripId]: Object.freeze([tag]),
  }));
  mocks.evaluateJournalPresetRules.mockReturnValue(Object.freeze([Object.freeze({
    evidence: Object.freeze({ limitation: null }),
    ruleId: presetRuleId,
    ruleVersionId: presetVersionId,
    status: "broken" as const,
    targetKind: "round_trip" as const,
    targetRoundTripId: roundTripId,
  })]));
}

beforeEach(() => {
  vi.clearAllMocks();
  seedReviewFacts();
});

describe("Trade Explorer completed-trade review service", () => {
  it("returns trader-authored fields and read-only automatic results for the exact completed trade", () => {
    const result = readTradeExplorerReview(scope, {
      closeLocalDate,
      expectedAccountSelectionRef: "selected-account",
      roundTripId,
    });

    expect(mocks.requireExpectedJournalAccountSelection).toHaveBeenCalledWith(
      scope,
      "selected-account",
    );
    expect(mocks.facts.getJournalAnalyticsFactSet).toHaveBeenCalledWith(
      scope,
      expect.objectContaining({
        accountIds: [mocks.account.accountId],
        closingDateRange: {
          endDate: closeLocalDate,
          kind: "inclusive_closing_date",
          startDate: closeLocalDate,
        },
        currencySelection: { kind: "all_partitions" },
      }),
    );
    expect(result).toMatchObject({
      customRules: [{
        revision: 2,
        ruleId: customRuleId,
        ruleVersionId: customVersionId,
        status: "followed",
      }],
      note: {
        revision: 3,
        tradeNote: "Waited for the setup.",
      },
      presetRules: [{
        ruleId: presetRuleId,
        ruleVersionId: presetVersionId,
        status: "broken",
      }],
      selectedTagIds: [tagId],
      trade: { closeLocalDate, displayedSymbol: "TEST", roundTripId },
    });
  });

  it("rejects a row that is not a confirmed completed trade", () => {
    mocks.facts.getJournalAnalyticsFactSet.mockReturnValue(readyFactSet("open"));

    expect(() => readTradeExplorerReview(scope, {
      closeLocalDate,
      expectedAccountSelectionRef: "selected-account",
      roundTripId,
    })).toThrowError("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    expect(mocks.annotations.listRulesForEvaluation).not.toHaveBeenCalled();
  });

  it("saves only an applicable custom rule version through the atomic review command", () => {
    const input = Object.freeze({
      closeLocalDate,
      expectedAccountSelectionRef: "selected-account",
      note: Object.freeze({
        expectedRevision: 3,
        tradeNote: "Updated review.",
      }),
      roundTripId,
      ruleReviews: Object.freeze([Object.freeze({
        expectedRevision: 2,
        ruleId: customRuleId,
        ruleVersionId: customVersionId,
        status: "broken" as const,
      })]),
      tags: Object.freeze({
        expectedTagIds: Object.freeze([tagId]),
        presetKeys: Object.freeze([]),
        tagIds: Object.freeze([tagId]),
      }),
    });

    saveTradeExplorerReview(scope, input);

    expect(mocks.annotations.saveTradeReview).toHaveBeenCalledTimes(1);
    expect(mocks.annotations.saveTradeReview).toHaveBeenCalledWith(
      mocks.account,
      {
        note: input.note,
        roundTripId,
        ruleReviews: input.ruleReviews,
        tags: input.tags,
      },
    );
  });

  it("refuses a stale or inapplicable rule result before writing", () => {
    expect(() => saveTradeExplorerReview(scope, {
      closeLocalDate,
      expectedAccountSelectionRef: "selected-account",
      note: null,
      roundTripId,
      ruleReviews: Object.freeze([Object.freeze({
        expectedRevision: 2,
        ruleId: presetRuleId,
        ruleVersionId: presetVersionId,
        status: "followed" as const,
      })]),
      tags: null,
    })).toThrowError("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    expect(mocks.annotations.saveTradeReview).not.toHaveBeenCalled();
  });
});
