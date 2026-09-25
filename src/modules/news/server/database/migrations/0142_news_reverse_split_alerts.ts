import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const sql = `CREATE TABLE news_reverse_split_sources (
  source_url TEXT PRIMARY KEY,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('nasdaq', 'sec')),
  source_json TEXT NOT NULL CHECK (json_valid(source_json)),
  published_date TEXT NOT NULL CHECK (length(published_date) = 10),
  state TEXT NOT NULL CHECK (state IN ('pending', 'fetching', 'parsed', 'ignored', 'deferred', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  content_hash TEXT,
  body_gzip BLOB,
  parser_version TEXT,
  outcome_code TEXT,
  fetched_at_utc TEXT,
  next_attempt_at_utc TEXT NOT NULL CHECK (length(next_attempt_at_utc) = 24),
  lease_token TEXT,
  lease_until_utc TEXT,
  created_at_utc TEXT NOT NULL CHECK (length(created_at_utc) = 24),
  updated_at_utc TEXT NOT NULL CHECK (length(updated_at_utc) = 24)
) STRICT;
CREATE INDEX news_reverse_split_source_queue
  ON news_reverse_split_sources(next_attempt_at_utc, published_date);

CREATE TABLE news_reverse_split_events (
  observation_id TEXT PRIMARY KEY CHECK (length(observation_id) = 64),
  source_url TEXT NOT NULL REFERENCES news_reverse_split_sources(source_url) ON UPDATE RESTRICT ON DELETE RESTRICT,
  content_hash TEXT NOT NULL CHECK (length(content_hash) = 64),
  parser_version TEXT NOT NULL,
  ticker TEXT NOT NULL CHECK (length(ticker) BETWEEN 1 AND 4),
  status TEXT NOT NULL CHECK (status IN ('approved', 'announced', 'confirmed', 'postponed', 'cancelled')),
  approval_date TEXT,
  effective_date TEXT,
  event_json TEXT NOT NULL CHECK (json_valid(event_json)),
  source_body_gzip BLOB NOT NULL,
  observed_at_utc TEXT NOT NULL CHECK (length(observed_at_utc) = 24),
  UNIQUE (source_url, content_hash, parser_version)
) STRICT;
CREATE INDEX news_reverse_split_event_ticker ON news_reverse_split_events(ticker, observed_at_utc);
CREATE INDEX news_reverse_split_event_date ON news_reverse_split_events(effective_date, ticker);

CREATE TABLE news_reverse_split_discord_deliveries (
  delivery_id TEXT PRIMARY KEY CHECK (length(delivery_id) = 64),
  channel_id TEXT NOT NULL CHECK (length(channel_id) BETWEEN 1 AND 32 AND channel_id NOT GLOB '*[^0-9]*'),
  digest_date TEXT NOT NULL CHECK (length(digest_date) = 10),
  revision INTEGER NOT NULL CHECK (revision >= 0),
  part_index INTEGER NOT NULL CHECK (part_index >= 0),
  event_signature TEXT NOT NULL CHECK (length(event_signature) = 64),
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
  state TEXT NOT NULL CHECK (state IN ('pending', 'sending', 'uncertain', 'delivered', 'failed', 'expired')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  available_at_utc TEXT NOT NULL CHECK (length(available_at_utc) = 24),
  expires_at_utc TEXT NOT NULL CHECK (length(expires_at_utc) = 24),
  lease_token TEXT,
  lease_until_utc TEXT,
  discord_message_id TEXT,
  failure_code TEXT,
  created_at_utc TEXT NOT NULL CHECK (length(created_at_utc) = 24),
  updated_at_utc TEXT NOT NULL CHECK (length(updated_at_utc) = 24),
  UNIQUE (channel_id, digest_date, revision, part_index)
) STRICT;
CREATE INDEX news_reverse_split_discord_queue
  ON news_reverse_split_discord_deliveries(channel_id, state, available_at_utc);

CREATE TABLE news_reverse_split_runtime (
  runtime_key TEXT PRIMARY KEY,
  state_json TEXT NOT NULL CHECK (json_valid(state_json)),
  lease_token TEXT,
  lease_until_utc TEXT,
  updated_at_utc TEXT NOT NULL CHECK (length(updated_at_utc) = 24)
) STRICT;`;

export const newsReverseSplitAlertsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "news",
  migrationId: "0142_news_reverse_split_alerts",
  executionOrder: 142,
  statements: Object.freeze([sql]),
});
