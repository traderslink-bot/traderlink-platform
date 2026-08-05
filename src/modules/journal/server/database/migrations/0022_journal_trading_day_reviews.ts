import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (
    length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 9, 1) = '-' AND substr(${column}, 14, 1) = '-'
    AND substr(${column}, 19, 1) = '-' AND substr(${column}, 24, 1) = '-'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]'
  )`;
}

function utcCheck(column: string): string {
  return `CHECK (
    length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  )`;
}

function sha256Check(column: string): string {
  return `CHECK (
    length(${column}) = 64 AND ${column} = lower(${column})
    AND ${column} NOT GLOB '*[^0-9a-f]*'
  )`;
}

const sql = `CREATE TABLE journal_trading_day_reviews (
  trading_day_review_id TEXT PRIMARY KEY ${uuidCheck("trading_day_review_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  trading_day_id TEXT NOT NULL ${uuidCheck("trading_day_id")},
  review_status TEXT NOT NULL CHECK (review_status IN ('reviewed', 'incomplete')),
  current_revision INTEGER NOT NULL CHECK (current_revision > 0),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (workspace_id, account_id, trading_day_id),
  UNIQUE (workspace_id, account_id, trading_day_review_id),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, trading_day_id)
    REFERENCES journal_trading_days(workspace_id, account_id, trading_day_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_trading_day_reviews_account_status
  ON journal_trading_day_reviews(workspace_id, account_id, review_status, updated_at_utc DESC);

CREATE TRIGGER journal_trading_day_reviews_no_delete
BEFORE DELETE ON journal_trading_day_reviews BEGIN
  SELECT RAISE(ABORT, 'journal_trading_day_review_history_required');
END;

CREATE TABLE journal_trading_day_review_events (
  trading_day_review_event_id TEXT PRIMARY KEY ${uuidCheck("trading_day_review_event_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  trading_day_review_id TEXT NOT NULL ${uuidCheck("trading_day_review_id")},
  revision_number INTEGER NOT NULL CHECK (revision_number > 0),
  review_status TEXT NOT NULL CHECK (review_status IN ('reviewed', 'incomplete')),
  expected_revision INTEGER NOT NULL CHECK (expected_revision >= 0),
  actor_user_id TEXT NOT NULL ${uuidCheck("actor_user_id")},
  idempotency_sha256 TEXT NOT NULL ${sha256Check("idempotency_sha256")},
  occurred_at_utc TEXT NOT NULL ${utcCheck("occurred_at_utc")},
  CHECK (
    (revision_number = 1 AND expected_revision = 0)
    OR (revision_number > 1 AND expected_revision = revision_number - 1)
  ),
  UNIQUE (workspace_id, account_id, trading_day_review_id, revision_number),
  UNIQUE (workspace_id, account_id, trading_day_review_id, trading_day_review_event_id),
  UNIQUE (workspace_id, account_id, actor_user_id, idempotency_sha256),
  FOREIGN KEY (workspace_id, account_id, trading_day_review_id)
    REFERENCES journal_trading_day_reviews(workspace_id, account_id, trading_day_review_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (actor_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_trading_day_review_events_chronology
  ON journal_trading_day_review_events(
    workspace_id, account_id, trading_day_review_id, revision_number
  );

CREATE TRIGGER journal_trading_day_review_events_no_update
BEFORE UPDATE ON journal_trading_day_review_events BEGIN
  SELECT RAISE(ABORT, 'journal_trading_day_review_event_immutable');
END;

CREATE TRIGGER journal_trading_day_review_events_no_delete
BEFORE DELETE ON journal_trading_day_review_events BEGIN
  SELECT RAISE(ABORT, 'journal_trading_day_review_event_immutable');
END`;

export const journalTradingDayReviewsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0022_journal_trading_day_reviews",
  executionOrder: 22,
  statements: Object.freeze([sql]),
});
