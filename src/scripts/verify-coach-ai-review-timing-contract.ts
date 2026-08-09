import {
  COACH_PERIODIC_AI_REVIEW_INPUT_CONTRACT_VERSION,
  type CoachPeriodicAiReviewInputV2,
} from "@/src/modules/coach/contracts/weekly-ai-review-input-contracts";
import {
  assessCoachPeriodicEvidenceSufficiencyV2,
} from "@/src/modules/coach/server/coach-ai-review-evidence-sufficiency";
import {
  assessCoachPeriodicReviewEligibilityV2,
} from "@/src/modules/coach/server/coach-ai-review-eligibility";
import type {
  CoachPeriodicAiReviewSnapshotV2,
} from "@/src/modules/coach/server/coach-weekly-ai-review-input-runtime";

const SEALED_AT_UTC = "2026-08-07T20:00:00.000Z";
const FOLLOWING_WEEK_SEALED_AT_UTC = "2026-08-14T20:00:00.000Z";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function input(options: Readonly<{
  readyClosedTradeCount: number;
  reflectionState: "completed" | "incomplete";
  includeSavedReflection?: boolean;
}>): CoachPeriodicAiReviewInputV2 {
  return Object.freeze({
    contractVersion: COACH_PERIODIC_AI_REVIEW_INPUT_CONTRACT_VERSION,
    period: Object.freeze({
      cadence: "weekly" as const,
      startDate: "2026-08-03",
      endDate: "2026-08-07",
      calendarTimezone: "America/New_York" as const,
      currency: "USD",
      calendarId: "verification-calendar",
      calendarEvidenceDigestSha256: "verification-digest",
      cohorts: Object.freeze([Object.freeze({
        mondayDate: "2026-08-03",
        fridayDate: "2026-08-07",
        openSessionDates: Object.freeze([
          "2026-08-03",
          "2026-08-04",
          "2026-08-05",
          "2026-08-06",
          "2026-08-07",
        ]),
        finalOpenSessionDate: "2026-08-07",
        sealedAtUtc: SEALED_AT_UTC,
      })]),
    }),
    reviewPeriodMarketFacts: Object.freeze({
      tradingDayCount: 1,
      readyClosedTradeCount: options.readyClosedTradeCount,
      netPnlDecimal: "10.00",
      winRatePercentDecimal: "100",
      accountLegitimateOpenCount: 0,
      accountNeedsDecisionCount: 0,
      accountPendingDataDecisionCount: 0,
      days: Object.freeze([Object.freeze({
        reviewMarketDate: "2026-08-07",
        marketSessionState: "open" as const,
        marketSessionKind: "normal" as const,
        readyClosedTradeCount: options.readyClosedTradeCount,
        netPnlDecimal: "10.00",
        ruleReviews: Object.freeze({ followed: 0, broken: 0, notReviewed: 0 }),
        trades: Object.freeze([]),
      })]),
    }),
    completedDailyReflections: Object.freeze([]),
    savedDailyReflections: options.includeSavedReflection
      ? Object.freeze([Object.freeze({
        evidenceRef: "saved-reflection-verification",
        reviewMarketDate: "2026-08-07",
        reviewedStatusRevision: 1,
        reflectionState: "incomplete" as const,
        dailyNotes: Object.freeze({
          whatWorked: "Waited for confirmation before entering.",
          whatNeedsWork: "",
          technicalRecap: "",
          anythingElse: "",
        }),
        tradeNotes: Object.freeze([]),
      })])
      : Object.freeze([]),
    reflectionCoverage: Object.freeze([Object.freeze({
      reviewMarketDate: "2026-08-07",
      marketSessionState: "open" as const,
      reflectionState: options.reflectionState,
      noTradeReview: false,
    })]),
    carryForwardEvidenceBundles: Object.freeze([]),
    priorIssuedReview: null,
    currentFocuses: Object.freeze([]),
    coverageNotice: Object.freeze({
      limitationReasonCodes: Object.freeze([]),
      incompleteRecordRequired: false,
    }),
  });
}

function snapshot(reviewInput: CoachPeriodicAiReviewInputV2): CoachPeriodicAiReviewSnapshotV2 {
  return Object.freeze({
    input: reviewInput,
    evidenceManifest: Object.freeze({
      contractVersion: "traderlink_coach_ai_review_evidence_manifest_v2",
      evidence: Object.freeze([]),
    }),
  });
}

function main(): void {
  const incompleteSnapshot = snapshot(input({
    readyClosedTradeCount: 2,
    reflectionState: "incomplete",
  }));
  const automaticBefore = assessCoachPeriodicReviewEligibilityV2(
    incompleteSnapshot,
    new Date("2026-08-08T07:59:59.999Z"),
    {
      mode: "automatic_after_12_hours",
      followingTradingWeekSealedAtUtc: FOLLOWING_WEEK_SEALED_AT_UTC,
    },
  );
  const automaticAt = assessCoachPeriodicReviewEligibilityV2(
    incompleteSnapshot,
    new Date("2026-08-08T08:00:00.000Z"),
    {
      mode: "automatic_after_12_hours",
      followingTradingWeekSealedAtUtc: FOLLOWING_WEEK_SEALED_AT_UTC,
    },
  );
  const extraTimeBefore = assessCoachPeriodicReviewEligibilityV2(
    incompleteSnapshot,
    new Date("2026-08-14T19:59:59.999Z"),
    {
      mode: "wait_for_tracker_input",
      followingTradingWeekSealedAtUtc: FOLLOWING_WEEK_SEALED_AT_UTC,
    },
  );
  const extraTimeAt = assessCoachPeriodicReviewEligibilityV2(
    incompleteSnapshot,
    new Date(FOLLOWING_WEEK_SEALED_AT_UTC),
    {
      mode: "wait_for_tracker_input",
      followingTradingWeekSealedAtUtc: FOLLOWING_WEEK_SEALED_AT_UTC,
    },
  );
  const completedAtSeal = assessCoachPeriodicReviewEligibilityV2(
    snapshot(input({ readyClosedTradeCount: 2, reflectionState: "completed" })),
    new Date(SEALED_AT_UTC),
    {
      mode: "wait_for_tracker_input",
      followingTradingWeekSealedAtUtc: FOLLOWING_WEEK_SEALED_AT_UTC,
    },
  );
  const singleTradeWithSavedContext = assessCoachPeriodicEvidenceSufficiencyV2(
    input({
      readyClosedTradeCount: 1,
      reflectionState: "incomplete",
      includeSavedReflection: true,
    }),
  );

  assert(automaticBefore.generationMode === "manual", "12-hour mode opened early");
  assert(automaticAt.generationMode === "automatic", "12-hour mode missed its deadline");
  assert(extraTimeBefore.generationMode === "manual", "extra-time mode opened early");
  assert(extraTimeAt.generationMode === "automatic", "extra-time mode missed its deadline");
  assert(completedAtSeal.generationMode === "automatic", "completed reviews did not start early");
  assert(singleTradeWithSavedContext.sufficient, "saved incomplete reflection was ignored");
  assert(
    singleTradeWithSavedContext.reason === "closed_trade_with_context",
    "single trade plus saved reflection used the wrong evidence result",
  );

  process.stdout.write(`${JSON.stringify({
    automaticAfter12Hours: true,
    extraTimeUntilFollowingWeek: true,
    completedReviewsStartEarly: true,
    savedIncompleteReflectionCountsAsContext: true,
  })}\n`);
}

main();
