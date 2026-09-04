import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function utcCheck(column: string): string {
  return `CHECK (length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

function tokenCheck(column: string): string {
  return `CHECK (length(${column}) BETWEEN 1 AND 64 AND ${column} = lower(${column})
    AND ${column} NOT GLOB '*[^a-z0-9_-]*')`;
}

const sql = `CREATE TABLE journal_logical_trades (
  logical_trade_id TEXT PRIMARY KEY ${uuidCheck("logical_trade_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  current_version_id TEXT NOT NULL ${uuidCheck("current_version_id")},
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('active', 'review_required', 'retired')),
  revision INTEGER NOT NULL CHECK (revision > 0),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (workspace_id, account_id, logical_trade_id),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, logical_trade_id, current_version_id)
    REFERENCES journal_logical_trade_versions(workspace_id, account_id, logical_trade_id, logical_trade_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE TABLE journal_logical_trade_versions (
  logical_trade_version_id TEXT PRIMARY KEY ${uuidCheck("logical_trade_version_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  logical_trade_id TEXT NOT NULL ${uuidCheck("logical_trade_id")},
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  version_state TEXT NOT NULL CHECK (version_state IN ('active', 'review_required', 'retired')),
  trade_style TEXT NOT NULL CHECK (trade_style IN ('day', 'swing')),
  change_kind TEXT NOT NULL CHECK (change_kind IN (
    'created', 'merged', 'unmerged', 'member_refreshed', 'review_required', 'resolved'
  )),
  reason_code TEXT CHECK (reason_code IS NULL OR (${tokenCheck("reason_code").replace(/^CHECK \(|\)$/gu, "")})),
  created_by_user_id TEXT NOT NULL ${uuidCheck("created_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (workspace_id, account_id, logical_trade_id, version_number),
  UNIQUE (workspace_id, account_id, logical_trade_id, logical_trade_version_id),
  FOREIGN KEY (workspace_id, account_id, logical_trade_id)
    REFERENCES journal_logical_trades(workspace_id, account_id, logical_trade_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (created_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE journal_logical_trade_version_members (
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  logical_trade_id TEXT NOT NULL ${uuidCheck("logical_trade_id")},
  logical_trade_version_id TEXT NOT NULL ${uuidCheck("logical_trade_version_id")},
  member_sequence INTEGER NOT NULL CHECK (member_sequence > 0),
  round_trip_id TEXT NOT NULL ${uuidCheck("round_trip_id")},
  round_trip_version_id TEXT NOT NULL ${uuidCheck("round_trip_version_id")},
  PRIMARY KEY (workspace_id, account_id, logical_trade_version_id, member_sequence),
  UNIQUE (workspace_id, account_id, logical_trade_id, logical_trade_version_id, round_trip_id),
  UNIQUE (workspace_id, account_id, logical_trade_id, logical_trade_version_id, member_sequence),
  FOREIGN KEY (workspace_id, account_id, logical_trade_id, logical_trade_version_id)
    REFERENCES journal_logical_trade_versions(workspace_id, account_id, logical_trade_id, logical_trade_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, round_trip_id, round_trip_version_id)
    REFERENCES journal_round_trip_versions(workspace_id, account_id, round_trip_id, round_trip_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE TABLE journal_active_logical_trade_memberships (
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  round_trip_id TEXT NOT NULL ${uuidCheck("round_trip_id")},
  logical_trade_id TEXT NOT NULL ${uuidCheck("logical_trade_id")},
  logical_trade_version_id TEXT NOT NULL ${uuidCheck("logical_trade_version_id")},
  member_sequence INTEGER NOT NULL CHECK (member_sequence > 0),
  activated_at_utc TEXT NOT NULL ${utcCheck("activated_at_utc")},
  PRIMARY KEY (workspace_id, account_id, round_trip_id),
  UNIQUE (workspace_id, account_id, logical_trade_id, logical_trade_version_id, member_sequence),
  FOREIGN KEY (workspace_id, account_id, round_trip_id)
    REFERENCES journal_round_trips(workspace_id, account_id, round_trip_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, logical_trade_id, logical_trade_version_id, round_trip_id)
    REFERENCES journal_logical_trade_version_members(
      workspace_id, account_id, logical_trade_id, logical_trade_version_id, round_trip_id
    ) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE INDEX journal_active_logical_trade_memberships_group
  ON journal_active_logical_trade_memberships(
    workspace_id, account_id, logical_trade_id, logical_trade_version_id, member_sequence
  );

CREATE TABLE journal_logical_trade_events (
  logical_trade_event_id TEXT PRIMARY KEY ${uuidCheck("logical_trade_event_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  logical_trade_id TEXT NOT NULL ${uuidCheck("logical_trade_id")},
  logical_trade_version_id TEXT NOT NULL ${uuidCheck("logical_trade_version_id")},
  event_kind TEXT NOT NULL CHECK (event_kind IN (
    'created', 'merged', 'unmerged', 'member_refreshed', 'review_required', 'resolved'
  )),
  actor_user_id TEXT NOT NULL ${uuidCheck("actor_user_id")},
  reason_code TEXT CHECK (reason_code IS NULL OR (${tokenCheck("reason_code").replace(/^CHECK \(|\)$/gu, "")})),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (workspace_id, account_id, logical_trade_id, logical_trade_event_id),
  FOREIGN KEY (workspace_id, account_id, logical_trade_id, logical_trade_version_id)
    REFERENCES journal_logical_trade_versions(workspace_id, account_id, logical_trade_id, logical_trade_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (actor_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_logical_trade_events_history
  ON journal_logical_trade_events(workspace_id, account_id, logical_trade_id, created_at_utc, logical_trade_event_id);

CREATE TRIGGER journal_logical_trades_no_delete
BEFORE DELETE ON journal_logical_trades
BEGIN SELECT RAISE(ABORT, 'journal_logical_trade_history_required'); END;
CREATE TRIGGER journal_logical_trade_versions_no_update
BEFORE UPDATE ON journal_logical_trade_versions
BEGIN SELECT RAISE(ABORT, 'journal_logical_trade_version_immutable'); END;
CREATE TRIGGER journal_logical_trade_versions_no_delete
BEFORE DELETE ON journal_logical_trade_versions
BEGIN SELECT RAISE(ABORT, 'journal_logical_trade_version_history_required'); END;
CREATE TRIGGER journal_logical_trade_version_members_no_update
BEFORE UPDATE ON journal_logical_trade_version_members
BEGIN SELECT RAISE(ABORT, 'journal_logical_trade_membership_immutable'); END;
CREATE TRIGGER journal_logical_trade_version_members_no_delete
BEFORE DELETE ON journal_logical_trade_version_members
BEGIN SELECT RAISE(ABORT, 'journal_logical_trade_membership_history_required'); END;
CREATE TRIGGER journal_logical_trade_events_no_update
BEFORE UPDATE ON journal_logical_trade_events
BEGIN SELECT RAISE(ABORT, 'journal_logical_trade_event_immutable'); END;
CREATE TRIGGER journal_logical_trade_events_no_delete
BEFORE DELETE ON journal_logical_trade_events
BEGIN SELECT RAISE(ABORT, 'journal_logical_trade_event_history_required'); END;`;

export const journalLogicalTradesMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0118_journal_logical_trades",
  executionOrder: 118,
  statements: Object.freeze([sql]),
});
