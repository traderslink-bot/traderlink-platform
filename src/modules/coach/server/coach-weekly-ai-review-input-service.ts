import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import type { JournalTradingDayReviewService } from "@/src/modules/journal/server/reviews/journal-trading-day-review-service";

import {
  COACH_WEEKLY_AI_INPUT_CONTRACT_VERSION,
  type CoachWeeklyAiReviewInput,
} from "../contracts/weekly-ai-review-input-contracts";
import { CoachReflectionService } from "./coach-reflection-service";

function holdingDurationMilliseconds(
  openedAtUtc: string,
  closedAtUtc: string,
): number | null {
  const openedAt = Date.parse(openedAtUtc);
  const closedAt = Date.parse(closedAtUtc);
  if (!Number.isFinite(openedAt) || !Number.isFinite(closedAt)) return null;
  const duration = closedAt - openedAt;
  return Number.isSafeInteger(duration) && duration >= 0 ? duration : null;
}

function focusRevisionKey(focus: Readonly<{
  tradingDate: string;
  revisionNumber: number;
}>): string {
  return `${focus.tradingDate}:${focus.revisionNumber}`;
}

export class CoachWeeklyAiReviewInputService {
  constructor(
    private readonly reflections: CoachReflectionService,
    private readonly annotations: JournalAnnotationService,
    private readonly tradingDayReviews: JournalTradingDayReviewService,
  ) {}

  read(
    scope: WorkspaceAccessScope,
    anchorDate: string,
  ): CoachWeeklyAiReviewInput {
    const reflection = this.reflections.read(scope, {
      period: "weekly",
      anchorDate,
      currency: null,
    });
    const accountId = scope.activeAccountId;
    if (!accountId) throw new Error("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const account = narrowWorkspaceAccessToAccount(scope, accountId);
    const focusRevisions = this.annotations.listDailyFocusRevisions(
      account,
      "0000-01-01",
      reflection.endDate,
    );
    const startingFocus = focusRevisions
      .filter((focus) => focus.tradingDate <= reflection.startDate)
      .at(-1) ?? null;
    const datedFocusRevisions = focusRevisions.filter((focus) =>
      focus.tradingDate >= reflection.startDate);
    const currentFocuses = [
      ...(startingFocus ? [Object.freeze({
        effectiveFromDate: reflection.startDate,
        tradingDate: startingFocus.tradingDate,
        revisionNumber: startingFocus.revisionNumber,
        text: startingFocus.currentFocuses,
      })] : []),
      ...datedFocusRevisions
        .filter((focus) => !startingFocus ||
          focusRevisionKey(focus) !== focusRevisionKey(startingFocus))
        .map((focus) => Object.freeze({
          effectiveFromDate: focus.tradingDate,
          tradingDate: focus.tradingDate,
          revisionNumber: focus.revisionNumber,
          text: focus.currentFocuses,
        })),
    ];
    const days = reflection.days.map((day) => {
      const dailyNote = this.annotations.readDailyNote(account, day.date);
      const notesByRoundTrip = this.annotations.readRoundTripNotes(
        account,
        day.trades.map((trade) => trade.roundTripId),
      );
      const tagsByRoundTrip = this.annotations.listTagsForRoundTrips(
        account,
        day.trades.map((trade) => trade.roundTripId),
      );
      return Object.freeze({
        date: day.date,
        reviewed: this.tradingDayReviews.read(account, day.date)?.status === "reviewed",
        netPnlDecimal: day.netPnlDecimal,
        ruleReviews: day.ruleReviews,
        notes: dailyNote ? Object.freeze({
          whatWorked: dailyNote.whatWorked,
          whatNeedsWork: dailyNote.whatNeedsWork,
          technicalRecap: dailyNote.technicalRecap,
          anythingElse: dailyNote.anythingElse,
        }) : null,
        trades: Object.freeze(day.trades.map((trade) => Object.freeze({
          ticker: trade.symbol,
          direction: trade.direction,
          openedAtUtc: trade.openedAtUtc,
          closedAtUtc: trade.closedAtUtc,
          // The current Journal reflection read exposes timestamps but not the
          // underlying execution allocations, gross P/L, or market session.
          // Keep those facts unavailable instead of reconstructing them here.
          executionCount: null,
          realizedGrossPnlDecimal: null,
          holdingDurationMilliseconds: holdingDurationMilliseconds(
            trade.openedAtUtc,
            trade.closedAtUtc,
          ),
          tradingSession: null,
          netPnlDecimal: trade.netPnlDecimal,
          ruleReviews: trade.ruleReviews,
          note: notesByRoundTrip[trade.roundTripId]?.tradeNote || null,
          tags: Object.freeze(
            (tagsByRoundTrip[trade.roundTripId] ?? [])
              .map((tag) => tag.name)
              .sort((left, right) => left.localeCompare(right)),
          ),
        }))),
      });
    });
    return Object.freeze({
      contractVersion: COACH_WEEKLY_AI_INPUT_CONTRACT_VERSION,
      week: Object.freeze({
        startDate: reflection.startDate,
        endDate: reflection.endDate,
        timezone: reflection.timezone,
        currency: reflection.currency,
      }),
      coverage: Object.freeze({
        weekReadyClosedCount: days.reduce((count, day) => count + day.trades.length, 0),
        accountLegitimateOpenCount: reflection.coverage.legitimateOpenCount,
        accountNeedsDecisionCount: reflection.coverage.needsDecisionCount,
        accountPendingDataDecisionCount: reflection.summary.accountPendingDataDecisionCount,
      }),
      summary: Object.freeze({
        tradingDayCount: reflection.summary.tradingDayCount,
        readyClosedTradeCount: reflection.summary.readyClosedTradeCount,
        netPnlDecimal: reflection.summary.netPnlDecimal,
        winRatePercentDecimal: reflection.summary.winRatePercentDecimal,
      }),
      currentFocuses: Object.freeze(currentFocuses),
      days: Object.freeze(days),
    });
  }
}
