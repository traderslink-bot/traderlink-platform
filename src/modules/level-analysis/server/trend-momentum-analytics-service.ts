import Decimal from "decimal.js";
import type Database from "better-sqlite3";
import type { JournalAnalyticsRoundTripTableRow } from "../../journal-analytics/contracts/analytics-result";
import { JournalLogicalTradeRepository } from "../../journal/server/logical-trades/journal-logical-trade-repository";
import type { WorkspaceAccessScope } from "../../platform/contracts/workspace-access-scope";
import { buildTrendMomentumProjection, type TrendMomentumTrade } from "../../../lib/trade-candle-analysis/trend-momentum-analytics";
import { LogicalTradeAnalyzerRepository } from "./logical-trade-analyzer-repository";

/** Read-only saved evidence; opening an analysis page never requests market data. */
export function readTrendMomentumAnalytics(input: Readonly<{
  database: Database.Database;
  scope: WorkspaceAccessScope;
  journalRows: readonly JournalAnalyticsRoundTripTableRow[];
  startDate: string | null;
  endDate: string | null;
}>) {
  const { database, scope } = input;
  const accountId = scope.activeAccountId;
  if (!accountId || !scope.allowedAccountIds.includes(accountId)) throw new Error("Indicator account is unavailable");
  const accountScope = { accountId, userId: scope.userId, workspaceId: scope.workspaceId, workspaceRole: scope.workspaceRole };
  const rows = new Map(input.journalRows.map((row) => [row.roundTripId, row]));
  const analyzer = new LogicalTradeAnalyzerRepository(database);
  const trades: TrendMomentumTrade[] = [];
  for (const trade of new JournalLogicalTradeRepository(database).list(accountScope)) {
    if (trade.tradeStyle !== "day" || trade.lifecycleState !== "active") continue;
    const first = rows.get(trade.members[0]?.roundTripId ?? "");
    const last = rows.get(trade.members.at(-1)?.roundTripId ?? "");
    if (!first || !last || (input.startDate && last.closeLocalDate < input.startDate) ||
      (input.endDate && last.closeLocalDate > input.endDate)) continue;
    const members = trade.members.map((member) => rows.get(member.roundTripId));
    // A partial reporting population must not become a partial logical trade.
    if (members.some((member) => !member)) continue;
    const pnl = members.every((member) => member!.selectedPnlDecimal !== null)
      ? members.reduce((sum, member) => sum.plus(member!.selectedPnlDecimal!), new Decimal(0)).toFixed() : null;
    const saved = trade.logicalTradeId ? analyzer.readCurrentByRoundTrip(accountScope, first.roundTripId) : null;
    trades.push({ tradeId: trade.logicalTradeId ?? first.roundTripId, representativeRoundTripId: first.roundTripId,
      symbol: first.displayedSymbol, direction: trade.direction, closeDate: last.closeLocalDate,
      trackerDate: first.entryLocalDate, pnlDecimal: pnl, analysis: saved?.status === "ready" ? saved.analyzed : null });
  }
  return buildTrendMomentumProjection(trades);
}
