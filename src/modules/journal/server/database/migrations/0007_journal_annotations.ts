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

function tokenCheck(column: string): string {
  return `CHECK (
    length(${column}) BETWEEN 1 AND 64 AND ${column} = lower(${column})
    AND ${column} NOT GLOB '*[^a-z0-9_-]*'
  )`;
}

function sha256Check(column: string): string {
  return `CHECK (
    length(${column}) = 64 AND ${column} = lower(${column})
    AND ${column} NOT GLOB '*[^0-9a-f]*'
  )`;
}

const sql = `CREATE TABLE journal_rules (
  rule_id TEXT PRIMARY KEY ${uuidCheck("rule_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  source_kind TEXT NOT NULL CHECK (source_kind IN ('template', 'custom')),
  template_key TEXT ${tokenCheck("template_key")},
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('active', 'paused', 'retired')),
  current_version_id TEXT NOT NULL ${uuidCheck("current_version_id")},
  revision INTEGER NOT NULL CHECK (revision > 0),
  created_by_user_id TEXT NOT NULL ${uuidCheck("created_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (
    (source_kind = 'template' AND template_key IS NOT NULL)
    OR (source_kind = 'custom' AND template_key IS NULL)
  ),
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (workspace_id, account_id, rule_id),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, rule_id, current_version_id) REFERENCES journal_rule_versions(workspace_id, account_id, rule_id, rule_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE UNIQUE INDEX journal_rules_active_template_name
  ON journal_rules(workspace_id, account_id, template_key)
  WHERE template_key IS NOT NULL AND lifecycle_state <> 'retired';

CREATE INDEX journal_rules_account_state
  ON journal_rules(workspace_id, account_id, lifecycle_state, updated_at_utc, rule_id);

CREATE TABLE journal_rule_versions (
  rule_version_id TEXT PRIMARY KEY ${uuidCheck("rule_version_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  rule_id TEXT NOT NULL ${uuidCheck("rule_id")},
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 100 AND instr(title, char(0)) = 0),
  statement TEXT NOT NULL CHECK (length(trim(statement)) BETWEEN 1 AND 1000 AND instr(statement, char(0)) = 0),
  category TEXT NOT NULL ${tokenCheck("category")},
  review_scope TEXT NOT NULL CHECK (review_scope IN ('day', 'trade', 'both')),
  is_focus INTEGER NOT NULL CHECK (is_focus IN (0, 1)),
  configuration_json TEXT NOT NULL CHECK (
    length(configuration_json) BETWEEN 2 AND 10000
    AND json_valid(configuration_json)
    AND json_type(configuration_json) = 'object'
  ),
  configuration_sha256 TEXT NOT NULL ${sha256Check("configuration_sha256")},
  effective_from_utc TEXT NOT NULL ${utcCheck("effective_from_utc")},
  created_by_user_id TEXT NOT NULL ${uuidCheck("created_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (workspace_id, account_id, rule_id, version_number),
  UNIQUE (workspace_id, account_id, rule_id, rule_version_id),
  FOREIGN KEY (workspace_id, account_id, rule_id) REFERENCES journal_rules(workspace_id, account_id, rule_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (created_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_rule_versions_effective
  ON journal_rule_versions(workspace_id, account_id, rule_id, effective_from_utc, version_number);

CREATE TABLE journal_rule_lifecycle_events (
  lifecycle_event_id TEXT PRIMARY KEY ${uuidCheck("lifecycle_event_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  rule_id TEXT NOT NULL ${uuidCheck("rule_id")},
  sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
  event_kind TEXT NOT NULL CHECK (event_kind IN ('activated', 'paused', 'resumed', 'retired')),
  previous_state TEXT CHECK (previous_state IN ('active', 'paused')),
  new_state TEXT NOT NULL CHECK (new_state IN ('active', 'paused', 'retired')),
  effective_at_utc TEXT NOT NULL ${utcCheck("effective_at_utc")},
  authored_by_user_id TEXT NOT NULL ${uuidCheck("authored_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (
    (sequence_number = 1 AND event_kind = 'activated' AND previous_state IS NULL AND new_state = 'active')
    OR (sequence_number > 1 AND previous_state IS NOT NULL)
  ),
  UNIQUE (workspace_id, account_id, rule_id, sequence_number),
  FOREIGN KEY (workspace_id, account_id, rule_id) REFERENCES journal_rules(workspace_id, account_id, rule_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (authored_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE journal_rule_reviews (
  rule_review_id TEXT PRIMARY KEY ${uuidCheck("rule_review_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  rule_id TEXT NOT NULL ${uuidCheck("rule_id")},
  target_kind TEXT NOT NULL CHECK (target_kind IN ('trading_day', 'round_trip')),
  trading_day_id TEXT ${uuidCheck("trading_day_id")},
  round_trip_id TEXT ${uuidCheck("round_trip_id")},
  current_review_version_id TEXT NOT NULL ${uuidCheck("current_review_version_id")},
  revision INTEGER NOT NULL CHECK (revision > 0),
  created_by_user_id TEXT NOT NULL ${uuidCheck("created_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (
    (target_kind = 'trading_day' AND trading_day_id IS NOT NULL AND round_trip_id IS NULL)
    OR (target_kind = 'round_trip' AND round_trip_id IS NOT NULL AND trading_day_id IS NULL)
  ),
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (workspace_id, account_id, rule_review_id),
  FOREIGN KEY (workspace_id, account_id, rule_id) REFERENCES journal_rules(workspace_id, account_id, rule_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, trading_day_id) REFERENCES journal_trading_days(workspace_id, account_id, trading_day_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, round_trip_id) REFERENCES journal_round_trips(workspace_id, account_id, round_trip_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, rule_review_id, current_review_version_id) REFERENCES journal_rule_review_versions(workspace_id, account_id, rule_review_id, rule_review_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE UNIQUE INDEX journal_rule_reviews_day_target
  ON journal_rule_reviews(workspace_id, account_id, trading_day_id, rule_id)
  WHERE target_kind = 'trading_day';

CREATE UNIQUE INDEX journal_rule_reviews_round_trip_target
  ON journal_rule_reviews(workspace_id, account_id, round_trip_id, rule_id)
  WHERE target_kind = 'round_trip';

CREATE TABLE journal_rule_review_versions (
  rule_review_version_id TEXT PRIMARY KEY ${uuidCheck("rule_review_version_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  rule_review_id TEXT NOT NULL ${uuidCheck("rule_review_id")},
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  rule_id TEXT NOT NULL ${uuidCheck("rule_id")},
  rule_version_id TEXT NOT NULL ${uuidCheck("rule_version_id")},
  status TEXT NOT NULL CHECK (status IN ('followed', 'broken', 'not_reviewed')),
  authored_by_user_id TEXT NOT NULL ${uuidCheck("authored_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (workspace_id, account_id, rule_review_id, version_number),
  UNIQUE (workspace_id, account_id, rule_review_id, rule_review_version_id),
  FOREIGN KEY (workspace_id, account_id, rule_review_id) REFERENCES journal_rule_reviews(workspace_id, account_id, rule_review_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id, account_id, rule_id, rule_version_id) REFERENCES journal_rule_versions(workspace_id, account_id, rule_id, rule_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (authored_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE journal_tags (
  tag_id TEXT PRIMARY KEY ${uuidCheck("tag_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  current_name TEXT NOT NULL CHECK (length(trim(current_name)) BETWEEN 1 AND 40),
  normalized_name TEXT NOT NULL CHECK (length(normalized_name) BETWEEN 1 AND 40),
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('active', 'retired')),
  current_version_id TEXT NOT NULL ${uuidCheck("current_version_id")},
  revision INTEGER NOT NULL CHECK (revision > 0),
  created_by_user_id TEXT NOT NULL ${uuidCheck("created_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (workspace_id, account_id, tag_id),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, tag_id, current_version_id) REFERENCES journal_tag_versions(workspace_id, account_id, tag_id, tag_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE UNIQUE INDEX journal_tags_active_name
  ON journal_tags(workspace_id, account_id, normalized_name)
  WHERE lifecycle_state = 'active';

CREATE INDEX journal_tags_account_state
  ON journal_tags(workspace_id, account_id, lifecycle_state, normalized_name, tag_id);

CREATE TABLE journal_tag_versions (
  tag_version_id TEXT PRIMARY KEY ${uuidCheck("tag_version_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  tag_id TEXT NOT NULL ${uuidCheck("tag_id")},
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  event_kind TEXT NOT NULL CHECK (event_kind IN ('created', 'renamed', 'retired')),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 40),
  normalized_name TEXT NOT NULL CHECK (length(normalized_name) BETWEEN 1 AND 40),
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('active', 'retired')),
  authored_by_user_id TEXT NOT NULL ${uuidCheck("authored_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (workspace_id, account_id, tag_id, version_number),
  UNIQUE (workspace_id, account_id, tag_id, tag_version_id),
  FOREIGN KEY (workspace_id, account_id, tag_id) REFERENCES journal_tags(workspace_id, account_id, tag_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (authored_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE journal_round_trip_tag_assignments (
  tag_assignment_id TEXT PRIMARY KEY ${uuidCheck("tag_assignment_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  round_trip_id TEXT NOT NULL ${uuidCheck("round_trip_id")},
  tag_id TEXT NOT NULL ${uuidCheck("tag_id")},
  assignment_state TEXT NOT NULL CHECK (assignment_state IN ('assigned', 'removed')),
  current_event_id TEXT NOT NULL ${uuidCheck("current_event_id")},
  revision INTEGER NOT NULL CHECK (revision > 0),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (workspace_id, account_id, round_trip_id, tag_id),
  UNIQUE (workspace_id, account_id, tag_assignment_id),
  FOREIGN KEY (workspace_id, account_id, round_trip_id) REFERENCES journal_round_trips(workspace_id, account_id, round_trip_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, tag_id) REFERENCES journal_tags(workspace_id, account_id, tag_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, tag_assignment_id, current_event_id) REFERENCES journal_round_trip_tag_assignment_events(workspace_id, account_id, tag_assignment_id, assignment_event_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX journal_round_trip_tags_active
  ON journal_round_trip_tag_assignments(workspace_id, account_id, round_trip_id, tag_id)
  WHERE assignment_state = 'assigned';

CREATE TABLE journal_round_trip_tag_assignment_events (
  assignment_event_id TEXT PRIMARY KEY ${uuidCheck("assignment_event_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  tag_assignment_id TEXT NOT NULL ${uuidCheck("tag_assignment_id")},
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  event_kind TEXT NOT NULL CHECK (event_kind IN ('assigned', 'removed')),
  authored_by_user_id TEXT NOT NULL ${uuidCheck("authored_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (workspace_id, account_id, tag_assignment_id, version_number),
  UNIQUE (workspace_id, account_id, tag_assignment_id, assignment_event_id),
  FOREIGN KEY (workspace_id, account_id, tag_assignment_id) REFERENCES journal_round_trip_tag_assignments(workspace_id, account_id, tag_assignment_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (authored_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TRIGGER journal_round_trip_tags_max_ten_insert
BEFORE INSERT ON journal_round_trip_tag_assignments
WHEN NEW.assignment_state = 'assigned'
BEGIN
  SELECT CASE WHEN (
    SELECT COUNT(*) FROM journal_round_trip_tag_assignments
    WHERE workspace_id = NEW.workspace_id AND account_id = NEW.account_id
      AND round_trip_id = NEW.round_trip_id AND assignment_state = 'assigned'
  ) >= 10 THEN RAISE(ABORT, 'journal_round_trip_tag_limit') END;
END;

CREATE TRIGGER journal_round_trip_tags_max_ten_update
BEFORE UPDATE OF assignment_state ON journal_round_trip_tag_assignments
WHEN OLD.assignment_state <> 'assigned' AND NEW.assignment_state = 'assigned'
BEGIN
  SELECT CASE WHEN (
    SELECT COUNT(*) FROM journal_round_trip_tag_assignments
    WHERE workspace_id = NEW.workspace_id AND account_id = NEW.account_id
      AND round_trip_id = NEW.round_trip_id AND assignment_state = 'assigned'
  ) >= 10 THEN RAISE(ABORT, 'journal_round_trip_tag_limit') END;
END;

CREATE TABLE journal_daily_notes (
  daily_note_id TEXT PRIMARY KEY ${uuidCheck("daily_note_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  trading_day_id TEXT NOT NULL ${uuidCheck("trading_day_id")},
  current_revision_id TEXT NOT NULL ${uuidCheck("current_revision_id")},
  revision INTEGER NOT NULL CHECK (revision > 0),
  created_by_user_id TEXT NOT NULL ${uuidCheck("created_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (workspace_id, account_id, trading_day_id),
  UNIQUE (workspace_id, account_id, daily_note_id),
  FOREIGN KEY (workspace_id, account_id, trading_day_id) REFERENCES journal_trading_days(workspace_id, account_id, trading_day_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, daily_note_id, current_revision_id) REFERENCES journal_daily_note_revisions(workspace_id, account_id, daily_note_id, daily_note_revision_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE TABLE journal_daily_note_revisions (
  daily_note_revision_id TEXT PRIMARY KEY ${uuidCheck("daily_note_revision_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  daily_note_id TEXT NOT NULL ${uuidCheck("daily_note_id")},
  revision_number INTEGER NOT NULL CHECK (revision_number > 0),
  what_worked TEXT NOT NULL CHECK (length(what_worked) <= 10000 AND instr(what_worked, char(0)) = 0),
  what_needs_work TEXT NOT NULL CHECK (length(what_needs_work) <= 10000 AND instr(what_needs_work, char(0)) = 0),
  technical_recap TEXT NOT NULL CHECK (length(technical_recap) <= 10000 AND instr(technical_recap, char(0)) = 0),
  tomorrows_focus TEXT NOT NULL CHECK (length(tomorrows_focus) <= 10000 AND instr(tomorrows_focus, char(0)) = 0),
  anything_else TEXT NOT NULL CHECK (length(anything_else) <= 10000 AND instr(anything_else, char(0)) = 0),
  authored_by_user_id TEXT NOT NULL ${uuidCheck("authored_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (workspace_id, account_id, daily_note_id, revision_number),
  UNIQUE (workspace_id, account_id, daily_note_id, daily_note_revision_id),
  FOREIGN KEY (workspace_id, account_id, daily_note_id) REFERENCES journal_daily_notes(workspace_id, account_id, daily_note_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (authored_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE journal_round_trip_notes (
  round_trip_note_id TEXT PRIMARY KEY ${uuidCheck("round_trip_note_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  round_trip_id TEXT NOT NULL ${uuidCheck("round_trip_id")},
  current_revision_id TEXT NOT NULL ${uuidCheck("current_revision_id")},
  revision INTEGER NOT NULL CHECK (revision > 0),
  created_by_user_id TEXT NOT NULL ${uuidCheck("created_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (workspace_id, account_id, round_trip_id),
  UNIQUE (workspace_id, account_id, round_trip_note_id),
  FOREIGN KEY (workspace_id, account_id, round_trip_id) REFERENCES journal_round_trips(workspace_id, account_id, round_trip_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, round_trip_note_id, current_revision_id) REFERENCES journal_round_trip_note_revisions(workspace_id, account_id, round_trip_note_id, round_trip_note_revision_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE TABLE journal_round_trip_note_revisions (
  round_trip_note_revision_id TEXT PRIMARY KEY ${uuidCheck("round_trip_note_revision_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  round_trip_note_id TEXT NOT NULL ${uuidCheck("round_trip_note_id")},
  revision_number INTEGER NOT NULL CHECK (revision_number > 0),
  technical_note TEXT NOT NULL CHECK (length(technical_note) <= 10000 AND instr(technical_note, char(0)) = 0),
  trade_note TEXT NOT NULL CHECK (length(trade_note) <= 10000 AND instr(trade_note, char(0)) = 0),
  authored_by_user_id TEXT NOT NULL ${uuidCheck("authored_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (workspace_id, account_id, round_trip_note_id, revision_number),
  UNIQUE (workspace_id, account_id, round_trip_note_id, round_trip_note_revision_id),
  FOREIGN KEY (workspace_id, account_id, round_trip_note_id) REFERENCES journal_round_trip_notes(workspace_id, account_id, round_trip_note_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (authored_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT`;

export const journalAnnotationsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0007_journal_annotations",
  executionOrder: 7,
  statements: Object.freeze([sql]),
});
