import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

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

const sql = `CREATE TABLE news_articles (
  id TEXT PRIMARY KEY CHECK (
    length(id) BETWEEN 1 AND 64 AND instr(id, char(0)) = 0
  ),
  source_event_id TEXT UNIQUE CHECK (
    source_event_id IS NULL OR (
      length(source_event_id) BETWEEN 1 AND 255
      AND instr(source_event_id, char(0)) = 0
    )
  ),
  canonical_source_key TEXT UNIQUE CHECK (
    canonical_source_key IS NULL OR (
      length(canonical_source_key) BETWEEN 1 AND 2048
      AND instr(canonical_source_key, char(0)) = 0
    )
  ),
  ticker TEXT NOT NULL CHECK (
    length(ticker) BETWEEN 1 AND 32
    AND ticker = upper(ticker)
    AND instr(ticker, char(0)) = 0
  ),
  slug TEXT NOT NULL CHECK (
    length(slug) BETWEEN 1 AND 128 AND instr(slug, char(0)) = 0
  ),
  headline TEXT NOT NULL CHECK (
    length(headline) BETWEEN 1 AND 1000 AND instr(headline, char(0)) = 0
  ),
  summary TEXT,
  article_text TEXT,
  source_url TEXT,
  event_type TEXT,
  route_tag TEXT,
  published_at TEXT NOT NULL ${utcCheck("published_at")},
  created_at TEXT NOT NULL ${utcCheck("created_at")},
  updated_at TEXT NOT NULL ${utcCheck("updated_at")},
  metadata_json TEXT NOT NULL CHECK (json_valid(metadata_json)),
  positives_json TEXT NOT NULL CHECK (json_valid(positives_json)),
  negatives_json TEXT NOT NULL CHECK (json_valid(negatives_json)),
  risk_flags_json TEXT NOT NULL CHECK (json_valid(risk_flags_json)),
  diagnostics_json TEXT NOT NULL CHECK (json_valid(diagnostics_json)),
  raw_payload_json TEXT NOT NULL CHECK (json_valid(raw_payload_json)),
  revision INTEGER NOT NULL CHECK (revision >= 1),
  content_sha256 TEXT NOT NULL ${sha256Check("content_sha256")},
  CHECK (updated_at >= created_at),
  UNIQUE (ticker, slug)
) STRICT;

CREATE INDEX news_articles_ticker_published_idx
  ON news_articles(ticker, published_at DESC, id);

CREATE TABLE news_article_versions (
  version_id TEXT PRIMARY KEY ${sha256Check("version_id")},
  article_id TEXT NOT NULL CHECK (
    length(article_id) BETWEEN 1 AND 64 AND instr(article_id, char(0)) = 0
  ),
  revision INTEGER NOT NULL CHECK (revision >= 1),
  source_event_id TEXT,
  canonical_source_key TEXT,
  ticker TEXT NOT NULL,
  slug TEXT NOT NULL,
  headline TEXT NOT NULL,
  summary TEXT,
  article_text TEXT,
  source_url TEXT,
  event_type TEXT,
  route_tag TEXT,
  published_at TEXT NOT NULL ${utcCheck("published_at")},
  created_at TEXT NOT NULL ${utcCheck("created_at")},
  changed_at TEXT NOT NULL ${utcCheck("changed_at")},
  metadata_json TEXT NOT NULL CHECK (json_valid(metadata_json)),
  positives_json TEXT NOT NULL CHECK (json_valid(positives_json)),
  negatives_json TEXT NOT NULL CHECK (json_valid(negatives_json)),
  risk_flags_json TEXT NOT NULL CHECK (json_valid(risk_flags_json)),
  diagnostics_json TEXT NOT NULL CHECK (json_valid(diagnostics_json)),
  raw_payload_json TEXT NOT NULL CHECK (json_valid(raw_payload_json)),
  content_sha256 TEXT NOT NULL ${sha256Check("content_sha256")},
  change_source TEXT NOT NULL CHECK (
    length(change_source) BETWEEN 1 AND 64
    AND change_source = lower(change_source)
    AND change_source NOT GLOB '*[^a-z0-9_-]*'
  ),
  UNIQUE (article_id, revision),
  FOREIGN KEY (article_id) REFERENCES news_articles(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX news_article_versions_article_revision_idx
  ON news_article_versions(article_id, revision DESC);

CREATE TRIGGER news_article_versions_no_update
BEFORE UPDATE ON news_article_versions BEGIN
  SELECT RAISE(ABORT, 'news_article_version_immutable');
END;

CREATE TRIGGER news_article_versions_no_delete
BEFORE DELETE ON news_article_versions BEGIN
  SELECT RAISE(ABORT, 'news_article_version_immutable');
END`;

export const newsContentMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "news",
  migrationId: "0015_news_content",
  executionOrder: 15,
  statements: Object.freeze([sql]),
});
