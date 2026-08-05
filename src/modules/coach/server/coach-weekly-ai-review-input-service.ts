import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import type { JournalTradingDayReviewService } from "@/src/modules/journal/server/reviews/journal-trading-day-review-service";

import {
  COACH_WEEKLY_AI_INPUT_CONTRACT_VERSION,
  type CoachWeeklyAiReviewInput,
} from "../contracts/weekly-ai-review-input-contracts";
import { CoachReflectionService } from "./coach-reflection-service";

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
      reflection.startDate,
      reflection.endDate,
    );
    const days = reflection.days.map((day) => {
      const dailyNote = this.annotations.readDailyNote(account, day.date);
      const notesByRoundTrip = this.annotations.readRoundTripNotes(
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
          netPnlDecimal: trade.netPnlDecimal,
          ruleReviews: trade.ruleReviews,
          note: notesByRoundTrip[trade.roundTripId]?.tradeNote || null,
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
        weekReadyClosedCount: reflection.summary.readyClosedTradeCount,
        accountLegitimateOpenCount: reflection.coverage.legitimateOpenCount,
        accountNeedsDecisionCount: reflection.coverage.needsDecisionCount,
        pendingDataDecisionCount: reflection.summary.accountPendingDataDecisionCount,
      }),
      summary: Object.freeze({
        tradingDayCount: reflection.summary.tradingDayCount,
        readyClosedTradeCount: reflection.summary.readyClosedTradeCount,
        netPnlDecimal: reflection.summary.netPnlDecimal,
        winRatePercentDecimal: reflection.summary.winRatePercentDecimal,
      }),
      currentFocuses: Object.freeze(focusRevisions.map((focus) => Object.freeze({
        tradingDate: focus.tradingDate,
        revisionNumber: focus.revisionNumber,
        text: focus.currentFocuses,
      }))),
      days: Object.freeze(days),
    });
  }
}
