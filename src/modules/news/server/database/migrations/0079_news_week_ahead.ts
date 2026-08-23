import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (
    length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]'
  )`;
}

function utcCheck(column: string): string {
  return `CHECK (
    length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  )`;
}

const sql = `CREATE TABLE news_week_ahead_issues (
  issue_id TEXT PRIMARY KEY ${uuidCheck("issue_id")},
  source_url TEXT NOT NULL UNIQUE CHECK (
    length(source_url) BETWEEN 12 AND 2048
    AND instr(source_url, char(0)) = 0
  ),
  source_slug TEXT NOT NULL CHECK (
    length(source_slug) BETWEEN 1 AND 120
    AND source_slug NOT GLOB '*[^a-z0-9-]*'
  ),
  issue_slug TEXT NOT NULL UNIQUE CHECK (
    length(issue_slug) BETWEEN 1 AND 120
    AND issue_slug NOT GLOB '*[^a-z0-9-]*'
  ),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 220),
  excerpt TEXT NOT NULL CHECK (length(excerpt) BETWEEN 1 AND 1000),
  article_text TEXT NOT NULL CHECK (length(article_text) BETWEEN 1 AND 60000),
  source_name TEXT NOT NULL CHECK (length(source_name) BETWEEN 1 AND 120),
  source_date_line TEXT NOT NULL CHECK (length(source_date_line) <= 160),
  source_attribution TEXT NOT NULL CHECK (length(source_attribution) <= 1000),
  tickers_json TEXT NOT NULL CHECK (json_valid(tickers_json)),
  catalysts_json TEXT NOT NULL CHECK (json_valid(catalysts_json)),
  risk_notes_json TEXT NOT NULL CHECK (json_valid(risk_notes_json)),
  structured_content_json TEXT NOT NULL CHECK (json_valid(structured_content_json)),
  published_at_utc TEXT NOT NULL ${utcCheck("published_at_utc")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  revision INTEGER NOT NULL CHECK (revision >= 1),
  content_sha256 TEXT NOT NULL CHECK (
    length(content_sha256) = 64 AND content_sha256 NOT GLOB '*[^0-9a-f]*'
  )
) STRICT;

CREATE INDEX news_week_ahead_current
  ON news_week_ahead_issues(published_at_utc DESC, issue_id DESC);

CREATE TABLE news_week_ahead_issue_versions (
  version_id TEXT PRIMARY KEY ${uuidCheck("version_id")},
  issue_id TEXT NOT NULL ${uuidCheck("issue_id")},
  revision INTEGER NOT NULL CHECK (revision >= 1),
  content_sha256 TEXT NOT NULL CHECK (
    length(content_sha256) = 64 AND content_sha256 NOT GLOB '*[^0-9a-f]*'
  ),
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE(issue_id, revision),
  FOREIGN KEY (issue_id) REFERENCES news_week_ahead_issues(issue_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX news_week_ahead_versions_issue
  ON news_week_ahead_issue_versions(issue_id, revision DESC);

CREATE TRIGGER news_week_ahead_issues_guard_update
BEFORE UPDATE ON news_week_ahead_issues
WHEN NEW.issue_id IS NOT OLD.issue_id
  OR NEW.source_url IS NOT OLD.source_url
  OR NEW.created_at_utc IS NOT OLD.created_at_utc
  OR NEW.updated_at_utc < OLD.updated_at_utc
  OR NEW.revision < OLD.revision
BEGIN
  SELECT RAISE(ABORT, 'news_week_ahead_issue_invalid_update');
END;

CREATE TRIGGER news_week_ahead_issues_no_delete
BEFORE DELETE ON news_week_ahead_issues BEGIN
  SELECT RAISE(ABORT, 'news_week_ahead_issue_history_required');
END;

CREATE TRIGGER news_week_ahead_issue_versions_no_update
BEFORE UPDATE ON news_week_ahead_issue_versions BEGIN
  SELECT RAISE(ABORT, 'news_week_ahead_issue_version_immutable');
END;

CREATE TRIGGER news_week_ahead_issue_versions_no_delete
BEFORE DELETE ON news_week_ahead_issue_versions BEGIN
  SELECT RAISE(ABORT, 'news_week_ahead_issue_version_history_required');
END;`;

export const newsWeekAheadMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "news",
  migrationId: "0079_news_week_ahead",
  executionOrder: 79,
  statements: Object.freeze([sql]),
});
