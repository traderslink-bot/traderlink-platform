import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

export const journalChartEntriesMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0187_journal_chart_entries",
  executionOrder: 224,
  statements: Object.freeze([
    `CREATE TABLE journal_chart_entries (
  entry_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  author_user_id TEXT NOT NULL,
  symbol TEXT NOT NULL CHECK (length(symbol) BETWEEN 1 AND 15 AND symbol = upper(symbol)),
  kind TEXT NOT NULL CHECK (kind IN ('note','plan')),
  anchor_at_utc TEXT NOT NULL,
  trading_date TEXT NOT NULL CHECK (length(trading_date) = 10),
  note_text TEXT NOT NULL CHECK (length(note_text) <= 2000 AND instr(note_text, char(0)) = 0),
  plan_json TEXT,
  round_trip_id TEXT,
  revision INTEGER NOT NULL CHECK (revision > 0),
  updated_at_utc TEXT NOT NULL,
  PRIMARY KEY (workspace_id, account_id, entry_id),
  CHECK ((kind = 'note' AND plan_json IS NULL AND length(trim(note_text)) > 0)
    OR (kind = 'plan' AND plan_json IS NOT NULL AND json_valid(plan_json) AND round_trip_id IS NOT NULL)),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, account_id, round_trip_id) REFERENCES journal_round_trips(workspace_id, account_id, round_trip_id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES platform_users(user_id) ON DELETE CASCADE
) STRICT;`,
    `CREATE INDEX journal_chart_entries_session
  ON journal_chart_entries(workspace_id, account_id, symbol, trading_date, anchor_at_utc, entry_id);`,
    `CREATE INDEX journal_execution_versions_chart_session
  ON journal_execution_versions(workspace_id, account_id, executed_at_utc, source_order_key, execution_id);`,
    `CREATE INDEX journal_chart_entries_trade
  ON journal_chart_entries(workspace_id, account_id, round_trip_id, kind);`,
    `CREATE UNIQUE INDEX journal_chart_entries_one_plan_per_trade
  ON journal_chart_entries(workspace_id, account_id, round_trip_id) WHERE kind = 'plan';`,
  ]),
});
