import type Database from "better-sqlite3";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { LogicalTradeAnalyzerRepository } from "@/src/modules/level-analysis/server/logical-trade-analyzer-repository";
import { JournalLogicalTradeRepository } from "../logical-trades/journal-logical-trade-repository";
import { JournalDemoAccountRepository } from "./journal-demo-account-repository";
import { readJournalDemoIndicatorReceipts } from "./journal-demo-indicator-receipts";
import { prepareJournalDemoTrendMomentum } from "./journal-demo-trend-momentum-analysis";

/** One bounded saved-only refresh. No provider, allowance, or notification path.
 * Missing trade-day coverage leaves the old analysis untouched. Earlier-history
 * shortfalls withhold only affected indicator/timeframe values, not the result.
 */
export function refreshJournalDemoTradeIndicators(database: Database.Database, input: Readonly<{
  scope: AccountScope; roundTripId: string; now: Date;
}>) {
  return database.transaction(() => {
    const { scope } = input;
    const demos = new JournalDemoAccountRepository(database);
    if (scope.workspaceRole !== "owner" || demos.findLifecycleForUser(scope)?.state === "cleared" ||
      demos.findAccountForUser(scope)?.accountId !== scope.accountId) throw new Error("demo_indicator_account_not_authorized");
    const trades = new JournalLogicalTradeRepository(database);
    let trade = trades.findByRoundTripId(scope, input.roundTripId);
    if (!trade || trade.lifecycleState !== "active" || trade.tradeStyle !== "day") {
      return { status: "ineligible" as const };
    }
    // Only existing Analyzer-backed Demo results are upgraded. Journal-only
    // examples do not silently become additional analyzed trades.
    const pins = trade.members.map(member => database.prepare(`SELECT market_session_set_version_id AS id
 FROM journal_round_trip_daily_trade_analyses WHERE workspace_id=? AND account_id=?
 AND round_trip_id=? AND round_trip_version_id=? AND status='ready'`).get(
      scope.workspaceId, scope.accountId, member.roundTripId, member.roundTripVersionId,
    ) as { id: string | null } | undefined);
    if (pins.some(pin => !pin?.id)) return { status: "not_analyzer_backed" as const };
    const created = !trade.logicalTradeId;
    if (created) {
      const id = trades.createVersion({ scope, members: trade.members, tradeStyle: trade.tradeStyle,
        changeKind: "created", timestamp: createCanonicalUtcTimestamp(input.now) });
      trade = trades.findByLogicalTradeId(scope, id);
      if (!trade) throw new Error("demo_indicator_logical_trade_missing");
    }
    const analyzer = new LogicalTradeAnalyzerRepository(database);
    const target = analyzer.target(scope, trade);
    if (!target) throw new Error("demo_indicator_target_unavailable");
    const selected = [...new Set(pins.map(pin => pin!.id!))].map(coreVersionId =>
      readJournalDemoIndicatorReceipts(database, { symbol: target.providerSymbol,
        tradingDateNewYork: target.tradingDateNewYork, coreVersionId }));
    const history = selected.every(Boolean) ? selected.flatMap(item => item!.receipts) : [];
    const prepared = prepareJournalDemoTrendMomentum({ symbol: target.providerSymbol,
      tradingDateNewYork: target.tradingDateNewYork, direction: target.direction,
      events: target.events, receipts: history });
    if (prepared.status !== "prepared") {
      // Roll back a just-created derived identity too: a preflight must not
      // create state or hide the legacy saved result while history is acquired.
      if (created) throw new DemoIndicatorHistoryRequired(prepared.warmup);
      return { status: "history_required" as const, warmup: prepared.warmup };
    }
    const current = analyzer.readCurrentByRoundTrip(scope, target.representativeRoundTripId);
    if (current?.status === "ready" && current.logicalTradeVersionId === target.logicalTradeVersionId &&
      JSON.stringify(current.analyzed) === JSON.stringify(prepared.analyzed) &&
      JSON.stringify(current.candles) === JSON.stringify(prepared.candles)) return { status: "unchanged" as const };
    analyzer.persistResult({ scope, target, now: input.now, status: "ready",
      analyzed: prepared.analyzed, evidenceCandles: prepared.candles,
      marketSessionSetVersionId: pins[0]!.id! });
    return { status: "refreshed" as const };
  }).immediate();
}

/** Machine-readable bounded preflight outcome; no identities or source facts. */
export class DemoIndicatorHistoryRequired extends Error {
  constructor(readonly warmup: readonly Readonly<{ interval: "1m" | "5m"; missingBars: number }>[]) {
    super("demo_indicator_history_required");
  }
}
