import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import type { JournalTradingDayReviewService } from "@/src/modules/journal/server/reviews/journal-trading-day-review-service";

import type { CoachReflectionReadModel } from "../contracts/reflection-loop-contracts";
import type { CoachAiReviewRepository } from "./coach-ai-review-repository";
import {
  assessCoachFirstPartialMonthEligibility,
  CoachMonthlyAiReviewInputService,
} from "./coach-monthly-ai-review-input-service";
import { CoachReflectionService } from "./coach-reflection-service";

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
  period: "monthly" as const,
  anchorDate: "2026-08-31",
  startDate: "2026-08-01",
  endDate: "2026-08-31",
  timezone: "America/New_York",
  currency: "USD",
  availableCurrencies: Object.freeze(["USD"]),
  summary: Object.freeze({
    tradingDayCount: 2,
    readyClosedTradeCount: 2,
    netPnlDecimal: "10",
    winRatePercentDecimal: "50",
    dailyNotesSavedCount: 0,
    roundTripNotesSavedCount: 0,
    taggedTradeCount: 0,
    ruleReviews: Object.freeze({ followed: 0, broken: 0, notReviewed: 0 }),
    activeRuleCount: 0,
    focusRuleCount: 0,
    accountPendingDataDecisionCount: 4,
  }),
  coverage: Object.freeze({
    readyClosedCount: 2,
    legitimateOpenCount: 2,
    needsDecisionCount: 3,
    feeCompleteCount: 2,
    feeIncompleteCount: 0,
    limitationReasonCodes: Object.freeze([]),
    factSetRevisionSha256: "a".repeat(64),
  }),
  focusRules: Object.freeze([]),
  prompts: Object.freeze([]),
  days: Object.freeze([
    Object.freeze({
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
    }),
    Object.freeze({
      date: "2026-08-27",
      currency: "USD",
      netPnlDecimal: "-2",
      tradeCount: 1,
      dailyNoteSaved: false,
      ruleReviews: Object.freeze({ followed: 0, broken: 1, notReviewed: 0 }),
      trades: Object.freeze([Object.freeze({
        roundTripId: "00000000-0000-4000-8000-000000000011",
        symbol: "XYZ",
        direction: "short" as const,
        openedAtUtc: "2026-08-27T13:30:00.000Z",
        closedAtUtc: "2026-08-27T14:15:00.000Z",
        netPnlDecimal: "-2",
        noteSaved: false,
        tagNames: Object.freeze([]),
        ruleReviews: Object.freeze({ followed: 0, broken: 1, notReviewed: 0 }),
      })]),
    }),
  ]),
}) satisfies CoachReflectionReadModel;

