import "server-only";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalTradingDayReadModel } from "@/src/modules/journal-analytics/contracts/journal-dashboard-read-models";
import { withJournalAnalyticsDashboardRuntime } from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import type {
  JournalDailyNoteRecord,
  JournalRoundTripNoteRecord,
  JournalRuleRecord,
  JournalRuleReviewRecord,
  JournalTagRecord,
} from "@/src/modules/journal/contracts/journal-annotation-contracts";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { JournalAccountService } from "@/src/modules/journal/server/accounts/journal-account-service";
import type { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import { withReadonlyJournalAnnotations } from "@/src/modules/journal/server/annotations/journal-annotation-runtime";
import { currentJournalAccountSelectionRef } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

import type {
  DaySessionDailyNote,
  DaySessionData,
  DaySessionRule,
  DaySessionTradeTag,
} from "./[sessionDate]/day-session-types";

function emptyNote(): DaySessionDailyNote {
  return {
    anythingElse: "",
    revision: null,
    technicalRecap: "",
    tomorrowsFocus: "",
    whatNeedsWork: "",
    whatWorked: "",
  };
}

function noteView(note: JournalDailyNoteRecord | null): DaySessionDailyNote {
  return note
    ? {
        anythingElse: note.anythingElse,
        revision: String(note.revision),
        technicalRecap: note.technicalRecap,
        tomorrowsFocus: note.tomorrowsFocus,
        whatNeedsWork: note.whatNeedsWork,
        whatWorked: note.whatWorked,
      }
    : emptyNote();
}

function tagView(tag: JournalTagRecord): DaySessionTradeTag {
  return {
    assignmentCount: tag.assignmentCount,
    name: tag.name,
    revision: String(tag.revision),
    tagId: tag.tagId,
  };
}

function reviewStatus(
  review: JournalRuleReviewRecord | undefined,
): DaySessionRule["status"] {
  return review?.status === "not_reviewed"
    ? "not-reviewed"
    : review?.status ?? "not-reviewed";
}

type AnnotationSnapshot = Readonly<{
  dailyNote: JournalDailyNoteRecord | null;
  roundTripNotes: Readonly<Record<string, JournalRoundTripNoteRecord>>;
  rules: readonly DaySessionRule[];
  tags: readonly JournalTagRecord[];
  tagsByRoundTrip: Readonly<Record<string, readonly JournalTagRecord[]>>;
  weekNotes: Readonly<Record<string, JournalDailyNoteRecord | null>>;
}>;

function annotationSnapshot(
  service: JournalAnnotationService,
  account: Parameters<JournalAnnotationService["listTags"]>[0],
  model: JournalTradingDayReadModel,
): AnnotationSnapshot {
  const roundTrips = model.tickers.flatMap((ticker) =>
    ticker.roundTrips.map((roundTrip, index) => ({
      id: roundTrip.roundTripId,
      label: `${ticker.symbol} trade ${index + 1}`,
    })));
  const roundTripIds = roundTrips.map((roundTrip) => roundTrip.id);
  const tradingDayId = service.resolveTradingDayId(account, model.date);
  const reviews = tradingDayId
    ? service.listRuleReviews(account, { tradingDayId, roundTripIds })
    : [];
  const byReviewTarget = new Map(reviews.map((review) => [
    `${review.ruleId}:${review.targetKind}:${review.tradingDayId ?? review.roundTripId}`,
    review,
  ]));
  const rules = service.listRules(account).filter(
    (rule) => rule.lifecycleState === "active",
  );
  const toRule = (
    rule: JournalRuleRecord,
    applicability: "day" | "trade",
    targetRoundTripKey: string | null,
    targetLabel: string | null,
  ): DaySessionRule => {
    const targetKind = applicability === "day" ? "trading_day" : "round_trip";
    const targetId = applicability === "day" ? tradingDayId : targetRoundTripKey;
    const review = targetId
      ? byReviewTarget.get(`${rule.ruleId}:${targetKind}:${targetId}`)
      : undefined;
    return {
      applicability,
      custom: rule.sourceKind === "custom",
      label: rule.title,
      revision: review ? String(review.revision) : null,
      ruleId: rule.ruleId,
      ruleVersion: rule.versionId,
      status: reviewStatus(review),
      targetLabel,
      targetRoundTripKey,
    };
  };
  const dayRules = rules
    .filter((rule) => rule.reviewScope === "day" || rule.reviewScope === "both")
    .map((rule) => toRule(rule, "day", null, null));
  const tradeRules = rules
    .filter((rule) => rule.reviewScope === "trade" || rule.reviewScope === "both")
    .flatMap((rule) => roundTrips.map((roundTrip) =>
      toRule(rule, "trade", roundTrip.id, roundTrip.label)));
  return Object.freeze({
    dailyNote: service.readDailyNote(account, model.date),
    roundTripNotes: service.readRoundTripNotes(account, roundTripIds),
    rules: Object.freeze([...dayRules, ...tradeRules]),
    tags: service.listTags(account),
    tagsByRoundTrip: service.listTagsForRoundTrips(account, roundTripIds),
    weekNotes: Object.freeze(Object.fromEntries(model.week.days.map((day) => [
      day.date,
      service.readDailyNote(account, day.date),
    ]))),
  });
}

function toDaySessionData(
  model: JournalTradingDayReadModel,
  annotations: AnnotationSnapshot,
  expectedAccountSelectionRef: string,
): DaySessionData | null {
  if (model.currency === null) return null;
  const rulesByRoundTrip = new Map<string, DaySessionRule[]>();
  for (const rule of annotations.rules) {
    if (!rule.targetRoundTripKey) continue;
    rulesByRoundTrip.set(rule.targetRoundTripKey, [
      ...(rulesByRoundTrip.get(rule.targetRoundTripKey) ?? []),
      rule,
    ]);
  }
  return {
    availableTags: annotations.tags.map(tagView),
    currency: model.currency,
    dailyNote: noteView(annotations.dailyNote),
    date: model.date,
    decisionActivity: model.decisionActivity.map((item) => ({
      direction: item.direction,
      executionCount: item.executionCountOnDate,
      openedAt: item.openedAtUtc,
      reasonCodes: item.reasonCodes,
      roundTripKey: item.roundTripId,
      symbol: item.symbol,
    })),
    executionActivity: model.executionActivity.map((execution) => ({
      executedAt: execution.executedAtUtc,
      executionKey: execution.executionVersionId,
      needsDecision: execution.needsDecision,
      price: execution.priceDecimal,
      quantity: execution.quantityDecimal,
      side: execution.side,
      symbol: execution.symbol,
    })),
    expectedAccountSelectionRef,
    netPnl: model.netPnlDecimal,
    needsDecisionCount: model.coverage.needsDecisionCount,
    nextSessionDate: model.nextTradingDate,
    openPositions: model.openPositions.map((position) => ({
      averageEntryPrice: position.averageEntryPriceDecimal,
      direction: position.direction,
      openedAt: position.openedAtUtc,
      positionKey: position.roundTripId,
      remainingQuantity: position.remainingQuantityDecimal,
      stableInstrumentKey: position.instrumentId,
      symbol: position.symbol,
      timezone: position.timezone,
    })),
    positionSnapshots: model.positionSnapshots.map((position) => ({
      averageEntryPrice: position.averageEntryPriceDecimal,
      closingQuantity: position.closingQuantityDecimal,
      direction: position.direction,
      openingQuantity: position.openingQuantityDecimal,
      positionKey: position.roundTripId,
      state: position.state,
      symbol: position.symbol,
    })),
    previousSessionDate: model.previousTradingDate,
    rules: [...annotations.rules],
    tickers: model.tickers.map((ticker) => ({
      gainLossPercent: ticker.gainLossPercentDecimal,
      netPnl: ticker.netPnlDecimal,
      roundTrips: ticker.roundTrips.map((roundTrip) => {
        const note = annotations.roundTripNotes[roundTrip.roundTripId] ?? null;
        const tradeRules = rulesByRoundTrip.get(roundTrip.roundTripId) ?? [];
        const aggregateStatus = tradeRules.some((rule) => rule.status === "broken")
          ? "broken"
          : tradeRules.some((rule) => rule.status === "followed")
            ? "followed"
            : "not-reviewed";
        return {
          direction: roundTrip.direction,
          entryAt: roundTrip.entryAtUtc,
          entryPrice: roundTrip.entryPriceDecimal,
          exitAt: roundTrip.exitAtUtc,
          exitPrice: roundTrip.exitPriceDecimal,
          gainLossPercent: roundTrip.gainLossPercentDecimal,
          journal: {
            noteRevision: note ? String(note.revision) : null,
            ruleStatus: aggregateStatus,
            ruleSummary: tradeRules.length === 0
              ? "No active trade rules"
              : `${tradeRules.length} trader review${tradeRules.length === 1 ? "" : "s"}`,
            tags: (annotations.tagsByRoundTrip[roundTrip.roundTripId] ?? []).map(tagView),
            technicalNote: note?.technicalNote ?? "",
            tradeNote: note?.tradeNote ?? "",
          },
          netPnl: roundTrip.netPnlDecimal,
          roundTripKey: roundTrip.roundTripId,
          timezone: roundTrip.timezone,
        };
      }),
      stableInstrumentKey: ticker.instrumentId,
      symbol: ticker.symbol,
    })),
    timezone: model.timezone ?? "America/New_York",
    week: {
      currentSessionDate: model.latestTradingDate ?? model.date,
      days: model.week.days.map((day) => ({
        date: day.date,
        dailyNote: noteView(annotations.weekNotes[day.date] ?? null),
        netPnl: day.netPnlDecimal,
        tickerCount: day.tickerCount,
        tradeCount: day.tradeCount,
      })),
      netPnl: model.week.netPnlDecimal,
      tickerCount: model.week.tickerCount,
      tradeCount: model.week.tradeCount,
    },
  };
}

export function getReplacementDaySession(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    date: string | null;
    currency: string | null;
  }>,
): DaySessionData | null {
  const model = withJournalAnalyticsDashboardRuntime(scope, ({ dashboard }) =>
    dashboard.getTradingDay(scope, {
      requestedDate: input.date,
      currency: input.currency,
    }));
  if (model.currency === null) return null;
  const annotations = withReadonlyJournalAnnotations(scope, (service, account) =>
    annotationSnapshot(service, account, model));
  return toDaySessionData(
    model,
    annotations,
    currentJournalAccountSelectionRef(scope),
  );
}

export function getReplacementTradeTrackerAccount(
  scope: WorkspaceAccessScope,
): Readonly<{
  baseCurrency: string;
  tradingTimezone: string;
}> | null {
  if (!scope.activeAccountId) return null;
  return withReadonlyPlatformDatabase({}, (database) => {
    const account = new JournalAccountService(
      new JournalAccountRepository(database),
    ).requireAccountRecord(scope, scope.activeAccountId!);
    return Object.freeze({
      baseCurrency: account.baseCurrency,
      tradingTimezone: account.tradingTimezone,
    });
  });
}
