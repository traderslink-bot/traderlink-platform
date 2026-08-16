import "server-only";

import type Database from "better-sqlite3";

import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

const TRADING_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

type TradingDayRow = Readonly<{ trading_day_id: string }>;

function activeTradingDay(
  database: Database.Database,
  scope: AccountScope,
  tradingDate: string,
): TradingDayRow | undefined {
  return database.prepare<[string, string, string], TradingDayRow>(`SELECT trading_day_id
FROM journal_trading_days
WHERE workspace_id = ? AND account_id = ? AND trading_date = ?
  AND status = 'active'
ORDER BY trading_timezone COLLATE BINARY, trading_day_id
LIMIT 1`).get(scope.workspaceId, scope.accountId, tradingDate);
}

export function ensureJournalTradingDay(
  database: Database.Database,
  scope: AccountScope,
  tradingDate: string,
  timestamp: string,
): string {
  if (!TRADING_DATE_PATTERN.test(tradingDate)) {
    platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID");
  }
  const existing = activeTradingDay(database, scope, tradingDate);
  if (existing) return existing.trading_day_id;

  const account = database.prepare<
    [string, string],
    { trading_timezone: string }
  >(`SELECT trading_timezone
FROM journal_accounts
WHERE workspace_id = ? AND account_id = ? AND status = 'active'`)
    .get(scope.workspaceId, scope.accountId);
  if (!account) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");

  database.prepare(`INSERT INTO journal_trading_days (
  trading_day_id, workspace_id, account_id, trading_date, trading_timezone,
  status, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
ON CONFLICT(workspace_id, account_id, trading_date, trading_timezone)
DO UPDATE SET status = 'active', updated_at_utc = CASE
  WHEN journal_trading_days.updated_at_utc > excluded.updated_at_utc
    THEN journal_trading_days.updated_at_utc
  ELSE excluded.updated_at_utc
END`).run(
    createCanonicalUuidV4(),
    scope.workspaceId,
    scope.accountId,
    tradingDate,
    account.trading_timezone,
    timestamp,
    timestamp,
  );

  const created = activeTradingDay(database, scope, tradingDate);
  if (!created) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
  return created.trading_day_id;
}
