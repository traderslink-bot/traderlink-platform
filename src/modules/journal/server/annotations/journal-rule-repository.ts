import type Database from "better-sqlite3";

import type {
  JournalRuleLifecycleState,
  JournalRuleRecord,
  JournalRuleReviewRecord,
  JournalRuleReviewScope,
  JournalRuleReviewStatus,
} from "@/src/modules/journal/contracts/journal-annotation-contracts";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

type RuleRow = Readonly<{
  rule_id: string;
  source_kind: "template" | "custom";
  template_key: string | null;
  lifecycle_state: JournalRuleLifecycleState;
  revision: number;
  current_version_id: string;
  version_number: number;
  title: string;
  statement: string;
  category: string;
  review_scope: JournalRuleReviewScope;
  is_focus: number;
  configuration_json: string;
  effective_from_utc: string;
  created_at_utc: string;
  updated_at_utc: string;
}>;

type ReviewRow = Readonly<{
  rule_review_id: string;
  rule_id: string;
  rule_version_id: string;
  target_kind: "trading_day" | "round_trip";
  trading_day_id: string | null;
  round_trip_id: string | null;
  status: JournalRuleReviewStatus;
  note_text: string;
  revision: number;
  updated_at_utc: string;
}>;

export type JournalRuleReviewWithRuleTitle = Readonly<{
  review: JournalRuleReviewRecord;
  ruleTitle: string;
}>;

type ReviewWithRuleTitleRow = ReviewRow & Readonly<{
  rule_title: string;
}>;

type LifecycleRow = Readonly<{
  rule_id: string;
  new_state: JournalRuleLifecycleState;
  effective_at_utc: string;
}>;

const RULE_SELECT = `SELECT r.rule_id, r.source_kind, r.template_key,
  r.lifecycle_state, r.revision, r.current_version_id,
  v.version_number, v.title, v.statement, v.category, v.review_scope,
  v.is_focus, v.configuration_json, v.effective_from_utc,
  r.created_at_utc, r.updated_at_utc
FROM journal_rules r
JOIN journal_rule_versions v
  ON v.workspace_id = r.workspace_id AND v.account_id = r.account_id
 AND v.rule_id = r.rule_id AND v.rule_version_id = r.current_version_id`;

const REVIEW_SELECT = `SELECT r.rule_review_id, r.rule_id,
  v.rule_version_id, r.target_kind, r.trading_day_id, r.round_trip_id,
  v.status, v.note_text, r.revision, r.updated_at_utc
FROM journal_rule_reviews r
JOIN journal_rule_review_versions v
  ON v.workspace_id = r.workspace_id AND v.account_id = r.account_id
 AND v.rule_review_id = r.rule_review_id
 AND v.rule_review_version_id = r.current_review_version_id`;

const REVIEW_WITH_RULE_TITLE_SELECT = `SELECT r.rule_review_id, r.rule_id,
  v.rule_version_id, r.target_kind, r.trading_day_id, r.round_trip_id,
  v.status, v.note_text, r.revision, r.updated_at_utc,
  rule_version.title AS rule_title
FROM journal_rule_reviews r
JOIN journal_rule_review_versions v
  ON v.workspace_id = r.workspace_id AND v.account_id = r.account_id
 AND v.rule_review_id = r.rule_review_id
 AND v.rule_review_version_id = r.current_review_version_id
JOIN journal_rule_versions rule_version
  ON rule_version.workspace_id = r.workspace_id
 AND rule_version.account_id = r.account_id
 AND rule_version.rule_id = r.rule_id
 AND rule_version.rule_version_id = v.rule_version_id`;

