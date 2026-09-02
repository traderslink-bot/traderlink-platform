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

const sql = `CREATE TABLE journal_trading_day_tag_assignments (
  trading_day_tag_assignment_id TEXT PRIMARY KEY ${uuidCheck("trading_day_tag_assignment_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  trading_day_id TEXT NOT NULL ${uuidCheck("trading_day_id")},
  tag_id TEXT NOT NULL ${uuidCheck("tag_id")},
  assignment_state TEXT NOT NULL CHECK (assignment_state IN ('assigned', 'removed')),
  current_event_id TEXT NOT NULL ${uuidCheck("current_event_id")},
  revision INTEGER NOT NULL CHECK (revision > 0),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (workspace_id, account_id, trading_day_id, tag_id),
  UNIQUE (workspace_id, account_id, trading_day_tag_assignment_id),
  FOREIGN KEY (workspace_id, account_id, trading_day_id) REFERENCES journal_trading_days(workspace_id, account_id, trading_day_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, tag_id) REFERENCES journal_tags(workspace_id, account_id, tag_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, trading_day_tag_assignment_id, current_event_id) REFERENCES journal_trading_day_tag_assignment_events(workspace_id, account_id, trading_day_tag_assignment_id, assignment_event_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX journal_trading_day_tags_active
  ON journal_trading_day_tag_assignments(workspace_id, account_id, trading_day_id, tag_id)
  WHERE assignment_state = 'assigned';

CREATE TABLE journal_trading_day_tag_assignment_events (
  assignment_event_id TEXT PRIMARY KEY ${uuidCheck("assignment_event_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  trading_day_tag_assignment_id TEXT NOT NULL ${uuidCheck("trading_day_tag_assignment_id")},
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  event_kind TEXT NOT NULL CHECK (event_kind IN ('assigned', 'removed')),
  authored_by_user_id TEXT NOT NULL ${uuidCheck("authored_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (workspace_id, account_id, trading_day_tag_assignment_id, version_number),
  UNIQUE (workspace_id, account_id, trading_day_tag_assignment_id, assignment_event_id),
  FOREIGN KEY (workspace_id, account_id, trading_day_tag_assignment_id) REFERENCES journal_trading_day_tag_assignments(workspace_id, account_id, trading_day_tag_assignment_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (authored_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TRIGGER journal_trading_day_tags_max_ten_insert
BEFORE INSERT ON journal_trading_day_tag_assignments
WHEN NEW.assignment_state = 'assigned'
BEGIN
  SELECT CASE WHEN (
    SELECT COUNT(*) FROM journal_trading_day_tag_assignments
    WHERE workspace_id = NEW.workspace_id AND account_id = NEW.account_id
      AND trading_day_id = NEW.trading_day_id AND assignment_state = 'assigned'
  ) >= 10 THEN RAISE(ABORT, 'journal_trading_day_tag_limit') END;
END;

CREATE TRIGGER journal_trading_day_tags_max_ten_update
BEFORE UPDATE OF assignment_state ON journal_trading_day_tag_assignments
WHEN OLD.assignment_state <> 'assigned' AND NEW.assignment_state = 'assigned'
BEGIN
  SELECT CASE WHEN (
    SELECT COUNT(*) FROM journal_trading_day_tag_assignments
    WHERE workspace_id = NEW.workspace_id AND account_id = NEW.account_id
      AND trading_day_id = NEW.trading_day_id AND assignment_state = 'assigned'
  ) >= 10 THEN RAISE(ABORT, 'journal_trading_day_tag_limit') END;
END;`;

export const journalTradingDayTagsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0112_journal_trading_day_tags",
  executionOrder: 112,
  statements: Object.freeze([sql]),
});
