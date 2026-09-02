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

const sql = `CREATE TABLE platform_user_current_focuses (
  user_id TEXT PRIMARY KEY ${uuidCheck("user_id")},
  focus_text TEXT NOT NULL CHECK (length(focus_text) <= 10000 AND instr(focus_text, char(0)) = 0),
  show_in_workspace INTEGER NOT NULL CHECK (show_in_workspace IN (0, 1)),
  revision INTEGER NOT NULL CHECK (revision > 0),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE platform_user_note_types (
  note_type_id TEXT PRIMARY KEY ${uuidCheck("note_type_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 80 AND instr(display_name, char(0)) = 0),
  normalized_name TEXT NOT NULL CHECK (length(normalized_name) BETWEEN 1 AND 80),
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('active', 'retired')),
  revision INTEGER NOT NULL CHECK (revision > 0),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE UNIQUE INDEX platform_user_note_types_active_name
  ON platform_user_note_types(user_id, normalized_name)
  WHERE lifecycle_state = 'active';

CREATE INDEX platform_user_note_types_owner
  ON platform_user_note_types(user_id, lifecycle_state, normalized_name, note_type_id);

CREATE TABLE journal_categorized_notes (
  categorized_note_id TEXT PRIMARY KEY ${uuidCheck("categorized_note_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  target_kind TEXT NOT NULL CHECK (target_kind IN ('trading_day', 'round_trip')),
  trading_day_id TEXT ${uuidCheck("trading_day_id")},
  round_trip_id TEXT ${uuidCheck("round_trip_id")},
  note_type_kind TEXT NOT NULL CHECK (note_type_kind IN ('fixed', 'custom')),
  fixed_type_key TEXT CHECK (fixed_type_key IN ('what_worked', 'what_needs_work', 'technical_recap', 'general')),
  custom_note_type_id TEXT ${uuidCheck("custom_note_type_id")},
  current_revision_id TEXT NOT NULL ${uuidCheck("current_revision_id")},
  revision INTEGER NOT NULL CHECK (revision > 0),
  created_by_user_id TEXT NOT NULL ${uuidCheck("created_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (workspace_id, account_id, categorized_note_id),
  CHECK ((target_kind = 'trading_day' AND trading_day_id IS NOT NULL AND round_trip_id IS NULL)
    OR (target_kind = 'round_trip' AND round_trip_id IS NOT NULL AND trading_day_id IS NULL)),
  CHECK ((note_type_kind = 'fixed' AND fixed_type_key IS NOT NULL AND custom_note_type_id IS NULL)
    OR (note_type_kind = 'custom' AND fixed_type_key IS NULL AND custom_note_type_id IS NOT NULL)),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, trading_day_id) REFERENCES journal_trading_days(workspace_id, account_id, trading_day_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, round_trip_id) REFERENCES journal_round_trips(workspace_id, account_id, round_trip_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (custom_note_type_id) REFERENCES platform_user_note_types(note_type_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, categorized_note_id, current_revision_id) REFERENCES journal_categorized_note_revisions(workspace_id, account_id, categorized_note_id, categorized_note_revision_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE UNIQUE INDEX journal_categorized_notes_day_fixed_target
  ON journal_categorized_notes(workspace_id, account_id, trading_day_id, fixed_type_key)
  WHERE target_kind = 'trading_day' AND note_type_kind = 'fixed';

CREATE UNIQUE INDEX journal_categorized_notes_round_trip_fixed_target
  ON journal_categorized_notes(workspace_id, account_id, round_trip_id, fixed_type_key)
  WHERE target_kind = 'round_trip' AND note_type_kind = 'fixed';

CREATE UNIQUE INDEX journal_categorized_notes_day_custom_target
  ON journal_categorized_notes(workspace_id, account_id, trading_day_id, custom_note_type_id)
  WHERE target_kind = 'trading_day' AND note_type_kind = 'custom';

CREATE UNIQUE INDEX journal_categorized_notes_round_trip_custom_target
  ON journal_categorized_notes(workspace_id, account_id, round_trip_id, custom_note_type_id)
  WHERE target_kind = 'round_trip' AND note_type_kind = 'custom';

CREATE INDEX journal_categorized_notes_target
  ON journal_categorized_notes(workspace_id, account_id, target_kind, updated_at_utc, categorized_note_id);

CREATE TABLE journal_categorized_note_revisions (
  categorized_note_revision_id TEXT PRIMARY KEY ${uuidCheck("categorized_note_revision_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  categorized_note_id TEXT NOT NULL ${uuidCheck("categorized_note_id")},
  revision_number INTEGER NOT NULL CHECK (revision_number > 0),
  note_text TEXT NOT NULL CHECK (length(note_text) <= 10000 AND instr(note_text, char(0)) = 0),
  authored_by_user_id TEXT NOT NULL ${uuidCheck("authored_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (workspace_id, account_id, categorized_note_id, revision_number),
  UNIQUE (workspace_id, account_id, categorized_note_id, categorized_note_revision_id),
  FOREIGN KEY (workspace_id, account_id, categorized_note_id) REFERENCES journal_categorized_notes(workspace_id, account_id, categorized_note_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (authored_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;`;

export const journalSharedNotesMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0111_journal_shared_notes",
  executionOrder: 111,
  statements: Object.freeze([sql]),
});
