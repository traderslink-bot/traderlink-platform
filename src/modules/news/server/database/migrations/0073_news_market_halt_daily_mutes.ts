import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const sql = `ALTER TABLE news_market_halt_muted_tickers ADD COLUMN expires_at_utc TEXT;

CREATE INDEX news_market_halt_muted_ticker_expiry
  ON news_market_halt_muted_tickers(user_id, ticker, expires_at_utc);`;

export const newsMarketHaltDailyMutesMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "news",
  migrationId: "0073_news_market_halt_daily_mutes",
  executionOrder: 73,
  statements: Object.freeze([sql]),
});
