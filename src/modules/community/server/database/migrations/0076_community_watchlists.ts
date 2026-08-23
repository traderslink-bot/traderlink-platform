import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (
    length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]'
  )`;
}

function utcCheck(column: string, nullable = false): string {
  const value = `length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'`;
  return `CHECK (${nullable ? `${column} IS NULL OR (` : "("}${value}${nullable ? ")" : ")"})`;
}

const sql = `CREATE TABLE community_profiles (
  user_id TEXT PRIMARY KEY ${uuidCheck("user_id")},
  handle TEXT NOT NULL UNIQUE CHECK (
    length(handle) BETWEEN 3 AND 48
    AND handle NOT GLOB '*[^a-z0-9-]*'
    AND substr(handle, 1, 1) <> '-' AND substr(handle, -1, 1) <> '-'
  ),
  profile_tags_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(profile_tags_json)),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE community_watchlists (
  watchlist_id TEXT PRIMARY KEY ${uuidCheck("watchlist_id")},
  owner_user_id TEXT NOT NULL ${uuidCheck("owner_user_id")},
  slug TEXT NOT NULL CHECK (
    length(slug) BETWEEN 3 AND 80
    AND slug NOT GLOB '*[^a-z0-9-]*'
    AND substr(slug, 1, 1) <> '-' AND substr(slug, -1, 1) <> '-'
  ),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120 AND instr(title, char(0)) = 0),
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 600 AND instr(description, char(0)) = 0),
  tags_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags_json)),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  published_at_utc TEXT ${utcCheck("published_at_utc", true)},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK ((status = 'draft' AND published_at_utc IS NULL) OR (status = 'published' AND published_at_utc IS NOT NULL)),
  UNIQUE (owner_user_id, slug),
  FOREIGN KEY (owner_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX community_watchlists_owner_status
  ON community_watchlists(owner_user_id, status, updated_at_utc DESC);
CREATE INDEX community_watchlists_published
  ON community_watchlists(status, published_at_utc DESC);

CREATE TABLE community_watchlist_tickers (
  ticker_id TEXT PRIMARY KEY ${uuidCheck("ticker_id")},
  watchlist_id TEXT NOT NULL ${uuidCheck("watchlist_id")},
  symbol TEXT NOT NULL CHECK (
    length(symbol) BETWEEN 1 AND 15 AND symbol = upper(symbol)
    AND symbol NOT GLOB '*[^A-Z0-9.-]*'
  ),
  ordinal INTEGER NOT NULL CHECK (ordinal BETWEEN 0 AND 999),
  tags_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags_json)),
  why_watching TEXT NOT NULL DEFAULT '' CHECK (length(why_watching) <= 1200 AND instr(why_watching, char(0)) = 0),
  plan TEXT NOT NULL DEFAULT '' CHECK (length(plan) <= 1200 AND instr(plan, char(0)) = 0),
  personal_target TEXT NOT NULL DEFAULT '' CHECK (length(personal_target) <= 100 AND instr(personal_target, char(0)) = 0),
  catalyst TEXT NOT NULL DEFAULT '' CHECK (length(catalyst) <= 300 AND instr(catalyst, char(0)) = 0),
  catalyst_date TEXT CHECK (catalyst_date IS NULL OR catalyst_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  posted_reference_price TEXT NOT NULL DEFAULT '' CHECK (length(posted_reference_price) <= 100 AND instr(posted_reference_price, char(0)) = 0),
  posted_at_utc TEXT NOT NULL ${utcCheck("posted_at_utc")},
  UNIQUE (watchlist_id, symbol),
  UNIQUE (watchlist_id, ordinal),
  FOREIGN KEY (watchlist_id) REFERENCES community_watchlists(watchlist_id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) STRICT;

CREATE TABLE community_watchlist_publications (
  publication_id TEXT PRIMARY KEY ${uuidCheck("publication_id")},
  watchlist_id TEXT NOT NULL ${uuidCheck("watchlist_id")},
  owner_user_id TEXT NOT NULL ${uuidCheck("owner_user_id")},
  profile_handle TEXT NOT NULL CHECK (length(profile_handle) BETWEEN 3 AND 48),
  watchlist_slug TEXT NOT NULL CHECK (length(watchlist_slug) BETWEEN 3 AND 80),
  watchlist_title TEXT NOT NULL CHECK (length(watchlist_title) BETWEEN 1 AND 120),
  symbol_count INTEGER NOT NULL CHECK (symbol_count BETWEEN 1 AND 999),
  discord_requested INTEGER NOT NULL CHECK (discord_requested IN (0, 1)),
  discord_state TEXT NOT NULL CHECK (discord_state IN ('not_requested', 'pending', 'sending', 'delivered', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 10),
  last_attempt_at_utc TEXT ${utcCheck("last_attempt_at_utc", true)},
  delivered_at_utc TEXT ${utcCheck("delivered_at_utc", true)},
  failure_code TEXT CHECK (failure_code IS NULL OR (length(failure_code) BETWEEN 1 AND 64 AND failure_code NOT GLOB '*[^a-z0-9_]*')),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  UNIQUE (watchlist_id),
  FOREIGN KEY (watchlist_id) REFERENCES community_watchlists(watchlist_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (owner_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX community_watchlist_publications_delivery
  ON community_watchlist_publications(discord_state, created_at_utc)
  WHERE discord_state IN ('pending', 'sending');`;

export const communityWatchlistsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community",
  migrationId: "0076_community_watchlists",
  executionOrder: 76,
  statements: Object.freeze([sql]),
});
