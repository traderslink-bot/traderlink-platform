import Decimal from "decimal.js";
import type Database from "better-sqlite3";
import type { JournalAnalyticsRoundTripTableRow } from "../../journal-analytics/contracts/analytics-result";
import type { WorkspaceAccessScope } from "../../platform/contracts/workspace-access-scope";
import { JournalLogicalTradeRepository } from "../../journal/server/logical-trades/journal-logical-trade-repository";
import { LogicalTradeAnalyzerRepository } from "./logical-trade-analyzer-repository";
import type { DailyTradeAnalyzerResult } from "../contracts/daily-trade-analyzer-contracts";
import { savedPatternObservations, type SavedPatternTrade } from "../../../lib/trade-candle-analysis/trend-momentum-patterns";

/** Source boundary shared by pattern summary and paged evidence; never joins by symbol. */
export function readSavedPatternPopulation(input: Readonly<{
  database: Database.Database; scope: WorkspaceAccessScope;
  journalRows: readonly JournalAnalyticsRoundTripTableRow[];
  startDate: string | null; endDate: string | null;
  includePatterns?: boolean;
}>) {
  const { database, scope } = input, accountId = scope.activeAccountId;
  if (!accountId || !scope.allowedAccountIds.includes(accountId)) throw new Error("Pattern account is unavailable");
  const accountScope = { accountId, userId: scope.userId, workspaceId: scope.workspaceId, workspaceRole: scope.workspaceRole };
  const rows = new Map(input.journalRows.map((row) => [row.roundTripId, row]));
  const analyzer = new LogicalTradeAnalyzerRepository(database);
  const trades: SavedPatternTrade[] = [];
  let eligibleDayTradeCount = 0;
  for (const trade of new JournalLogicalTradeRepository(database).list(accountScope)) {
    if (trade.tradeStyle !== "day" || trade.lifecycleState !== "active") continue;
    const members = trade.members.map((member) => rows.get(member.roundTripId));
    if (!members.length || members.some((member) => !member)) continue;
    const complete = members as JournalAnalyticsRoundTripTableRow[], first = complete[0]!, last = complete.at(-1)!;
    if ((input.startDate && last.closeLocalDate < input.startDate) || (input.endDate && last.closeLocalDate > input.endDate)) continue;
    eligibleDayTradeCount++;
    const current = trade.logicalTradeId ? analyzer.readCurrentByRoundTrip(accountScope, first.roundTripId) : null;
    let analyzed: SavedPatternTrade["analyzed"] | null = current?.status === "ready" && current.candles.length > 0 ? current.analyzed : null;
    let analysisVersionId = current?.analysisVersionId;
    if (!current && trade.members.length === 1) {
      const saved = database.prepare(`SELECT version.daily_trade_analysis_version_id AS version_id, snapshot.snapshot_json
FROM journal_round_trip_daily_trade_analyses analysis
JOIN journal_round_trips current ON current.workspace_id = analysis.workspace_id AND current.account_id = analysis.account_id
 AND current.round_trip_id = analysis.round_trip_id AND current.current_version_id = analysis.round_trip_version_id AND current.lifecycle_state = 'active'
JOIN journal_round_trip_daily_trade_analysis_versions version ON version.daily_trade_analysis_id = analysis.daily_trade_analysis_id AND version.revision_number = analysis.current_revision
JOIN journal_round_trip_daily_trade_analysis_event_snapshots snapshot ON snapshot.daily_trade_analysis_version_id = version.daily_trade_analysis_version_id
WHERE analysis.workspace_id = ? AND analysis.account_id = ? AND analysis.round_trip_id = ? AND analysis.round_trip_version_id = ?
 AND analysis.status = 'ready' AND version.status = 'ready'
 AND EXISTS (SELECT 1 FROM journal_round_trip_daily_trade_analysis_event_snapshots backed
 JOIN level_analysis_market_session_candles candle ON candle.market_session_set_version_id = version.market_session_set_version_id
 AND candle.candle_time_utc_seconds = backed.candle_time_utc_seconds
 WHERE backed.daily_trade_analysis_version_id = version.daily_trade_analysis_version_id)
ORDER BY json_extract(snapshot.snapshot_json, '$.event.sequence')`).all(scope.workspaceId, accountId, first.roundTripId, trade.members[0]!.roundTripVersionId) as { version_id: string; snapshot_json: string }[];
      if (saved.length) {
        try {
          const eventSnapshots = saved.map((row) => JSON.parse(row.snapshot_json) as DailyTradeAnalyzerResult["eventSnapshots"][number]);
          // Pattern extraction needs snapshots only; never fabricates missing financial/path fields.
          analyzed = { eventSnapshots };
          analysisVersionId = saved[0]!.version_id;
        } catch { analyzed = null; }
      }
    }
    if (!analyzed || !analysisVersionId) continue;
    const pnl = complete.every((member) => member.selectedPnlDecimal !== null)
      ? complete.reduce((sum, member) => sum.plus(member.selectedPnlDecimal!), new Decimal(0)).toFixed() : null;
    const notional = complete.reduce((sum, member) => sum.plus(member.entryNotionalDecimal), new Decimal(0));
    trades.push({ tradeId: trade.logicalTradeId ?? first.roundTripId, representativeRoundTripId: first.roundTripId,
      analysisVersionId, symbol: first.displayedSymbol, direction: trade.direction, closeDate: last.closeLocalDate,
      openedAtUtc: trade.openedAtUtc, closedAtUtc: trade.closedAtUtc,
      trackerDate: first.entryLocalDate, pnlDecimal: pnl, returnPercentDecimal: pnl !== null && notional.gt(0) ? new Decimal(pnl).div(notional).mul(100).toFixed() : null, analyzed });
  }
  return { trades, observations: input.includePatterns === false ? [] : savedPatternObservations(trades), eligibleDayTradeCount, analyzedTradeCount: trades.length,
    directionTradeCounts: { long: trades.filter((trade) => trade.direction === "long").length, short: trades.filter((trade) => trade.direction === "short").length } };
}
