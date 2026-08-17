import "server-only";

import {
  journalTagPresetForName,
} from "@/src/modules/journal/contracts/journal-tag-preset-catalog";
import { evaluateJournalPresetRules } from "@/src/modules/journal/server/annotations/journal-preset-rule-evaluator";
import {
  withReadonlyJournalAnnotations,
  withWritableJournalAnnotations,
} from "@/src/modules/journal/server/annotations/journal-annotation-runtime";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  requireExpectedJournalAccountSelection,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  assertCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  requireActiveJournalAnalyticsAccountId,
  withJournalAnalyticsDashboardRuntime,
} from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { journalAnalyticsLocalTimeFact } from "@/src/modules/journal-analytics/server/normalize-journal-analytics-facts";

import type {
  TradeExplorerReviewModel,
  TradeExplorerReviewSaveInput,
  TradeExplorerReviewTag,
} from "./trade-review-model";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

function invalid(field: string): never {
  return platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field });
}

function conflict(): never {
  return platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
}

function requireDate(value: unknown): string {
  if (
    typeof value !== "string" ||
    !DATE_PATTERN.test(value) ||
    !Number.isFinite(Date.parse(`${value}T12:00:00.000Z`))
  ) {
    invalid("closeLocalDate");
  }
  return value;
}

function reviewRange(
  openedAtUtc: string,
  closedAtUtc: string,
): Readonly<{ fromUtc: string; untilUtc: string }> {
  const until = new Date(closedAtUtc);
  until.setMilliseconds(until.getMilliseconds() + 1);
  return Object.freeze({ fromUtc: openedAtUtc, untilUtc: until.toISOString() });
}

function tradeContext(
  scope: WorkspaceAccessScope,
  input: Readonly<{ closeLocalDate: unknown; roundTripId: unknown }>,
) {
  if (typeof input.roundTripId !== "string") invalid("roundTripId");
  assertCanonicalUuidV4(input.roundTripId, "roundTripId");
  const closeLocalDate = requireDate(input.closeLocalDate);
  const accountId = requireActiveJournalAnalyticsAccountId(scope);
  return withJournalAnalyticsDashboardRuntime(scope, ({ dashboard, facts }) => {
    const factSet = facts.getJournalAnalyticsFactSet(scope, {
      accountIds: Object.freeze([accountId]),
      closingDateRange: Object.freeze({
        kind: "inclusive_closing_date" as const,
        startDate: closeLocalDate,
        endDate: closeLocalDate,
      }),
      currencySelection: Object.freeze({ kind: "all_partitions" as const }),
    });
    const trade = factSet.roundTrips.find((candidate) =>
      candidate.accountId === accountId &&
      candidate.roundTripId === input.roundTripId &&
      candidate.projectionState === "ready_closed" &&
      candidate.closedAtUtc !== null);
    const account = factSet.accounts.find((candidate) => candidate.accountId === accountId);
    if (!trade || trade.closedAtUtc === null || !account) conflict();
    const closedAtUtc = trade.closedAtUtc;
    const confirmedCloseDate = journalAnalyticsLocalTimeFact(
      closedAtUtc,
      account.tradingTimezone,
    ).localDate;
    if (confirmedCloseDate !== closeLocalDate) conflict();
    const day = dashboard.getTradingDay(scope, {
      currency: trade.tradeCurrency,
      requestedDate: closeLocalDate,
    });
    return Object.freeze({
      accountId,
      closeLocalDate,
      closedAtUtc,
      day,
      timezone: account.tradingTimezone,
      trade,
    });
  });
}

function tagView(tag: Readonly<{
  assignmentCount: number;
  name: string;
  revision: number;
  tagId: string;
}>): TradeExplorerReviewTag {
  return Object.freeze({
    assignmentCount: tag.assignmentCount,
    category: journalTagPresetForName(tag.name)?.category ?? "custom",
    name: tag.name,
    revision: tag.revision,
    tagId: tag.tagId,
  });
}

