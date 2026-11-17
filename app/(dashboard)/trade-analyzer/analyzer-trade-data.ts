import "server-only";

import type Database from "better-sqlite3";

import { isSameAnalyzerMarketDay } from "@/src/modules/level-analysis/contracts/shared-analyzer-beta-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  readWorkspaceTradeLibrarySavedTrades,
  type WorkspaceTradeLibraryRow,
} from "../workspace/workspace-trade-library";
import type { AnalyzerTrade } from "./analyzer-trade";

export function toAnalyzerTrade(row: WorkspaceTradeLibraryRow): AnalyzerTrade {
  return {
    id: row.roundTripId,
    symbol: row.symbol,
    direction: row.direction,
    currency: row.tradeCurrency,
    entryDate: row.entryDate,
    entryTime: row.entryTime,
    closed: row.status === "Closed" || row.status === "Closed swing",
    canAnalyze: row.status === "Closed" && row.tradeStyle !== "swing" && row.closedAtUtc !== null &&
      isSameAnalyzerMarketDay(row.openedAtUtc, row.closedAtUtc),
    executions: row.editableExecutions.map(({ localDate, localTime, sourceTimezone, side, quantity, price }) => ({
      localDate, localTime, sourceTimezone, side, quantity, price,
    })),
  };
}

export function readAnalyzerTrade(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  tradeId: string,
): AnalyzerTrade | null {
  const target = database.prepare(`
    SELECT round_trip_id AS roundTripId, current_version_id AS roundTripVersionId
    FROM journal_round_trips
    WHERE workspace_id = ? AND account_id = ? AND round_trip_id = ?
  `).get(scope.workspaceId, scope.activeAccountId, tradeId) as
    { roundTripId: string; roundTripVersionId: string } | undefined;
  if (!target) return null;
  const row = readWorkspaceTradeLibrarySavedTrades(database, scope, [target])[0];
  return row ? toAnalyzerTrade(row) : null;
}
