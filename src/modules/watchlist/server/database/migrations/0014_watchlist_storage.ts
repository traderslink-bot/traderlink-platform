import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const sql = `CREATE TABLE live_watchlist_symbols (
  symbol TEXT PRIMARY KEY CHECK (
    length(symbol) BETWEEN 1 AND 64
    AND symbol = upper(symbol)
    AND instr(symbol, char(0)) = 0
  ),
  status TEXT NOT NULL CHECK (status IN ('live', 'stale', 'deactivated')),
  updated_at INTEGER NOT NULL CHECK (updated_at >= 0),
  state_json TEXT NOT NULL CHECK (json_valid(state_json)),
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0)
) STRICT;

CREATE TABLE live_watchlist_health (
  key TEXT PRIMARY KEY CHECK (key = 'global'),
  market_data_status TEXT NOT NULL CHECK (
    market_data_status IN ('live', 'stale', 'offline', 'starting', 'closed')
  ),
  market_data_updated_at INTEGER CHECK (
    market_data_updated_at IS NULL OR market_data_updated_at >= 0
  )
) STRICT;

CREATE TABLE live_watchlist_archives (
  archive_id TEXT PRIMARY KEY CHECK (
    length(archive_id) BETWEEN 3 AND 128
    AND archive_id = upper(archive_id)
    AND instr(archive_id, char(0)) = 0
  ),
  symbol TEXT NOT NULL CHECK (
    length(symbol) BETWEEN 1 AND 64
    AND symbol = upper(symbol)
    AND instr(symbol, char(0)) = 0
  ),
  archived_at INTEGER NOT NULL CHECK (archived_at >= 0),
  first_posted_at INTEGER CHECK (first_posted_at IS NULL OR first_posted_at >= 0),
  last_active_updated_at INTEGER NOT NULL CHECK (last_active_updated_at >= 0),
  state_json TEXT NOT NULL CHECK (json_valid(state_json)),
  CHECK (last_active_updated_at <= archived_at)
) STRICT;

CREATE INDEX live_watchlist_archives_symbol_archived_at_idx
  ON live_watchlist_archives(symbol, archived_at DESC);

CREATE TRIGGER live_watchlist_archives_no_update
BEFORE UPDATE ON live_watchlist_archives BEGIN
  SELECT RAISE(ABORT, 'live_watchlist_archive_immutable');
END`;

export const watchlistStorageMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "watchlist",
  migrationId: "0014_watchlist_storage",
  executionOrder: 14,
  statements: Object.freeze([sql]),
});
