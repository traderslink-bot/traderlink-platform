import type { PlatformMigration } from "../platform-migration-contract";

export const platformWatchlistPremiumAnalysisAccessMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0155_platform_watchlist_premium_analysis_access",
  executionOrder: 155,
  statements: Object.freeze([`
CREATE TABLE platform_watchlist_analysis_visibility (
 symbol TEXT PRIMARY KEY,
 premium_only INTEGER NOT NULL CHECK(premium_only IN (0,1)),
 updated_at_utc TEXT NOT NULL,
 updated_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id)
) STRICT;
CREATE TABLE platform_watchlist_analysis_visibility_audit (
 audit_id INTEGER PRIMARY KEY,
 symbol TEXT NOT NULL,
 previous_premium_only INTEGER NOT NULL CHECK(previous_premium_only IN (0,1)),
 premium_only INTEGER NOT NULL CHECK(premium_only IN (0,1)),
 changed_at_utc TEXT NOT NULL,
 actor_user_id TEXT NOT NULL REFERENCES platform_users(user_id)
) STRICT;
CREATE INDEX platform_watchlist_analysis_visibility_audit_symbol ON platform_watchlist_analysis_visibility_audit(symbol,audit_id);
`]),
});
