import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type {
  JournalTradingDayReviewRecord,
  JournalTradingDayReviewStatus,
} from "@/src/modules/journal/contracts/journal-trading-day-review-contracts";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { ensureJournalTradingDay } from "../trading-days/ensure-journal-trading-day";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9_-]{16,128}$/u;

type ReviewRow = {
  current_revision: number;
  review_status: JournalTradingDayReviewStatus;
  trading_date: string;
  updated_at_utc: string;
  trading_day_id: string;
  trading_day_review_id: string;
};

function record(row: ReviewRow): JournalTradingDayReviewRecord {
  return Object.freeze({
    revision: row.current_revision,
    status: row.review_status,
    tradingDate: row.trading_date,
    updatedAtUtc: row.updated_at_utc,
  });
}
export class JournalTradingDayReviewService {
  constructor(private readonly database: Database.Database) {}

  private immediate<T>(operation: () => T): T {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }

  read(scope: AccountScope, tradingDate: string): JournalTradingDayReviewRecord | null {
    if (!DATE_PATTERN.test(tradingDate)) {
      platformFailure("TRADERLINK_TRADING_DAY_REVIEW_INVALID");
    }
    const row = this.database.prepare<[string, string, string], ReviewRow>(`SELECT
  review.current_revision, review.review_status, day.trading_date,
  review.updated_at_utc, day.trading_day_id, review.trading_day_review_id
FROM journal_trading_days day
LEFT JOIN journal_trading_day_reviews review
  ON review.workspace_id = day.workspace_id
 AND review.account_id = day.account_id
 AND review.trading_day_id = day.trading_day_id
WHERE day.workspace_id = ? AND day.account_id = ? AND day.trading_date = ?`)
      .get(scope.workspaceId, scope.accountId, tradingDate);
    return row?.trading_day_review_id ? record(row) : null;
  }

  latestReviewedBefore(
    scope: AccountScope,
    beforeTradingDate: string,
  ): JournalTradingDayReviewRecord | null {
    if (!DATE_PATTERN.test(beforeTradingDate)) {
      platformFailure("TRADERLINK_TRADING_DAY_REVIEW_INVALID");
    }
    const row = this.database.prepare<[string, string, string], ReviewRow>(`SELECT
  review.current_revision, review.review_status, day.trading_date,
  review.updated_at_utc, day.trading_day_id, review.trading_day_review_id
FROM journal_trading_day_reviews review
JOIN journal_trading_days day
  ON day.workspace_id = review.workspace_id
 AND day.account_id = review.account_id
 AND day.trading_day_id = review.trading_day_id
WHERE review.workspace_id = ? AND review.account_id = ?
  AND review.review_status = 'reviewed'
  AND day.status = 'active'
  AND day.trading_date < ?
ORDER BY day.trading_date DESC, review.updated_at_utc DESC, review.trading_day_review_id DESC
LIMIT 1`).get(scope.workspaceId, scope.accountId, beforeTradingDate);
    return row ? record(row) : null;
  }

  unclassifiedOpenPositionCount(scope: AccountScope, tradingDate: string): number {
    if (!DATE_PATTERN.test(tradingDate)) {
      platformFailure("TRADERLINK_TRADING_DAY_REVIEW_INVALID");
    }
    const row = this.database.prepare<[string, string, string], { count: number }>(`SELECT
  count(DISTINCT round_trip.round_trip_id) AS count
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.workspace_id = round_trip.workspace_id
 AND version.account_id = round_trip.account_id
 AND version.round_trip_version_id = round_trip.current_version_id
JOIN journal_round_trip_execution_allocations allocation
  ON allocation.workspace_id = version.workspace_id
 AND allocation.account_id = version.account_id
 AND allocation.round_trip_version_id = version.round_trip_version_id
JOIN journal_execution_versions execution_version
  ON execution_version.workspace_id = allocation.workspace_id
 AND execution_version.account_id = allocation.account_id
 AND execution_version.execution_version_id = allocation.execution_version_id
LEFT JOIN journal_trade_style_plans style
  ON style.workspace_id = round_trip.workspace_id
 AND style.account_id = round_trip.account_id
 AND style.round_trip_id = round_trip.round_trip_id
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND round_trip.lifecycle_state = 'active'
  AND version.projection_state = 'legitimate_open'
  AND substr(execution_version.source_timestamp_text, 1, 10) = ?
  AND (style.trade_style_plan_id IS NULL OR style.open_status = 'unclassified')`)
      .get(scope.workspaceId, scope.accountId, tradingDate);
    return row?.count ?? 0;
  }