export function readTradeExplorerReview(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    closeLocalDate: unknown;
    expectedAccountSelectionRef: unknown;
    roundTripId: unknown;
  }>,
): TradeExplorerReviewModel {
  requireExpectedJournalAccountSelection(scope, input.expectedAccountSelectionRef);
  const context = tradeContext(scope, input);
  return withReadonlyJournalAnnotations(scope, (service, account) => {
    const range = reviewRange(context.trade.openedAtUtc, context.closedAtUtc);
    const rules = service.listRulesForEvaluation(account, range.fromUtc, range.untilUtc);
    const reviews = service.listRuleReviews(account, {
      tradingDayId: service.resolveTradingDayId(account, context.closeLocalDate) ?? context.trade.roundTripId,
      roundTripIds: Object.freeze([context.trade.roundTripId]),
    }).filter((review) =>
      review.targetKind === "round_trip" &&
      review.roundTripId === context.trade.roundTripId);
    const reviewByRuleVersion = new Map(reviews.map((review) => [
      `${review.ruleId}:${review.ruleVersionId}`,
      review,
    ]));
    const customRules = rules
      .filter((rule) =>
        rule.sourceKind === "custom" &&
        (rule.reviewScope === "trade" || rule.reviewScope === "both") &&
        context.trade.openedAtUtc >= rule.effectiveFromUtc &&
        (!rule.effectiveUntilUtc || context.trade.openedAtUtc < rule.effectiveUntilUtc) &&
        (!rule.activeIntervals || rule.activeIntervals.some((interval) =>
          context.trade.openedAtUtc >= interval.fromUtc &&
          (!interval.untilUtc || context.trade.openedAtUtc < interval.untilUtc))))
      .map((rule) => {
        const review = reviewByRuleVersion.get(`${rule.ruleId}:${rule.versionId}`);
        return Object.freeze({
          revision: review?.revision ?? null,
          ruleId: rule.ruleId,
          ruleVersionId: rule.versionId,
          statement: rule.statement,
          status: review?.status ?? "not_reviewed" as const,
          title: rule.title,
        });
      })
      .sort((left, right) => left.title.localeCompare(right.title));
    const automaticResults = evaluateJournalPresetRules(
      rules,
      context.day,
      new Set(),
    );
    const rulesByVersion = new Map(rules.map((rule) => [
      `${rule.ruleId}:${rule.versionId}`,
      rule,
    ]));
    const presetRules = automaticResults
      .filter((result) =>
        result.targetKind === "round_trip" &&
        result.targetRoundTripId === context.trade.roundTripId)
      .flatMap((result) => {
        const rule = rulesByVersion.get(`${result.ruleId}:${result.ruleVersionId}`);
        return rule ? [Object.freeze({
          detail: result.evidence.limitation,
          ruleId: rule.ruleId,
          ruleVersionId: rule.versionId,
          status: result.status,
          title: rule.title,
        })] : [];
      })
      .sort((left, right) => left.title.localeCompare(right.title));
    const note = service.readRoundTripNotes(account, [context.trade.roundTripId])[
      context.trade.roundTripId
    ] ?? null;
    const assignedTags = service.listTagsForRoundTrips(account, [context.trade.roundTripId])[
      context.trade.roundTripId
    ] ?? Object.freeze([]);
    return Object.freeze({
      availableTags: Object.freeze(service.listTags(account).map(tagView)),
      customRules: Object.freeze(customRules),
      note: Object.freeze({
        revision: note?.revision ?? null,
        tradeNote: note?.tradeNote ?? "",
      }),
      presetRules: Object.freeze(presetRules),
      selectedTagIds: Object.freeze(assignedTags.map((tag) => tag.tagId)),
      trade: Object.freeze({
        closeLocalDate: context.closeLocalDate,
        closedAtUtc: context.closedAtUtc,
        direction: context.trade.direction,
        displayedSymbol: context.trade.displayedSymbol,
        roundTripId: context.trade.roundTripId,
      }),
    });
  });
}

export function createTradeExplorerReviewTag(
  scope: WorkspaceAccessScope,
  input: Readonly<{ expectedAccountSelectionRef: unknown; name: unknown }>,
): TradeExplorerReviewTag {
  requireExpectedJournalAccountSelection(scope, input.expectedAccountSelectionRef);
  return withWritableJournalAnnotations(scope, (service, account) =>
    tagView(service.createTag(account, { name: input.name })));
}

export function saveTradeExplorerReview(
  scope: WorkspaceAccessScope,
  input: TradeExplorerReviewSaveInput,
): TradeExplorerReviewModel {
  requireExpectedJournalAccountSelection(scope, input.expectedAccountSelectionRef);
  const before = readTradeExplorerReview(scope, input);
  const editableRules = new Map(before.customRules.map((rule) => [
    `${rule.ruleId}:${rule.ruleVersionId}`,
    rule,
  ]));
  const changedRuleIds = new Set<string>();
  for (const change of input.ruleReviews) {
    const rule = editableRules.get(`${change.ruleId}:${change.ruleVersionId}`);
    if (
      !rule ||
      rule.revision !== change.expectedRevision ||
      changedRuleIds.has(change.ruleId)
    ) {
      conflict();
    }
    changedRuleIds.add(change.ruleId);
  }
  withWritableJournalAnnotations(scope, (service, account) => {
    service.saveTradeReview(account, {
      note: input.note,
      roundTripId: input.roundTripId,
      ruleReviews: input.ruleReviews,
      tags: input.tags,
    });
  });
  return readTradeExplorerReview(scope, input);
}
