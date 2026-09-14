import Decimal from "decimal.js";
import type Database from "better-sqlite3";
import type { JournalAnalyticsRoundTripTableRow } from "../../journal-analytics/contracts/analytics-result";
import type { WorkspaceAccessScope } from "../../platform/contracts/workspace-access-scope";
import { JournalLogicalTradeRepository } from "../../journal/server/logical-trades/journal-logical-trade-repository";
import { LogicalTradeAnalyzerRepository } from "./logical-trade-analyzer-repository";
import type { DailyTradeLongTermAnalyticsModel, TradeAnalysisExcursionRow, TradeAnalysisEventPathRow } from "./daily-trade-long-term-analytics-service";
import { projectSavedIndicatorMovement, summarizeSavedIndicatorMovement } from "../../../lib/trade-candle-analysis/trend-momentum-movement-projection";

/** Room After Entry selects complete saved trades, never independent members of a group. */
export function readSavedTradeMovement(input: Readonly<{
  database: Database.Database; scope: WorkspaceAccessScope;
  journalRows: readonly JournalAnalyticsRoundTripTableRow[];
  legacy: DailyTradeLongTermAnalyticsModel; multipliers: ReadonlyMap<string, string>;
  startDate: string | null; endDate: string | null;
}>) {
  const { scope } = input;
  const accountId = scope.activeAccountId;
  if (!accountId || !scope.allowedAccountIds.includes(accountId)) throw new Error("Movement account is unavailable");
  const accountScope = { accountId, userId: scope.userId, workspaceId: scope.workspaceId, workspaceRole: scope.workspaceRole };
  const rows = new Map(input.journalRows.map((row) => [row.roundTripId, row]));
  const analyzer = new LogicalTradeAnalyzerRepository(input.database);
  const excursions: TradeAnalysisExcursionRow[] = [], eventPaths: TradeAnalysisEventPathRow[] = [];
  const directionTradeCounts = { long: 0, short: 0 };
  let eligibleDayTradeCount = 0, analyzedTradeCount = 0, analyzedExecutionCount = 0;
  for (const trade of new JournalLogicalTradeRepository(input.database).list(accountScope)) {
    if (trade.tradeStyle !== "day" || trade.lifecycleState !== "active") continue;
    const members = trade.members.map((member) => rows.get(member.roundTripId));
    if (!members.length || members.some((member) => !member)) continue;
    const complete = members as JournalAnalyticsRoundTripTableRow[];
    const first = complete[0]!, last = complete.at(-1)!;
    if ((input.startDate && last.closeLocalDate < input.startDate) || (input.endDate && last.closeLocalDate > input.endDate)) continue;
    eligibleDayTradeCount++;
    const saved = trade.logicalTradeId ? analyzer.readCurrentByRoundTrip(accountScope, first.roundTripId) : null;
    if (saved?.status === "ready" && saved.analyzed) {
      analyzedTradeCount++; directionTradeCounts[trade.direction]++;
      analyzedExecutionCount += saved.analyzed.eventSnapshots.length;
      const rates = new Set(complete.map((member) => new Decimal(input.multipliers.get(member.roundTripId) ?? "1").toFixed()));
      if (rates.size !== 1) continue;
      const pnl = complete.every((member) => member.selectedPnlDecimal !== null)
        ? complete.reduce((sum, member) => sum.plus(member.selectedPnlDecimal!), new Decimal(0)).toFixed() : null;
      const projected = projectSavedIndicatorMovement({ analyzed: saved.analyzed, candles: saved.candles,
        identity: { roundTripId: first.roundTripId, symbol: first.displayedSymbol,
          direction: trade.direction, closeDate: last.closeLocalDate, trackerDate: first.entryLocalDate },
        pnlDecimal: pnl, multiplier: [...rates][0]!, timezone: input.legacy.timezone });
      excursions.push(...projected.excursions); eventPaths.push(...projected.eventPaths);
    } else if (!saved && trade.members.length === 1) {
      // Compatibility is safe only for an unchanged single-member trade.
      const previous = input.legacy.trades.find((row) => row.roundTripId === first.roundTripId);
      if (!previous) continue;
      analyzedTradeCount++; directionTradeCounts[trade.direction]++;
      analyzedExecutionCount += previous.executionCount;
      const id = first.roundTripId;
      excursions.push(...input.legacy.excursions.filter((row) => row.roundTripId === first.roundTripId).map((row) => ({ ...row, roundTripId: id })));
      eventPaths.push(...(input.legacy.eventPaths ?? []).filter((row) => row.roundTripId === first.roundTripId && (row.eventKind === "Initial entry" || row.eventKind === "Add")).map((row) => ({ ...row, roundTripId: id })));
    }
  }
  excursions.sort((a, b) => b.closeDate.localeCompare(a.closeDate) || a.roundTripId.localeCompare(b.roundTripId) || a.executionSequence - b.executionSequence);
  eventPaths.sort((a, b) => b.closeDate.localeCompare(a.closeDate) || a.roundTripId.localeCompare(b.roundTripId) || a.eventSequence - b.eventSequence || a.minutesAfterEvent - b.minutesAfterEvent);
  return { excursions, eventPaths, eligibleDayTradeCount, analyzedTradeCount, analyzedExecutionCount, directionTradeCounts,
    coveragePercent: eligibleDayTradeCount ? analyzedTradeCount / eligibleDayTradeCount * 100 : null,
    ...summarizeSavedIndicatorMovement(excursions) };
}