  save(
    scope: AccountScope,
    input: Readonly<{
      expectedRevision: number | null;
      idempotencyKey: string;
      status: JournalTradingDayReviewStatus;
      tradingDate: string;
      userId: string;
      now?: Date;
    }>,
  ): JournalTradingDayReviewRecord {
    if (
      !DATE_PATTERN.test(input.tradingDate) ||
      !IDEMPOTENCY_PATTERN.test(input.idempotencyKey) ||
      (input.expectedRevision !== null &&
        (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1))
    ) {
      platformFailure("TRADERLINK_TRADING_DAY_REVIEW_INVALID");
    }
    if (
      input.status === "reviewed" &&
      this.unclassifiedOpenPositionCount(scope, input.tradingDate) > 0
    ) {
      platformFailure("TRADERLINK_TRADING_DAY_REVIEW_OPEN_POSITION_CLASSIFICATION_REQUIRED");
    }
    const timestamp = createCanonicalUtcTimestamp(input.now);
    const idempotencySha256 = createHash("sha256")
      .update(`${input.idempotencyKey}\n`, "utf8")
      .digest("hex");
    return this.immediate(() => {
      const tradingDayId = ensureJournalTradingDay(
        this.database,
        scope,
        input.tradingDate,
        timestamp,
      );
      const current = this.read(scope, input.tradingDate);
      if ((current?.revision ?? null) !== input.expectedRevision) {
        platformFailure("TRADERLINK_TRADING_DAY_REVIEW_CONFLICT");
      }
      const existingEvent = this.database.prepare<[string, string, string], ReviewRow>(`SELECT
  review.current_revision, review.review_status, day.trading_date,
  review.updated_at_utc, day.trading_day_id, review.trading_day_review_id
FROM journal_trading_day_review_events event
JOIN journal_trading_day_reviews review
  ON review.workspace_id = event.workspace_id
 AND review.account_id = event.account_id
 AND review.trading_day_review_id = event.trading_day_review_id
JOIN journal_trading_days day
  ON day.workspace_id = review.workspace_id
 AND day.account_id = review.account_id
 AND day.trading_day_id = review.trading_day_id
WHERE event.workspace_id = ? AND event.account_id = ? AND event.idempotency_sha256 = ?`)
        .get(scope.workspaceId, scope.accountId, idempotencySha256);
      if (existingEvent) return record(existingEvent);

      const reviewId = current
        ? this.database.prepare<[string, string, string], { trading_day_review_id: string }>(`SELECT trading_day_review_id
FROM journal_trading_day_reviews
WHERE workspace_id = ? AND account_id = ? AND trading_day_id = ?`)
          .get(scope.workspaceId, scope.accountId, tradingDayId)!.trading_day_review_id
        : createCanonicalUuidV4();
      const revision = (current?.revision ?? 0) + 1;
      if (current) {
        const updated = this.database.prepare(`UPDATE journal_trading_day_reviews
SET review_status = ?, current_revision = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND trading_day_review_id = ?
  AND current_revision = ?`).run(
          input.status, revision, timestamp,
          scope.workspaceId, scope.accountId, reviewId, current.revision,
        );
        if (updated.changes !== 1) platformFailure("TRADERLINK_TRADING_DAY_REVIEW_CONFLICT");
      } else {
        this.database.prepare(`INSERT INTO journal_trading_day_reviews (
  trading_day_review_id, user_id, workspace_id, account_id, trading_day_id,
  review_status, current_revision, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(reviewId, input.userId, scope.workspaceId, scope.accountId, tradingDayId,
            input.status, revision, timestamp, timestamp);
      }
      this.database.prepare(`INSERT INTO journal_trading_day_review_events (
  trading_day_review_event_id, workspace_id, account_id, trading_day_review_id,
  revision_number, review_status, expected_revision, actor_user_id,
  idempotency_sha256, occurred_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(createCanonicalUuidV4(), scope.workspaceId, scope.accountId, reviewId,
          revision, input.status, current?.revision ?? 0, input.userId,
          idempotencySha256, timestamp);
      const saved = this.read(scope, input.tradingDate);
      if (!saved) platformFailure("TRADERLINK_TRADING_DAY_REVIEW_CONFLICT");
      return saved;
    });
  }
}
