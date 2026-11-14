import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function utcCheck(column: string): string {
  return `CHECK (length(${column}) = 24 AND ${column} GLOB
    '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

const sql = `CREATE TABLE level_analysis_market_session_sets_replacement (
  market_session_set_id TEXT PRIMARY KEY ${uuidCheck("market_session_set_id")},
  provider_key TEXT NOT NULL CHECK (provider_key IN ('yahoo_chart', 'moomoo_history_kline', 'alpaca_sip_raw')),
  provider_adapter_version TEXT NOT NULL CHECK (
    (provider_key = 'yahoo_chart' AND provider_adapter_version = 'yahoo_chart_v1') OR
    (provider_key = 'moomoo_history_kline' AND provider_adapter_version = 'moomoo_history_kline_v1') OR
    (provider_key = 'alpaca_sip_raw' AND provider_adapter_version = 'alpaca_sip_raw_v1')
  ),
  provider_symbol TEXT NOT NULL CHECK (length(provider_symbol) BETWEEN 1 AND 16 AND provider_symbol = upper(trim(provider_symbol)) AND provider_symbol NOT GLOB '*[^A-Z0-9.-]*'),
  exchange_identity TEXT NOT NULL CHECK (length(exchange_identity) BETWEEN 1 AND 64 AND exchange_identity = lower(trim(exchange_identity)) AND exchange_identity NOT GLOB '*[^a-z0-9_-]*'),
  trading_date_new_york TEXT NOT NULL CHECK (length(trading_date_new_york) = 10 AND trading_date_new_york GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  interval TEXT NOT NULL CHECK (interval = '1m'),
  session_policy TEXT NOT NULL CHECK (session_policy = 'america_new_york_extended_0400_2000_v1'),
  current_version_id TEXT ${uuidCheck("current_version_id")},
  current_coverage_end_utc TEXT ${utcCheck("current_coverage_end_utc")},
  current_status TEXT NOT NULL CHECK (current_status IN ('queued', 'ready', 'no_coverage', 'provider_unavailable')),
  lease_expires_at_utc TEXT ${utcCheck("lease_expires_at_utc")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (provider_key, provider_adapter_version, provider_symbol, exchange_identity, trading_date_new_york, interval, session_policy)
) STRICT;
INSERT INTO level_analysis_market_session_sets_replacement SELECT * FROM level_analysis_market_session_sets;
DROP TABLE level_analysis_market_session_sets;
ALTER TABLE level_analysis_market_session_sets_replacement RENAME TO level_analysis_market_session_sets;
CREATE INDEX level_analysis_market_session_sets_work ON level_analysis_market_session_sets(current_status, lease_expires_at_utc, updated_at_utc);
CREATE TRIGGER level_analysis_market_session_sets_no_delete BEFORE DELETE ON level_analysis_market_session_sets
BEGIN SELECT RAISE(ABORT, 'level_analysis_market_session_history_required'); END;
ALTER TABLE level_analysis_logical_trade_jobs ADD COLUMN post_session_refresh INTEGER NOT NULL DEFAULT 0
CHECK (post_session_refresh IN (0, 1));`;

export const dailyTradeAnalyzerAlpacaCacheMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "level_analysis",
  migrationId: "0186_daily_trade_analyzer_alpaca_cache",
  executionOrder: 223,
  requiresForeignKeysDisabled: true,
  statements: Object.freeze([sql]),
});
