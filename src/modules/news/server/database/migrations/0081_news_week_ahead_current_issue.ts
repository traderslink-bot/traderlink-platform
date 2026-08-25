import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (
    ${column} IS NULL OR (
      length(${column}) = 36 AND ${column} = lower(${column})
      AND length(replace(${column}, '-', '')) = 32
      AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
      AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]'
    )
  )`;
}

const sql = `CREATE TABLE news_week_ahead_current_issue (
  state_id INTEGER PRIMARY KEY CHECK (state_id = 1),
  issue_id TEXT ${uuidCheck("issue_id")},
  updated_at_utc TEXT NOT NULL CHECK (
    length(updated_at_utc) = 24
    AND updated_at_utc GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  ),
  FOREIGN KEY (issue_id) REFERENCES news_week_ahead_issues(issue_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

INSERT INTO news_week_ahead_current_issue (state_id, issue_id, updated_at_utc)
VALUES (1, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

CREATE TRIGGER news_week_ahead_current_issue_guard_update
BEFORE UPDATE ON news_week_ahead_current_issue
WHEN NEW.state_id IS NOT OLD.state_id
  OR NEW.updated_at_utc < OLD.updated_at_utc
BEGIN
  SELECT RAISE(ABORT, 'news_week_ahead_current_issue_invalid_update');
END;

CREATE TRIGGER news_week_ahead_current_issue_no_delete
BEFORE DELETE ON news_week_ahead_current_issue BEGIN
  SELECT RAISE(ABORT, 'news_week_ahead_current_issue_required');
END;`;

export const newsWeekAheadCurrentIssueMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "news",
  migrationId: "0081_news_week_ahead_current_issue",
  executionOrder: 81,
  statements: Object.freeze([sql]),
});
