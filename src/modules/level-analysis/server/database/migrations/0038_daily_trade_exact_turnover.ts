import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const sql = `ALTER TABLE level_analysis_market_session_candles
ADD COLUMN turnover_decimal TEXT
CHECK (
  turnover_decimal IS NULL OR (
    length(turnover_decimal) BETWEEN 1 AND 128
    AND turnover_decimal NOT GLOB '*[^0-9.]*'
    AND substr(turnover_decimal, -1, 1) <> '.'
    AND turnover_decimal <> ''
    AND (length(turnover_decimal) - length(replace(turnover_decimal, '.', ''))) <= 1
  )
);`;

export const dailyTradeExactTurnoverMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "level_analysis",
  migrationId: "0038_daily_trade_exact_turnover",
  executionOrder: 38,
  statements: Object.freeze([sql]),
});
