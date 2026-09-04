import "server-only";

import {
  journalTagPresetByKey,
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
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
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

type LogicalReviewTarget = Readonly<{
  logicalTradeId: string;
  logicalTradeVersionId: string;
  memberRoundTripIds: readonly string[];
  openedAtUtc: string;
  closedAtUtc: string;
}>;

function logicalReviewTarget(scope: WorkspaceAccessScope, roundTripId: string): LogicalReviewTarget | null {
  if (!scope.activeAccountId) return null;
  return withReadonlyPlatformDatabase({}, (database) => {
    const rows = database.prepare(`SELECT membership.logical_trade_id,
 membership.logical_trade_version_id, membership.round_trip_id,
 version.opened_at_utc, version.closed_at_utc
FROM journal_active_logical_trade_memberships selected
JOIN journal_active_logical_trade_memberships membership
 ON membership.workspace_id = selected.workspace_id
 AND membership.account_id = selected.account_id
 AND membership.logical_trade_id = selected.logical_trade_id
JOIN journal_round_trips round_trip
 ON round_trip.workspace_id = membership.workspace_id
 AND round_trip.account_id = membership.account_id
 AND round_trip.round_trip_id = membership.round_trip_id
JOIN journal_round_trip_versions version
 ON version.workspace_id = round_trip.workspace_id
 AND version.account_id = round_trip.account_id
 AND version.round_trip_version_id = round_trip.current_version_id
WHERE selected.workspace_id = ? AND selected.account_id = ?
 AND selected.round_trip_id = ?
ORDER BY membership.member_sequence`).all(scope.workspaceId, scope.activeAccountId, roundTripId) as readonly {
      logical_trade_id: string; logical_trade_version_id: string; round_trip_id: string;
      opened_at_utc: string; closed_at_utc: string;
    }[];
    if (rows.length <= 1) return null;
    return Object.freeze({ logicalTradeId: rows[0]!.logical_trade_id,
      logicalTradeVersionId: rows[0]!.logical_trade_version_id,
      memberRoundTripIds: Object.freeze(rows.map((row) => row.round_trip_id)),
      openedAtUtc: rows[0]!.opened_at_utc, closedAtUtc: rows.at(-1)!.closed_at_utc });
  });
}

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
  closedAtUtc: string | null,
): Readonly<{ fromUtc: string; untilUtc: string }> {
  const until = new Date(closedAtUtc ?? openedAtUtc);
  until.setMilliseconds(until.getMilliseconds() + 1);
  return Object.freeze({ fromUtc: openedAtUtc, untilUtc: until.toISOString() });
}

