import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";

import type { CoachReflectionService } from "./coach-reflection-service";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const CURRENCY_PATTERN = /^[A-Z]{3}$/u;
const MAX_TRADES = 100;

export class CoachAiChatJournalContextService {
  constructor(
    private readonly reflections: Pick<CoachReflectionService, "read">,
    private readonly annotations: Pick<JournalAnnotationService,
      "listRules" | "listDailyFocusRevisions">,
  ) {}

  summarize(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      period: "daily" | "weekly" | "monthly";
      anchorDate: string;
      currency?: string;
    }>,
  ): unknown {
    if (!DATE_PATTERN.test(input.anchorDate) ||
        (input.currency !== undefined && !CURRENCY_PATTERN.test(input.currency))) {
      throw new Error("TRADERLINK_COACH_FACTUAL_TOOL_INVALID");
    }
    const accountId = scope.activeAccountId;
    if (!accountId) throw new Error("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const account = narrowWorkspaceAccessToAccount(scope, accountId);
    const reflection = this.reflections.read(scope, Object.freeze({
      period: input.period,
      anchorDate: input.anchorDate,
      currency: input.currency ?? null,
    }));
    const activeRules = this.annotations.listRules(account)
      .filter((rule) => rule.lifecycleState === "active")
      .map((rule) => Object.freeze({
        title: rule.title,
        statement: rule.statement,
        scope: rule.reviewScope,
        isFocus: rule.isFocus,
      }));
    const focusRevisions = this.annotations.listDailyFocusRevisions(
      account,
      reflection.startDate,
      reflection.endDate,
    ).map((revision) => Object.freeze({
      tradingDate: revision.tradingDate,
      currentFocuses: revision.currentFocuses,
      revisionNumber: revision.revisionNumber,
    }));
    let includedTrades = 0;
    let contextTruncated = false;
    const days = reflection.days.map((day) => {
      const remaining = Math.max(0, MAX_TRADES - includedTrades);
      const trades = day.trades.slice(0, remaining).map((trade) => Object.freeze({
        ticker: trade.symbol,
        direction: trade.direction,
        openedAtUtc: trade.openedAtUtc,
        closedAtUtc: trade.closedAtUtc,
        netPnlDecimal: trade.netPnlDecimal,
        noteSaved: trade.noteSaved,
        tags: trade.tagNames,
        ruleReviews: trade.ruleReviews,
      }));
      includedTrades += trades.length;
      if (trades.length < day.trades.length) contextTruncated = true;
      return Object.freeze({
        tradingDate: day.date,
        currency: day.currency,
        netPnlDecimal: day.netPnlDecimal,
        tradeCount: day.tradeCount,
        dailyNoteSaved: day.dailyNoteSaved,
        ruleReviews: day.ruleReviews,
        trades: Object.freeze(trades),
      });
    });
    return Object.freeze({
      period: reflection.period,
      startDate: reflection.startDate,
      endDate: reflection.endDate,
      timezone: reflection.timezone,
      currency: reflection.currency,
      state: reflection.state,
      summary: reflection.summary,
      coverage: Object.freeze({
        legitimateOpenCount: reflection.coverage.legitimateOpenCount,
        needsDecisionCount: reflection.coverage.needsDecisionCount,
        limitationReasonCodes: reflection.coverage.limitationReasonCodes,
        contextTruncated,
      }),
      activeRules: Object.freeze(activeRules),
      focusRevisions: Object.freeze(focusRevisions),
      days: Object.freeze(days),
    });
  }
}