function mapRule(row: RuleRow): JournalRuleRecord {
  const parsed: unknown = JSON.parse(row.configuration_json);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID");
  }
  const configuration = Object.fromEntries(Object.entries(parsed).map(
    ([key, value]) => {
      if (typeof value !== "string") {
        platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID");
      }
      return [key, value];
    },
  ));
  return Object.freeze({
    ruleId: row.rule_id,
    sourceKind: row.source_kind,
    templateKey: row.template_key,
    title: row.title,
    statement: row.statement,
    category: row.category,
    reviewScope: row.review_scope,
    isFocus: row.is_focus === 1,
    configuration: Object.freeze(configuration),
    lifecycleState: row.lifecycle_state,
    versionNumber: Number(row.version_number),
    versionId: row.current_version_id,
    revision: Number(row.revision),
    effectiveFromUtc: row.effective_from_utc,
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

function mapReview(row: ReviewRow): JournalRuleReviewRecord {
  return Object.freeze({
    ruleReviewId: row.rule_review_id,
    ruleId: row.rule_id,
    ruleVersionId: row.rule_version_id,
    targetKind: row.target_kind,
    tradingDayId: row.trading_day_id,
    roundTripId: row.round_trip_id,
    status: row.status,
    note: row.note_text,
    revision: Number(row.revision),
    updatedAtUtc: row.updated_at_utc,
  });
}

export class JournalRuleRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }

  list(scope: AccountScope): readonly JournalRuleRecord[] {
    return Object.freeze((this.database.prepare(`${RULE_SELECT}
WHERE r.workspace_id = ? AND r.account_id = ?
ORDER BY r.updated_at_utc DESC, r.rule_id`).all(
      scope.workspaceId,
      scope.accountId,
    ) as RuleRow[]).map(mapRule));
  }

  listForEvaluation(
    scope: AccountScope,
    fromUtc: string,
    untilUtc: string,
  ): readonly JournalRuleRecord[] {
    const versions = this.database.prepare(`SELECT r.rule_id, r.source_kind, r.template_key,
  r.lifecycle_state, r.revision, v.rule_version_id AS current_version_id,
  v.version_number, v.title, v.statement, v.category, v.review_scope,
  v.is_focus, v.configuration_json, v.effective_from_utc,
  r.created_at_utc, r.updated_at_utc
FROM journal_rules r
JOIN journal_rule_versions v
  ON v.workspace_id = r.workspace_id AND v.account_id = r.account_id AND v.rule_id = r.rule_id
WHERE r.workspace_id = ? AND r.account_id = ? AND v.effective_from_utc < ?
ORDER BY r.rule_id, v.effective_from_utc, v.version_number`).all(
      scope.workspaceId, scope.accountId, untilUtc,
    ) as RuleRow[];
    const lifecycle = this.database.prepare(`SELECT rule_id, new_state, effective_at_utc
FROM journal_rule_lifecycle_events
WHERE workspace_id = ? AND account_id = ? AND effective_at_utc < ?
ORDER BY rule_id, effective_at_utc, sequence_number`).all(
      scope.workspaceId, scope.accountId, untilUtc,
    ) as LifecycleRow[];
    const eventsByRule = new Map<string, LifecycleRow[]>();
    for (const event of lifecycle) eventsByRule.set(event.rule_id, [...(eventsByRule.get(event.rule_id) ?? []), event]);
    return Object.freeze(versions.flatMap((row, index) => {
      const next = versions.slice(index + 1).find((candidate) => candidate.rule_id === row.rule_id);
      const versionUntil = next?.effective_from_utc ?? null;
      const events = eventsByRule.get(row.rule_id) ?? [];
      const activeIntervals: Array<{ fromUtc: string; untilUtc: string | null }> = [];
      let activeFrom: string | null = null;
      for (const event of events) {
        if (event.new_state === "active" && activeFrom === null) activeFrom = event.effective_at_utc;
        if (event.new_state !== "active" && activeFrom !== null) {
          activeIntervals.push({ fromUtc: activeFrom, untilUtc: event.effective_at_utc });
          activeFrom = null;
        }
      }
      if (activeFrom !== null) activeIntervals.push({ fromUtc: activeFrom, untilUtc: null });
      const intersects = activeIntervals.some((interval) =>
        interval.fromUtc < untilUtc && (!interval.untilUtc || interval.untilUtc > fromUtc) &&
        row.effective_from_utc < untilUtc && (!versionUntil || versionUntil > fromUtc));
      if (!intersects) return [];
      return [{
        ...mapRule(row),
        activeIntervals: Object.freeze(activeIntervals),
        effectiveUntilUtc: versionUntil,
        lifecycleState: "active" as const,
      }];
    }));
  }

  find(scope: AccountScope, ruleId: string): JournalRuleRecord | null {
    const row = this.database.prepare(`${RULE_SELECT}
WHERE r.workspace_id = ? AND r.account_id = ? AND r.rule_id = ?`)
      .get(scope.workspaceId, scope.accountId, ruleId) as RuleRow | undefined;
    return row ? mapRule(row) : null;
  }

  insert(input: Readonly<{
    scope: AccountScope;
    ruleId: string;
    versionId: string;
    lifecycleEventId: string;
    sourceKind: "template" | "custom";
    templateKey: string | null;
    title: string;
    statement: string;
    category: string;
    reviewScope: JournalRuleReviewScope;
    isFocus: boolean;
    configurationJson: string;
    configurationSha256: string;
    timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_rules (
  rule_id, workspace_id, account_id, source_kind, template_key,
  lifecycle_state, current_version_id, revision, created_by_user_id,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, 'active', ?, 1, ?, ?, ?)`)
      .run(input.ruleId, input.scope.workspaceId, input.scope.accountId,
        input.sourceKind, input.templateKey, input.versionId,
        input.scope.userId, input.timestamp, input.timestamp);
    this.insertVersion({ ...input, versionNumber: 1 });
    this.database.prepare(`INSERT INTO journal_rule_lifecycle_events (
  lifecycle_event_id, workspace_id, account_id, rule_id, sequence_number,
  event_kind, previous_state, new_state, effective_at_utc,
  authored_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, 1, 'activated', NULL, 'active', ?, ?, ?)`)
      .run(input.lifecycleEventId, input.scope.workspaceId,
        input.scope.accountId, input.ruleId, input.timestamp,
        input.scope.userId, input.timestamp);
  }

  insertVersion(input: Readonly<{
    scope: AccountScope;
    ruleId: string;
    versionId: string;
    versionNumber: number;
    title: string;
    statement: string;
    category: string;
    reviewScope: JournalRuleReviewScope;
    isFocus: boolean;
    configurationJson: string;
    configurationSha256: string;
    timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_rule_versions (
  rule_version_id, workspace_id, account_id, rule_id, version_number,
  title, statement, category, review_scope, is_focus, configuration_json,
  configuration_sha256, effective_from_utc, created_by_user_id,
  created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.versionId, input.scope.workspaceId, input.scope.accountId,
        input.ruleId, input.versionNumber, input.title, input.statement,
        input.category, input.reviewScope, input.isFocus ? 1 : 0,
        input.configurationJson, input.configurationSha256, input.timestamp,
        input.scope.userId, input.timestamp);
  }

  updateCurrentVersion(input: Readonly<{
    scope: AccountScope;
    ruleId: string;
    versionId: string;
    expectedRevision: number;
    timestamp: string;
  }>): boolean {
    return this.database.prepare(`UPDATE journal_rules
SET current_version_id = ?, revision = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND rule_id = ? AND revision = ?`)
      .run(input.versionId, input.expectedRevision + 1, input.timestamp,
        input.scope.workspaceId, input.scope.accountId, input.ruleId,
        input.expectedRevision).changes === 1;
  }

  transition(input: Readonly<{
    scope: AccountScope;
    ruleId: string;
    expectedRevision: number;
    previousState: "active" | "paused";
    newState: JournalRuleLifecycleState;
    lifecycleEventId: string;
    timestamp: string;
  }>): boolean {
    const sequence = Number((this.database.prepare(`SELECT COUNT(*) AS count
FROM journal_rule_lifecycle_events
WHERE workspace_id = ? AND account_id = ? AND rule_id = ?`).get(
      input.scope.workspaceId,
      input.scope.accountId,
      input.ruleId,
    ) as { count: number }).count) + 1;
    const eventKind = input.newState === "paused"
      ? "paused"
      : input.newState === "retired"
        ? "retired"
        : "resumed";
    this.database.prepare(`INSERT INTO journal_rule_lifecycle_events (
  lifecycle_event_id, workspace_id, account_id, rule_id, sequence_number,
  event_kind, previous_state, new_state, effective_at_utc,
  authored_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.lifecycleEventId, input.scope.workspaceId,
        input.scope.accountId, input.ruleId, sequence, eventKind,
        input.previousState, input.newState, input.timestamp,
        input.scope.userId, input.timestamp);
    return this.database.prepare(`UPDATE journal_rules
SET lifecycle_state = ?, revision = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND rule_id = ?
  AND lifecycle_state = ? AND revision = ?`)
      .run(input.newState, input.expectedRevision + 1, input.timestamp,
        input.scope.workspaceId, input.scope.accountId, input.ruleId,
        input.previousState, input.expectedRevision).changes === 1;
  }

  listReviews(input: Readonly<{
    scope: AccountScope;
    tradingDayId: string;
    roundTripIds: readonly string[];
  }>): readonly JournalRuleReviewRecord[] {
    const placeholders = input.roundTripIds.map(() => "?").join(", ");
    const target = input.roundTripIds.length === 0
      ? "r.trading_day_id = ?"
      : `r.trading_day_id = ? OR r.round_trip_id IN (${placeholders})`;
    return Object.freeze((this.database.prepare(`${REVIEW_SELECT}
WHERE r.workspace_id = ? AND r.account_id = ? AND (${target})
ORDER BY r.target_kind, r.rule_id, r.rule_review_id`).all(
      input.scope.workspaceId,
      input.scope.accountId,
      input.tradingDayId,
      ...input.roundTripIds,
    ) as ReviewRow[]).map(mapReview));
  }

  listReviewsForTargets(input: Readonly<{
    scope: AccountScope;
    tradingDayIds: readonly string[];
    roundTripIds: readonly string[];
  }>): readonly JournalRuleReviewRecord[] {
    const tradingDayIds = [...new Set(input.tradingDayIds)].sort();
    const roundTripIds = [...new Set(input.roundTripIds)].sort();
    if (tradingDayIds.length === 0 && roundTripIds.length === 0) {
      return Object.freeze([]);
    }
    const rows: ReviewRow[] = [];
    for (let dayOffset = 0; dayOffset < Math.max(1, tradingDayIds.length); dayOffset += 350) {
      const dayBatch = tradingDayIds.slice(dayOffset, dayOffset + 350);
      for (let tradeOffset = 0; tradeOffset < Math.max(1, roundTripIds.length); tradeOffset += 350) {
        const tradeBatch = roundTripIds.slice(tradeOffset, tradeOffset + 350);
        const targets = [
          ...(dayBatch.length > 0
            ? [`r.trading_day_id IN (${dayBatch.map(() => "?").join(", ")})`]
            : []),
          ...(tradeBatch.length > 0
            ? [`r.round_trip_id IN (${tradeBatch.map(() => "?").join(", ")})`]
            : []),
        ];
        rows.push(...this.database.prepare(`${REVIEW_SELECT}
WHERE r.workspace_id = ? AND r.account_id = ?
  AND (${targets.join(" OR ")})
ORDER BY r.target_kind, r.rule_id, r.rule_review_id`).all(
          input.scope.workspaceId,
          input.scope.accountId,
          ...dayBatch,
          ...tradeBatch,
        ) as ReviewRow[]);
      }
    }
    const unique = new Map(rows.map((row) => [row.rule_review_id, row] as const));
    return Object.freeze([...unique.values()].map(mapReview).sort((left, right) =>
      left.targetKind < right.targetKind ? -1 :
        left.targetKind > right.targetKind ? 1 :
          left.ruleId < right.ruleId ? -1 :
            left.ruleId > right.ruleId ? 1 :
              left.ruleReviewId < right.ruleReviewId ? -1 :
                left.ruleReviewId > right.ruleReviewId ? 1 : 0));
  }

  listReviewsForRoundTripsWithRuleTitles(input: Readonly<{
    scope: AccountScope;
    roundTripIds: readonly string[];
  }>): readonly JournalRuleReviewWithRuleTitle[] {
    const roundTripIds = [...new Set(input.roundTripIds)].sort();
    if (roundTripIds.length === 0) return Object.freeze([]);
    const records: JournalRuleReviewWithRuleTitle[] = [];
    for (let offset = 0; offset < roundTripIds.length; offset += 350) {
      const batch = roundTripIds.slice(offset, offset + 350);
      const rows = this.database.prepare(`${REVIEW_WITH_RULE_TITLE_SELECT}
WHERE r.workspace_id = ? AND r.account_id = ?
  AND r.round_trip_id IN (${batch.map(() => "?").join(", ")})
ORDER BY r.round_trip_id, r.rule_id, r.rule_review_id`).all(
        input.scope.workspaceId,
        input.scope.accountId,
        ...batch,
      ) as ReviewWithRuleTitleRow[];
      records.push(...rows.map((row) => Object.freeze({
        review: mapReview(row),
        ruleTitle: row.rule_title,
      })));
    }
    return Object.freeze(records);
  }

  findReview(input: Readonly<{
    scope: AccountScope;
    ruleId: string;
    targetKind: "trading_day" | "round_trip";
    targetId: string;
  }>): JournalRuleReviewRecord | null {
    const column = input.targetKind === "trading_day"
      ? "trading_day_id"
      : "round_trip_id";
    const row = this.database.prepare(`${REVIEW_SELECT}
WHERE r.workspace_id = ? AND r.account_id = ? AND r.rule_id = ?
  AND r.${column} = ?`).get(input.scope.workspaceId, input.scope.accountId,
      input.ruleId, input.targetId) as ReviewRow | undefined;
    return row ? mapReview(row) : null;
  }

  ruleVersionExists(
    scope: AccountScope,
    ruleId: string,
    ruleVersionId: string,
  ): boolean {
    return Boolean(this.database.prepare(`SELECT 1 AS present
FROM journal_rule_versions
WHERE workspace_id = ? AND account_id = ? AND rule_id = ?
  AND rule_version_id = ?`).get(
      scope.workspaceId,
      scope.accountId,
      ruleId,
      ruleVersionId,
    ));
  }

  insertReview(input: Readonly<{
    scope: AccountScope;
    reviewId: string;
    reviewVersionId: string;
    ruleId: string;
    ruleVersionId: string;
    targetKind: "trading_day" | "round_trip";
    targetId: string;
    status: JournalRuleReviewStatus;
    note?: string;
    timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_rule_reviews (
  rule_review_id, workspace_id, account_id, rule_id, target_kind,
  trading_day_id, round_trip_id, current_review_version_id, revision,
  created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`)
      .run(input.reviewId, input.scope.workspaceId, input.scope.accountId,
        input.ruleId, input.targetKind,
        input.targetKind === "trading_day" ? input.targetId : null,
        input.targetKind === "round_trip" ? input.targetId : null,
        input.reviewVersionId, input.scope.userId, input.timestamp,
        input.timestamp);
    this.insertReviewVersion({ ...input, versionNumber: 1 });
  }

  insertReviewVersion(input: Readonly<{
    scope: AccountScope;
    reviewId: string;
    reviewVersionId: string;
    versionNumber: number;
    ruleId: string;
    ruleVersionId: string;
    status: JournalRuleReviewStatus;
    note?: string;
    timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_rule_review_versions (
  rule_review_version_id, workspace_id, account_id, rule_review_id,
  version_number, rule_id, rule_version_id, status, note_text, authored_by_user_id,
  created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.reviewVersionId, input.scope.workspaceId,
        input.scope.accountId, input.reviewId, input.versionNumber,
        input.ruleId, input.ruleVersionId, input.status, input.note ?? "", input.scope.userId,
        input.timestamp);
  }

  updateReview(input: Readonly<{
    scope: AccountScope;
    reviewId: string;
    reviewVersionId: string;
    expectedRevision: number;
    timestamp: string;
  }>): boolean {
    return this.database.prepare(`UPDATE journal_rule_reviews
SET current_review_version_id = ?, revision = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND rule_review_id = ?
  AND revision = ?`).run(input.reviewVersionId, input.expectedRevision + 1,
        input.timestamp, input.scope.workspaceId, input.scope.accountId,
        input.reviewId, input.expectedRevision).changes === 1;
  }
}
