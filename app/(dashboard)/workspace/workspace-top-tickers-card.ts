import Decimal from "decimal.js";
import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

export type WorkspaceTopTickersCard = Readonly<{
  highestBuyValue: string | null;
  mostProfitable: string | null;
  mostTraded: string | null;
}>;

type TradeRow = Readonly<{
  gross_pnl_decimal: string | null;
  logical_trade_key: string;
  net_pnl_decimal: string | null;
  symbol: string;
}>;

type BuyRow = Readonly<{
  price_decimal: string;
  quantity_decimal: string;
  symbol: string;
}>;

function dateClause(alias: string, startDate: string | null, endDate: string | null): Readonly<{
  sql: string;
  values: readonly string[];
}> {
  const clauses: string[] = [];
  const values: string[] = [];
  if (startDate) { clauses.push(`${alias}.activity_local_date >= ?`); values.push(startDate); }
  if (endDate) { clauses.push(`${alias}.activity_local_date <= ?`); values.push(endDate); }
  return Object.freeze({ sql: clauses.length ? ` AND ${clauses.join(" AND ")}` : "", values: Object.freeze(values) });
}

function highest(entries: ReadonlyMap<string, Decimal>): string | null {
  return [...entries.entries()].sort(([leftSymbol, left], [rightSymbol, right]) =>
    right.comparedTo(left) || leftSymbol.localeCompare(rightSymbol))[0]?.[0] ?? null;
}

export function readWorkspaceTopTickersCard(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  input: Readonly<{ endDate: string | null; moneyBasis: "gross" | "net"; startDate: string | null }>,
): WorkspaceTopTickersCard {
  if (!scope.activeAccountId) return Object.freeze({ highestBuyValue: null, mostProfitable: null, mostTraded: null });
  const dates = dateClause("projection", input.startDate, input.endDate);
  const tradeRows = database.prepare(`SELECT instrument.normalized_symbol AS symbol,
 coalesce(membership.logical_trade_id, projection.round_trip_id) AS logical_trade_key,
 projection.gross_pnl_decimal, projection.net_pnl_decimal
FROM journal_workspace_trade_library_projections projection
JOIN journal_round_trip_versions version
  ON version.workspace_id = projection.workspace_id
 AND version.account_id = projection.account_id
 AND version.round_trip_version_id = projection.round_trip_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
LEFT JOIN journal_active_logical_trade_memberships membership
  ON membership.workspace_id = projection.workspace_id
 AND membership.account_id = projection.account_id
 AND membership.round_trip_id = projection.round_trip_id
WHERE projection.workspace_id = ? AND projection.account_id = ?${dates.sql}`).all(
    scope.workspaceId, scope.activeAccountId, ...dates.values,
  ) as readonly TradeRow[];

  const tradesByTicker = new Map<string, Set<string>>();
  const profitByTicker = new Map<string, Decimal>();
  for (const row of tradeRows) {
    const trades = tradesByTicker.get(row.symbol) ?? new Set<string>();
    trades.add(row.logical_trade_key);
    tradesByTicker.set(row.symbol, trades);
    const pnl = input.moneyBasis === "net" ? row.net_pnl_decimal : row.gross_pnl_decimal;
    if (pnl !== null) profitByTicker.set(row.symbol, (profitByTicker.get(row.symbol) ?? new Decimal(0)).plus(pnl));
  }

  const buyRows = database.prepare(`SELECT instrument.normalized_symbol AS symbol,
 allocation.quantity_decimal, execution.price_decimal
FROM journal_workspace_trade_library_projections projection
JOIN journal_round_trip_execution_allocations allocation
  ON allocation.workspace_id = projection.workspace_id
 AND allocation.account_id = projection.account_id
 AND allocation.round_trip_version_id = projection.round_trip_version_id
JOIN journal_execution_versions execution
  ON execution.workspace_id = allocation.workspace_id
 AND execution.account_id = allocation.account_id
 AND execution.execution_version_id = allocation.execution_version_id
JOIN journal_round_trip_versions version
  ON version.workspace_id = projection.workspace_id
 AND version.account_id = projection.account_id
 AND version.round_trip_version_id = projection.round_trip_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
WHERE projection.workspace_id = ? AND projection.account_id = ?
 AND execution.side = 'buy'${dates.sql}`).all(
    scope.workspaceId, scope.activeAccountId, ...dates.values,
  ) as readonly BuyRow[];
  const buyValueByTicker = new Map<string, Decimal>();
  for (const row of buyRows) {
    const value = new Decimal(row.quantity_decimal).mul(row.price_decimal);
    buyValueByTicker.set(row.symbol, (buyValueByTicker.get(row.symbol) ?? new Decimal(0)).plus(value));
  }

  const tradeCounts = new Map([...tradesByTicker].map(([symbol, trades]) => [symbol, new Decimal(trades.size)]));
  return Object.freeze({
    highestBuyValue: highest(buyValueByTicker),
    mostProfitable: highest(profitByTicker),
    mostTraded: highest(tradeCounts),
  });
}