function tradeContext(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    closeLocalDate: unknown;
    expectedRoundTripVersionId?: unknown;
    roundTripId: unknown;
  }>,
  logical: LogicalReviewTarget | null = null,
) {
  if (typeof input.roundTripId !== "string") invalid("roundTripId");
  assertCanonicalUuidV4(input.roundTripId, "roundTripId");
  const closeLocalDate = input.closeLocalDate === null
    ? null
    : requireDate(input.closeLocalDate);
  if (input.expectedRoundTripVersionId !== undefined) {
    if (typeof input.expectedRoundTripVersionId !== "string") {
      invalid("expectedRoundTripVersionId");
    }
    assertCanonicalUuidV4(input.expectedRoundTripVersionId, "expectedRoundTripVersionId");
  }
  const accountId = requireActiveJournalAnalyticsAccountId(scope);
  return withJournalAnalyticsDashboardRuntime(scope, ({ dashboard, facts }) => {
    const factSet = facts.getJournalAnalyticsFactSet(scope, {
      accountIds: Object.freeze([accountId]),
      closingDateRange: Object.freeze({ kind: "all_available" as const }),
      currencySelection: Object.freeze({ kind: "all_partitions" as const }),
    });
    const trade = factSet.roundTrips.find((candidate) =>
      candidate.accountId === accountId &&
      candidate.roundTripId === input.roundTripId);
    const account = factSet.accounts.find((candidate) => candidate.accountId === accountId);
    const expectedVersionId = logical?.logicalTradeVersionId ?? trade?.roundTripVersionId;
    if (!trade || !account ||
        (input.expectedRoundTripVersionId !== undefined &&
          expectedVersionId !== input.expectedRoundTripVersionId)) conflict();
    const isOpen = logical === null && closeLocalDate === null;
    if (logical !== null && closeLocalDate === null) conflict();
    const closedAtUtc = logical?.closedAtUtc ?? trade.closedAtUtc;
    if (isOpen
      ? trade.projectionState !== "legitimate_open" || trade.closedAtUtc !== null
      : trade.projectionState !== "ready_closed" || closedAtUtc === null) conflict();
    const journalLocalDate = isOpen
      ? journalAnalyticsLocalTimeFact(trade.openedAtUtc, account.tradingTimezone).localDate
      : journalAnalyticsLocalTimeFact(closedAtUtc!, account.tradingTimezone).localDate;
    if (closeLocalDate !== null && journalLocalDate !== closeLocalDate) conflict();
    const day = dashboard.getTradingDay(scope, {
      currency: trade.tradeCurrency,
      requestedDate: journalLocalDate,
    });
    return Object.freeze({
      accountId,
      closeLocalDate: isOpen ? null : journalLocalDate,
      closedAtUtc,
      day,
      journalLocalDate,
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
    expectedRoundTripVersionId?: unknown;
    roundTripId: unknown;
  }>,
): TradeExplorerReviewModel {
  requireExpectedJournalAccountSelection(scope, input.expectedAccountSelectionRef);
  if (typeof input.roundTripId !== "string") invalid("roundTripId");
  assertCanonicalUuidV4(input.roundTripId, "roundTripId");
  const logical = logicalReviewTarget(scope, input.roundTripId);
  const context = tradeContext(scope, input, logical);
  return withReadonlyJournalAnnotations(scope, (service, account) => {
    const range = reviewRange(logical?.openedAtUtc ?? context.trade.openedAtUtc,
      logical?.closedAtUtc ?? context.closedAtUtc);
    const rules = service.listRulesForEvaluation(account, range.fromUtc, range.untilUtc);
    const rawReviews = service.listRuleReviews(account, {
      tradingDayId: service.resolveTradingDayId(account, context.journalLocalDate) ?? context.trade.roundTripId,
      roundTripIds: logical?.memberRoundTripIds ?? Object.freeze([context.trade.roundTripId]),
    }).filter((review) =>
      review.targetKind === "round_trip" &&
      (logical?.memberRoundTripIds ?? [context.trade.roundTripId]).includes(review.roundTripId ?? ""));
    const logicalEvidence = logical && scope.activeAccountId
      ? withReadonlyPlatformDatabase({}, (database) => {
          const note = database.prepare(`SELECT technical_note_text, note_text, revision FROM journal_logical_trade_notes
WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ?`).get(
            scope.workspaceId, scope.activeAccountId!, logical.logicalTradeId,
          ) as { technical_note_text: string; note_text: string; revision: number } | undefined;
          const tags = database.prepare(`SELECT tag_id FROM journal_logical_trade_tag_assignments
WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ?
 AND assignment_state = 'assigned' ORDER BY tag_id`).all(
            scope.workspaceId, scope.activeAccountId!, logical.logicalTradeId,
          ) as readonly { tag_id: string }[];
          const reviews = database.prepare(`SELECT rule_id, rule_version_id, status, revision
FROM journal_logical_trade_rule_reviews
WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ?`).all(
            scope.workspaceId, scope.activeAccountId!, logical.logicalTradeId,
          ) as readonly { rule_id: string; rule_version_id: string;
              status: "followed" | "broken" | "not_reviewed"; revision: number }[];
          return { note, tags, reviews };
        }) : null;
    const reviews = logicalEvidence
      ? logicalEvidence.reviews.map((review) => ({ ruleId: review.rule_id,
          ruleVersionId: review.rule_version_id, status: review.status,
          revision: review.revision }))
      : rawReviews;
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
        (logical?.memberRoundTripIds ?? [context.trade.roundTripId]).includes(result.targetRoundTripId ?? ""))
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
      .sort((left, right) => left.title.localeCompare(right.title))
      .filter((rule, index, all) => all.findIndex((candidate) =>
        candidate.ruleId === rule.ruleId && candidate.ruleVersionId === rule.ruleVersionId &&
        candidate.status === rule.status) === index);
    const roundTripNote = service.readRoundTripNotes(account, [context.trade.roundTripId])[
      context.trade.roundTripId
    ] ?? null;
    const assignedTags = logicalEvidence
      ? service.listTags(account).filter((tag) => logicalEvidence.tags.some((item) => item.tag_id === tag.tagId))
      : service.listTagsForRoundTrips(account, [context.trade.roundTripId])[
          context.trade.roundTripId
        ] ?? Object.freeze([]);
    return Object.freeze({
      availableTags: Object.freeze(service.listTags(account).map(tagView)),
      customRules: Object.freeze(customRules),
      note: Object.freeze({
        revision: logicalEvidence ? logicalEvidence.note?.revision ?? null : roundTripNote?.revision ?? null,
        technicalNote: logicalEvidence ? logicalEvidence.note?.technical_note_text ?? "" : roundTripNote?.technicalNote ?? "",
        tradeNote: logicalEvidence ? logicalEvidence.note?.note_text ?? "" : roundTripNote?.tradeNote ?? "",
      }),
      presetRules: Object.freeze(presetRules),
      roundTripVersionId: logical?.logicalTradeVersionId ?? context.trade.roundTripVersionId,
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

function saveLogicalTradeReview(
  scope: WorkspaceAccessScope,
  logical: LogicalReviewTarget,
  input: TradeExplorerReviewSaveInput,
  before: TradeExplorerReviewModel,
): void {
  if (!scope.activeAccountId || input.expectedRoundTripVersionId !== logical.logicalTradeVersionId) conflict();
  const selectedTagIds = new Set(input.tags?.tagIds ?? []);
  withWritableJournalAnnotations(scope, (service, account, database) => database.transaction(() => {
    if (input.tags) {
      const existing = service.listTags(account);
      for (const presetKey of input.tags.presetKeys) {
        const preset = journalTagPresetByKey(presetKey);
        if (!preset) invalid("presetKeys");
        const tag = existing.find((candidate) => journalTagPresetForName(candidate.name)?.presetKey === presetKey)
          ?? service.createTag(account, { name: preset.name });
        selectedTagIds.add(tag.tagId);
      }
    }
    const current = database.prepare(`SELECT current_version_id, lifecycle_state
FROM journal_logical_trades WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ?`).get(
      scope.workspaceId, scope.activeAccountId!, logical.logicalTradeId,
    ) as { current_version_id: string; lifecycle_state: string } | undefined;
    if (!current || current.lifecycle_state !== "active" ||
      current.current_version_id !== logical.logicalTradeVersionId) conflict();
    const timestamp = createCanonicalUtcTimestamp(new Date());
    if (input.note) {
      const prior = database.prepare(`SELECT revision, technical_note_text FROM journal_logical_trade_notes
WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ?`).get(
        scope.workspaceId, scope.activeAccountId!, logical.logicalTradeId,
      ) as { revision: number; technical_note_text: string } | undefined;
      if ((prior?.revision ?? null) !== input.note.expectedRevision) conflict();
      const revision = (prior?.revision ?? 0) + 1;
      database.prepare(`INSERT INTO journal_logical_trade_notes (
 logical_trade_id, workspace_id, account_id, technical_note_text, note_text, revision,
 authored_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(workspace_id, account_id, logical_trade_id) DO UPDATE SET
 technical_note_text = excluded.technical_note_text, note_text = excluded.note_text, revision = excluded.revision,
 authored_by_user_id = excluded.authored_by_user_id, updated_at_utc = excluded.updated_at_utc`).run(
        logical.logicalTradeId, scope.workspaceId, scope.activeAccountId!, prior?.technical_note_text ?? "",
        input.note.tradeNote,
        revision, scope.userId, timestamp, timestamp,
      );
      database.prepare(`INSERT INTO journal_logical_trade_note_events (
 logical_trade_note_event_id, workspace_id, account_id, logical_trade_id,
 revision_number, technical_note_text, note_text, authored_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(createCanonicalUuidV4(), scope.workspaceId,
        scope.activeAccountId!, logical.logicalTradeId, revision, prior?.technical_note_text ?? "", input.note.tradeNote,
        scope.userId, timestamp);
    }
    if (input.tags) {
      const currentTags = database.prepare(`SELECT tag_id FROM journal_logical_trade_tag_assignments
WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ?
 AND assignment_state = 'assigned' ORDER BY tag_id`).all(
        scope.workspaceId, scope.activeAccountId!, logical.logicalTradeId,
      ) as readonly { tag_id: string }[];
      const expected = [...input.tags.expectedTagIds].sort();
      if (currentTags.map((row) => row.tag_id).join("\u001f") !== expected.join("\u001f")) conflict();
      const valid = database.prepare(`SELECT tag_id FROM journal_tags
WHERE workspace_id = ? AND account_id = ? AND lifecycle_state = 'active'`).all(
        scope.workspaceId, scope.activeAccountId!,
      ) as readonly { tag_id: string }[];
      const validIds = new Set(valid.map((tag) => tag.tag_id));
      if (selectedTagIds.size > 10 || [...selectedTagIds].some((tagId) => !validIds.has(tagId))) invalid("tagIds");
      const allRows = database.prepare(`SELECT tag_id, assignment_state, revision
FROM journal_logical_trade_tag_assignments
WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ?`).all(
        scope.workspaceId, scope.activeAccountId!, logical.logicalTradeId,
      ) as readonly { tag_id: string; assignment_state: "assigned" | "removed"; revision: number }[];
      const byTag = new Map(allRows.map((row) => [row.tag_id, row]));
      for (const tagId of new Set([...allRows.map((row) => row.tag_id), ...selectedTagIds])) {
        const prior = byTag.get(tagId);
        const state = selectedTagIds.has(tagId) ? "assigned" : "removed";
        if (prior?.assignment_state === state) continue;
        database.prepare(`INSERT INTO journal_logical_trade_tag_assignments (
 workspace_id, account_id, logical_trade_id, tag_id, assignment_state,
 revision, updated_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
ON CONFLICT(workspace_id, account_id, logical_trade_id, tag_id) DO UPDATE SET
 assignment_state = excluded.assignment_state, revision = journal_logical_trade_tag_assignments.revision + 1,
 updated_by_user_id = excluded.updated_by_user_id, updated_at_utc = excluded.updated_at_utc`).run(
          scope.workspaceId, scope.activeAccountId!, logical.logicalTradeId, tagId,
          state, scope.userId, timestamp, timestamp,
        );
        const revision = (prior?.revision ?? 0) + 1;
        database.prepare(`INSERT INTO journal_logical_trade_tag_assignment_events (
 logical_trade_tag_assignment_event_id, workspace_id, account_id, logical_trade_id,
 tag_id, assignment_state, revision_number, updated_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          createCanonicalUuidV4(), scope.workspaceId, scope.activeAccountId!, logical.logicalTradeId,
          tagId, state, revision, scope.userId, timestamp,
        );
      }
    }
    for (const change of input.ruleReviews) {
      const editable = before.customRules.find((rule) => rule.ruleId === change.ruleId &&
        rule.ruleVersionId === change.ruleVersionId && rule.revision === change.expectedRevision);
      if (!editable) conflict();
      const priorReview = database.prepare(`SELECT note_text FROM journal_logical_trade_rule_reviews
WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ? AND rule_id = ?`).get(
        scope.workspaceId, scope.activeAccountId!, logical.logicalTradeId, change.ruleId,
      ) as { note_text: string } | undefined;
      database.prepare(`INSERT INTO journal_logical_trade_rule_reviews (
 workspace_id, account_id, logical_trade_id, rule_id, rule_version_id,
 status, note_text, revision, reviewed_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
ON CONFLICT(workspace_id, account_id, logical_trade_id, rule_id) DO UPDATE SET
 rule_version_id = excluded.rule_version_id, status = excluded.status,
 revision = journal_logical_trade_rule_reviews.revision + 1,
 reviewed_by_user_id = excluded.reviewed_by_user_id, updated_at_utc = excluded.updated_at_utc`).run(
        scope.workspaceId, scope.activeAccountId!, logical.logicalTradeId, change.ruleId,
        change.ruleVersionId, change.status, priorReview?.note_text ?? "", scope.userId, timestamp, timestamp,
      );
      database.prepare(`INSERT INTO journal_logical_trade_rule_review_events (
 logical_trade_rule_review_event_id, workspace_id, account_id, logical_trade_id,
 rule_id, rule_version_id, status, note_text, revision_number, reviewed_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        createCanonicalUuidV4(), scope.workspaceId, scope.activeAccountId!, logical.logicalTradeId,
        change.ruleId, change.ruleVersionId, change.status, priorReview?.note_text ?? "", (change.expectedRevision ?? 0) + 1,
        scope.userId, timestamp,
      );
    }
  }).immediate());
}

export function saveTradeExplorerReview(
  scope: WorkspaceAccessScope,
  input: TradeExplorerReviewSaveInput,
): TradeExplorerReviewModel {
  requireExpectedJournalAccountSelection(scope, input.expectedAccountSelectionRef);
  const before = readTradeExplorerReview(scope, input);
  const logical = logicalReviewTarget(scope, input.roundTripId);
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
  if (logical) {
    saveLogicalTradeReview(scope, logical, input, before);
  } else withWritableJournalAnnotations(scope, (service, account) => {
    service.saveTradeReview(account, {
      expectedRoundTripVersionId: input.expectedRoundTripVersionId,
      note: input.note,
      roundTripId: input.roundTripId,
      ruleReviews: input.ruleReviews,
      tags: input.tags,
    });
  });
  return readTradeExplorerReview(scope, input);
}