function annotations(): JournalAnnotationService {
  const focusRevisions = Object.freeze([
    Object.freeze({
      tradingDate: "2026-08-20",
      revisionNumber: 2,
      currentFocuses: "Carry the plan forward.",
      createdAtUtc: "2026-08-20T20:00:00.000Z",
    }),
    Object.freeze({
      tradingDate: "2026-08-27",
      revisionNumber: 3,
      currentFocuses: "Wait for confirmation.",
      createdAtUtc: "2026-08-27T20:00:00.000Z",
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
    readDailyNote: (account, tradingDate) => {
      requireAccount(account);
      return tradingDate === "2026-08-27" ? {
        whatWorked: "Followed the plan.",
        whatNeedsWork: "Waited too long.",
        technicalRecap: "Kept size small.",
        anythingElse: "",
      } : null;
    },
    readRoundTripNotes: (account, roundTripIds) => {
      requireAccount(account);
      return roundTripIds.includes("00000000-0000-4000-8000-000000000011")
        ? Object.freeze({
          "00000000-0000-4000-8000-000000000011": Object.freeze({
            tradeNote: "Covered too early.",
          }),
        })
        : Object.freeze({});
    },
    listTagsForRoundTrips: (account, roundTripIds) => {
      requireAccount(account);
      return roundTripIds.includes("00000000-0000-4000-8000-000000000011")
        ? Object.freeze({
          "00000000-0000-4000-8000-000000000011": Object.freeze([
            Object.freeze({ name: "Late entry" }),
            Object.freeze({ name: "Breakout" }),
          ]),
        })
        : Object.freeze({});
    },
  } as unknown as JournalAnnotationService;
}

function issuedWeeklyReviews(): Pick<CoachAiReviewRepository, "listIssuedWeeklyReviews"> {
  return {
    listIssuedWeeklyReviews: (candidate) => {
      if (candidate.activeAccountId !== accountId) throw new Error("wrong account");
      return Object.freeze([
        Object.freeze({
          weekStartDate: "2026-07-26",
          weekEndDate: "2026-08-01",
          output: Object.freeze({ weeklyReview: "Outside the month." }),
        }),
        Object.freeze({
          weekStartDate: "2026-08-03",
          weekEndDate: "2026-08-09",
          output: Object.freeze({
            weeklyReview: "Inside the month.",
            whatImproved: "Held risk steady.",
            whatHeldYouBack: "One late entry.",
            focusFollowThrough: "Notes supported the focus.",
            nextWeekFocuses: Object.freeze(["Wait for confirmation."]),
            incompleteRecord: null,
          }),
        }),
      ]);
    },
  } as unknown as Pick<CoachAiReviewRepository, "listIssuedWeeklyReviews">;
}

describe("Coach monthly AI review input service", () => {
  it("builds selected-account partial-month facts and includes only weekly reviews within the period", () => {
    const result = new CoachMonthlyAiReviewInputService(
      { read: () => reflection } as unknown as CoachReflectionService,
      annotations(),
      { read: (_account, date) => date === "2026-08-27" ? { status: "reviewed" } : null } as unknown as JournalTradingDayReviewService,
      issuedWeeklyReviews(),
    ).read(scope, {
      startDate: "2026-08-25",
      endDate: "2026-08-31",
      periodCoverage: "partial_month",
    });

    expect(result.month).toMatchObject({
      startDate: "2026-08-25",
      endDate: "2026-08-31",
      periodCoverage: "partial_month",
    });
    expect(result.summary).toMatchObject({
      tradingDayCount: 1,
      readyClosedTradeCount: 1,
      netPnlDecimal: "-2",
      winRatePercentDecimal: "0",
    });
    expect(result.days[0]?.trades[0]).toMatchObject({
      executionCount: null,
      realizedGrossPnlDecimal: null,
      holdingDurationMilliseconds: 2_700_000,
      tradingSession: null,
      note: "Covered too early.",
      tags: ["Breakout", "Late entry"],
    });
    expect(result.currentFocuses).toEqual([
      {
        effectiveFromDate: "2026-08-25",
        tradingDate: "2026-08-20",
        revisionNumber: 2,
        text: "Carry the plan forward.",
      },
      {
        effectiveFromDate: "2026-08-27",
        tradingDate: "2026-08-27",
        revisionNumber: 3,
        text: "Wait for confirmation.",
      },
    ]);
    expect(result.issuedWeeklyReviews).toEqual([]);
    expect(result.priorMonthlyReview).toBeNull();
  });

  it("retains only complete weekly periods that belong to a complete calendar month", () => {
    const result = new CoachMonthlyAiReviewInputService(
      { read: () => reflection } as unknown as CoachReflectionService,
      annotations(),
      { read: () => null } as unknown as JournalTradingDayReviewService,
      issuedWeeklyReviews(),
    ).read(scope, {
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      periodCoverage: "complete_month",
    });

    expect(result.issuedWeeklyReviews).toEqual([expect.objectContaining({
      weekStartDate: "2026-08-03",
      weekEndDate: "2026-08-09",
      weeklyReview: "Inside the month.",
    })]);
  });

  it("requires seven calendar days and three reviewed trading days for the first partial month", () => {
    expect(assessCoachFirstPartialMonthEligibility({
      aiReviewsEnabledDate: "2026-08-25",
      period: {
        startDate: "2026-08-25",
        endDate: "2026-08-31",
        periodCoverage: "partial_month",
      },
      reviewedTradingDayCount: 3,
    })).toEqual({ eligible: true, calendarDayCount: 7 });
    expect(assessCoachFirstPartialMonthEligibility({
      aiReviewsEnabledDate: "2026-08-26",
      period: {
        startDate: "2026-08-26",
        endDate: "2026-08-31",
        periodCoverage: "partial_month",
      },
      reviewedTradingDayCount: 3,
    })).toEqual({ eligible: false, calendarDayCount: 6 });
  });
});
