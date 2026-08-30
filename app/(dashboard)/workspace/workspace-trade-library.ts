import "server-only";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { JournalAnalyticsFactSetRepository } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import { withReadonlyJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import {
  journalAnalyticsLocalTimeFact,
  normalizeJournalAnalyticsFacts,
} from "@/src/modules/journal-analytics/server/normalize-journal-analytics-facts";

export type WorkspaceTradeLibraryRow = Readonly<{
  date: string;
  direction: "long" | "short";
  editableExecutions: readonly WorkspaceEditableExecution[];
  executionCount: number;
  netPnlDecimal: string | null;
  roundTripId: string;
  status: "Open" | "Closed" | "Closed swing";
  symbol: string;
  tradeCurrency: string;
}>;

export type WorkspaceEditableExecution = Readonly<{
  deleteRef: string | null;
  editRef: string;
  fees: string | null;
  localDate: string;
  localTime: string;
  price: string | null;
  quantity: string;
  side: "buy" | "sell";
  sourceTimezone: string;
  tradeCurrency: string;
}>;

export type WorkspaceTradeLibraryModel = Readonly<{
  rows: readonly WorkspaceTradeLibraryRow[];
}>;

type TradeStyleRow = Readonly<{
  round_trip_id: string;
  trade_style: "day_trade" | "swing" | "other";
}>;

function activeAccountId(scope: WorkspaceAccessScope): string {
  const accountId = scope.activeAccountId;
  if (!accountId || !scope.allowedAccountIds.includes(accountId)) {
    throw new Error("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return accountId;
}

/**
 * Builds the compact Workspace list from the same server-scoped fact set used
 * by the dashboard. No account, trade state, or money value comes from the
 * browser; executions remain an on-demand read in the client surface.
 */
export function readWorkspaceTradeLibrary(
  database: Database.Database,
  scope: WorkspaceAccessScope,
): WorkspaceTradeLibraryModel {
  const accountId = activeAccountId(scope);
  const facts = new JournalAnalyticsFactSetService(
    new JournalAnalyticsFactSetRepository(database),
  ).getJournalAnalyticsFactSet(scope, {
    accountIds: [accountId],
    closingDateRange: { kind: "all_available" },
    currencySelection: { kind: "all_partitions" },
  });
  const styles = new Map((database.prepare(`
SELECT round_trip_id, trade_style
FROM journal_trade_style_plans
WHERE workspace_id = ? AND account_id = ?`).all(
    scope.workspaceId,
    accountId,
  ) as TradeStyleRow[]).map((row) => [row.round_trip_id, row.trade_style]));
  const normalized = normalizeJournalAnalyticsFacts(facts);
  const executionIds = facts.roundTrips.flatMap((trade) =>
    trade.allocations.map((allocation) => allocation.executionId));
  const editableByExecution = new Map(withReadonlyJournalIntegrityRuntime(scope, (journal) =>
    journal.manualExecutionEdits.listEditable(
      journal.tradeStyles.accountScope(scope),
      [...new Set(executionIds)],
    ).map((execution) => [execution.executionId, execution] as const)));
  const editableExecutions = (executionIdsForTrade: readonly string[]) => Object.freeze(
    executionIdsForTrade.flatMap((executionId) => {
      const execution = editableByExecution.get(executionId);
      return execution ? [Object.freeze({
        deleteRef: execution.deleteRef,
        editRef: execution.editRef,
        fees: execution.feesDecimal,
        localDate: execution.localDate,
        localTime: execution.localTime,
        price: execution.priceDecimal,
        quantity: execution.quantityDecimal,
        side: execution.side,
        sourceTimezone: execution.sourceTimezone,
        tradeCurrency: execution.tradeCurrency,
      })] : [];
    }));
  const closed = normalized.realizedRows.map((trade) => Object.freeze({
    date: trade.closeLocal.localDate,
    direction: trade.direction,
    editableExecutions: editableExecutions(trade.uniqueExecutionIds),
    executionCount: trade.uniqueExecutionCount,
    netPnlDecimal: trade.netPnlDecimal,
    roundTripId: trade.roundTripId,
    status: styles.get(trade.roundTripId) === "swing" ? "Closed swing" as const : "Closed" as const,
    symbol: trade.displayedSymbol,
    tradeCurrency: trade.tradeCurrency,
  }));
  const open = normalized.legitimateOpenRoundTrips.map((trade) => Object.freeze({
    date: journalAnalyticsLocalTimeFact(
      trade.openedAtUtc,
      facts.accounts[0]?.tradingTimezone ?? "UTC",
    ).localDate,
    direction: trade.direction,
    editableExecutions: editableExecutions([...new Set(
      trade.allocations.map((allocation) => allocation.executionId))]),
    executionCount: new Set(trade.allocations.map((allocation) => allocation.executionId)).size,
    netPnlDecimal: null,
    roundTripId: trade.roundTripId,
    status: "Open" as const,
    symbol: trade.displayedSymbol,
    tradeCurrency: trade.tradeCurrency,
  }));
  return Object.freeze({
    rows: Object.freeze([...closed, ...open].sort((left, right) =>
      right.date.localeCompare(left.date) || right.roundTripId.localeCompare(left.roundTripId))),
  });
}
