import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import type { JournalTradingDayReviewService } from "@/src/modules/journal/server/reviews/journal-trading-day-review-service";

import type { CoachReflectionReadModel } from "../contracts/reflection-loop-contracts";
import { CoachReflectionService } from "./coach-reflection-service";
import { CoachWeeklyAiReviewInputService } from "./coach-weekly-ai-review-input-service";

const accountId = "00000000-0000-4000-8000-000000000001";
const scope: WorkspaceAccessScope = Object.freeze({
  userId: "00000000-0000-4000-8000-000000000002",
  workspaceId: "00000000-0000-4000-8000-000000000003",
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze([accountId]),
  activeAccountId: accountId,
});

const reflection = Object.freeze({
  contractVersion: "traderlink_coach_reflection_v1" as const,
  source: "journal_facts" as const,
  state: "ready" as const,
  period: "weekly" as const,
  anchorDate: "2026-08-09",
  startDate: "2026-08-03",
  endDate: "2026-08-09",
  timezone: "America/New_York",
  currency: "USD",
  availableCurrencies: Object.freeze(["USD"]),
  summary: Object.freeze({
    tradingDayCount: 1,
    readyClosedTradeCount: 1,
    netPnlDecimal: "12",
    winRatePercentDecimal: "100",
    dailyNotesSavedCount: 0,
    roundTripNotesSavedCount: 0,
    taggedTradeCount: 0,
    ruleReviews: Object.freeze({ followed: 0, broken: 0, notReviewed: 0 }),
    activeRuleCount: 0,
    focusRuleCount: 0,
    accountPendingDataDecisionCount: 4,
  }),
  coverage: Object.freeze({
    readyClosedCount: 1,
    legitimateOpenCount: 2,
    needsDecisionCount: 3,
    feeCompleteCount: 1,
    feeIncompleteCount: 0,
    limitationReasonCodes: Object.freeze([]),
    factSetRevisionSha256: "a".repeat(64),
  }),
  focusRules: Object.freeze([]),
  prompts: Object.freeze([]),
  days: Object.freeze([Object.freeze({
    date: "2026-08-05",
    currency: "USD",
    netPnlDecimal: "12",
    tradeCount: 1,
    dailyNoteSaved: false,
    ruleReviews: Object.freeze({ followed: 0, broken: 0, notReviewed: 0 }),
    trades: Object.freeze([Object.freeze({
      roundTripId: "00000000-0000-4000-8000-000000000010",
      symbol: "ABC",
      direction: "long" as const,
      openedAtUtc: "2026-08-05T13:30:00.000Z",
      closedAtUtc: "2026-08-05T14:00:00.000Z",
      netPnlDecimal: "12",
      noteSaved: false,
      tagNames: Object.freeze([]),
      ruleReviews: Object.freeze({ followed: 0, broken: 0, notReviewed: 0 }),
    })]),
  })]),
}) satisfies CoachReflectionReadModel;

function annotations(): JournalAnnotationService {
  const focusRevisions = Object.freeze([
    Object.freeze({
      tradingDate: "2026-07-31",
      revisionNumber: 2,
      currentFocuses: "Carry the plan forward.",
      createdAtUtc: "2026-07-31T20:00:00.000Z",
    }),
    Object.freeze({
      tradingDate: "2026-08-05",
      revisionNumber: 3,
      currentFocuses: "Wait for confirmation.",
      createdAtUtc: "2026-08-05T20:00:00.000Z",
    }),
  ]);
  const requireAccount = (candidate: Readonly<{ accountId: string }>) => {
    if (candidate.accountId !== accountId) throw new Error("wrong account");
  };
  return {
    listDailyFocusRevisions: (account, startDate, endDate) => {
      requireAccount(account);
      return focusRevisions.filter((focus) =>
        focus.tradingDate >= startDate && focus.tradingDate <= endDate);
    },
    readDailyNote: (account) => {
      requireAccount(account);
      return null;
    },
    readRoundTripNotes: (account) => {
      requireAccount(account);
      return Object.freeze({});
    },
    listTagsForRoundTrips: (account) => {
      requireAccount(account);
      return Object.freeze({});
    },
  } as unknown as JournalAnnotationService;
}

describe("Coach weekly AI review input service", () => {
  it("retains exact timestamp duration and labels unsupported trade facts unavailable", () => {
    const service = new CoachWeeklyAiReviewInputService(
      { read: () => reflection } as unknown as CoachReflectionService,
      annotations(),
      { read: () => null } as unknown as JournalTradingDayReviewService,
    );

    const result = service.read(scope, "2026-08-09");
    expect(result.coverage).toMatchObject({
      weekReadyClosedCount: 1,
      accountLegitimateOpenCount: 2,
      accountNeedsDecisionCount: 3,
      accountPendingDataDecisionCount: 4,
    });
    expect(result.days[0]?.trades[0]).toMatchObject({
      executionCount: null,
      realizedGrossPnlDecimal: null,
      holdingDurationMilliseconds: 1_800_000,
      tradingSession: null,
      netPnlDecimal: "12",
    });
  });

  it("includes the focus in effect at week start and only actual in-week revisions", () => {
    const result = new CoachWeeklyAiReviewInputService(
      { read: () => reflection } as unknown as CoachReflectionService,
      annotations(),
      { read: () => null } as unknown as JournalTradingDayReviewService,
    ).read(scope, "2026-08-09");

    expect(result.currentFocuses).toEqual([
      {
        effectiveFromDate: "2026-08-03",
        tradingDate: "2026-07-31",
        revisionNumber: 2,
        text: "Carry the plan forward.",
      },
      {
        effectiveFromDate: "2026-08-05",
        tradingDate: "2026-08-05",
        revisionNumber: 3,
        text: "Wait for confirmation.",
      },
    ]);
  });

  it("keeps malformed or reversed timestamps unavailable", () => {
    const malformedReflection = Object.freeze({
      ...reflection,
      days: Object.freeze([Object.freeze({
        ...reflection.days[0],
        trades: Object.freeze([Object.freeze({
          ...reflection.days[0]!.trades[0],
          openedAtUtc: "not-a-time",
          closedAtUtc: "2026-08-05T14:00:00.000Z",
        })]),
      })]),
    });
    const result = new CoachWeeklyAiReviewInputService(
      { read: () => malformedReflection } as unknown as CoachReflectionService,
      annotations(),
      { read: () => null } as unknown as JournalTradingDayReviewService,
    ).read(scope, "2026-08-09");

    expect(result.days[0]?.trades[0]?.holdingDurationMilliseconds).toBeNull();
  });
});
