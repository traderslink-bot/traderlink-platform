import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const uuid = (column: string) => `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column},9,1)='-' AND substr(${column},14,1)='-' AND substr(${column},19,1)='-' AND substr(${column},24,1)='-')`;
const utc = (column: string) => `CHECK (length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;

export const traderLinkCommunitiesServerWatchlistsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community",
  migrationId: "0124_traderlink_communities_server_watchlists",
  executionOrder: 124,
  statements: Object.freeze([`CREATE TABLE traderlink_community_server_watchlists (
  watchlist_id TEXT PRIMARY KEY ${uuid("watchlist_id")},
  community_id TEXT NOT NULL ${uuid("community_id")},
  author_user_id TEXT NOT NULL ${uuid("author_user_id")},
  title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120),
  description TEXT NOT NULL DEFAULT '' CHECK(length(description) <= 1200),
  status TEXT NOT NULL CHECK(status IN ('draft','published','archived')),
  network_visibility TEXT NOT NULL DEFAULT 'private' CHECK(network_visibility IN ('private','network_eligible','public')),
  published_at_utc TEXT,
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
  UNIQUE(watchlist_id,community_id),
  FOREIGN KEY(community_id) REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT,
  FOREIGN KEY(author_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX traderlink_community_server_watchlists_feed
  ON traderlink_community_server_watchlists(community_id,status,published_at_utc DESC);
CREATE TABLE traderlink_community_server_watchlist_symbols (
  watchlist_id TEXT NOT NULL ${uuid("watchlist_id")},
  community_id TEXT NOT NULL ${uuid("community_id")},
  symbol TEXT NOT NULL CHECK(length(symbol) BETWEEN 1 AND 15 AND symbol=upper(symbol) AND symbol NOT GLOB '*[^A-Z0-9.-]*'),
  ordinal INTEGER NOT NULL CHECK(ordinal BETWEEN 0 AND 999),
  note TEXT NOT NULL DEFAULT '' CHECK(length(note) <= 1200),
  PRIMARY KEY(watchlist_id,symbol),
  UNIQUE(watchlist_id,ordinal),
  FOREIGN KEY(watchlist_id,community_id) REFERENCES traderlink_community_server_watchlists(watchlist_id,community_id) ON DELETE CASCADE
) STRICT, WITHOUT ROWID;
CREATE TABLE traderlink_community_network_settings (
  community_id TEXT PRIMARY KEY ${uuid("community_id")},
  participation_status TEXT NOT NULL DEFAULT 'private' CHECK(participation_status IN ('private','opted_in','paused')),
  updated_by_user_id TEXT NOT NULL ${uuid("updated_by_user_id")},
  updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
  FOREIGN KEY(community_id) REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT
) STRICT;
CREATE UNIQUE INDEX traderlink_community_content_deliveries_one_object_destination
  ON traderlink_community_content_deliveries(community_id,object_type,object_id,destination_id);`]),
});
