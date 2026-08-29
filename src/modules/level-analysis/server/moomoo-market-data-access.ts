import "server-only";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  MoomooConnectionRepository,
  type MoomooConnectionRecord,
} from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";

export type MoomooMarketDataAccess = Readonly<{
  hasActiveMarketDataConnection: boolean;
  hasActiveTradeAnalyzerPlan: boolean;
  shouldShowConnectionGuidance: boolean;
}>;

export function isMoomooMarketDataReady(
  connection: Pick<MoomooConnectionRecord, "authorizedScopes" | "state"> | null,
): boolean {
  return connection?.state === "active" &&
    connection.authorizedScopes.includes("quote:read");
}

function hasTradeAnalyzerEntitlementTable(database: Database.Database): boolean {
  return Boolean(database.prepare<[], Readonly<{ found: number }>>(
    "SELECT 1 AS found FROM sqlite_schema WHERE type = 'table' AND name = 'journal_trade_analyzer_entitlement_intervals'",
  ).get());
}

function hasActiveTradeAnalyzerPlan(
  database: Database.Database,
  scope: WorkspaceAccessScope,
): boolean {
  if (!hasTradeAnalyzerEntitlementTable(database)) return false;
  return Boolean(database.prepare<[string, string], Readonly<{ found: number }>>(
    `SELECT 1 AS found
FROM journal_trade_analyzer_entitlement_intervals
WHERE user_id = ? AND workspace_id = ? AND interval_state = 'active'
LIMIT 1`,
  ).get(scope.userId, scope.workspaceId));
}

export function readMoomooMarketDataAccess(
  database: Database.Database,
  scope: WorkspaceAccessScope,
): MoomooMarketDataAccess {
  const connection = new MoomooConnectionRepository(database).find(scope);
  const hasActiveMarketDataConnection = isMoomooMarketDataReady(connection);
  const activePlan = hasActiveTradeAnalyzerPlan(database, scope);
  return Object.freeze({
    hasActiveMarketDataConnection,
    hasActiveTradeAnalyzerPlan: activePlan,
    shouldShowConnectionGuidance: activePlan && !hasActiveMarketDataConnection,
  });
}
