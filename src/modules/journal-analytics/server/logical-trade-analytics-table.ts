import "server-only";

import type Database from "better-sqlite3";
import Decimal from "decimal.js";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type {
  JournalAnalyticsRoundTripTableResponse,
  JournalAnalyticsRoundTripTableRow,
} from "../contracts/analytics-result";
import { JournalLogicalTradeRepository } from "../../journal/server/logical-trades/journal-logical-trade-repository";

const ExactDecimal = Decimal.clone({
  precision: 120,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -1000,
  toExpPos: 1000,
});

function accountScope(scope: WorkspaceAccessScope) {
  if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
    throw new Error("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return Object.freeze({
    accountId: scope.activeAccountId,
    userId: scope.userId,
    workspaceId: scope.workspaceId,
    workspaceRole: scope.workspaceRole,
  });
}

function sumDecimals(values: readonly (string | null)[]): string | null {
  if (values.some((value) => value === null)) return null;
  return values.reduce((total, value) => total.add(value!), new ExactDecimal(0)).toFixed();
}

function maximumDecimal(values: readonly string[]): string {
  return values.reduce((maximum, value) => maximum.greaterThan(value) ? maximum : new ExactDecimal(value), new ExactDecimal(0)).toFixed();
}

function weightedAverage(
  rows: readonly JournalAnalyticsRoundTripTableRow[],
  price: (row: JournalAnalyticsRoundTripTableRow) => string | null | undefined,
): string | null {
  if (rows.some((row) => price(row) === null || price(row) === undefined)) return null;
  const totalQuantity = rows.reduce((total, row) => total.add(row.enteredQuantityDecimal), new ExactDecimal(0));
  if (totalQuantity.isZero()) return null;
  return rows.reduce((total, row) => total.add(new ExactDecimal(price(row)!).mul(row.enteredQuantityDecimal)), new ExactDecimal(0))
    .div(totalQuantity).toFixed();
}

export function toLogicalTradeAnalyticsTable(
  scope: WorkspaceAccessScope,
  database: Database.Database,
  evidence: JournalAnalyticsRoundTripTableResponse,
): JournalAnalyticsRoundTripTableResponse {
  const logicalTrades = new JournalLogicalTradeRepository(database).list(accountScope(scope));
  const byMember = new Map(logicalTrades.flatMap((trade) => trade.members.map((member) => [member.roundTripId, trade] as const)));
  const rawById = new Map(evidence.rows.map((row) => [row.roundTripId, row] as const));
  const seen = new Set<string>();
  const rows: JournalAnalyticsRoundTripTableRow[] = [];
  for (const row of evidence.rows) {
    const logicalTrade = byMember.get(row.roundTripId);
    const key = logicalTrade?.logicalTradeId ?? row.roundTripId;
    if (seen.has(key)) continue;
    seen.add(key);
    const members = logicalTrade?.members.map((member) => rawById.get(member.roundTripId)) ?? [row];
    if (!logicalTrade || logicalTrade.members.length === 1 || members.some((member) => member === undefined)) {
      rows.push(row);
      continue;
    }
    const combined = members.filter((member): member is JournalAnalyticsRoundTripTableRow => member !== undefined).sort((left, right) =>
      left.openedAtUtc.localeCompare(right.openedAtUtc) || left.roundTripId.localeCompare(right.roundTripId));
    const first = combined[0]!;
    const last = combined.at(-1)!;
    const enteredQuantityDecimal = sumDecimals(combined.map((member) => member.enteredQuantityDecimal))!;
    const entryNotionalDecimal = sumDecimals(combined.map((member) => member.entryNotionalDecimal))!;
    const selectedPnlDecimal = sumDecimals(combined.map((member) => member.selectedPnlDecimal));
    const grossPnlDecimal = sumDecimals(combined.map((member) => member.grossPnlDecimal))!;
    const chargeCostDecimal = sumDecimals(combined.map((member) => member.chargeCostDecimal));
    const chargeCreditDecimal = sumDecimals(combined.map((member) => member.chargeCreditDecimal));
    const returnPercentDecimal = selectedPnlDecimal === null || new ExactDecimal(entryNotionalDecimal).isZero()
      ? null
      : new ExactDecimal(selectedPnlDecimal).div(entryNotionalDecimal).mul(100).toFixed();
    rows.push(Object.freeze({
      ...first,
      averageEntryPriceDecimal: weightedAverage(combined, (member) => member.averageEntryPriceDecimal),
      averageExitPriceDecimal: weightedAverage(combined, (member) => member.averageExitPriceDecimal),
      chargeCostDecimal,
      chargeCoverage: combined.every((member) => member.chargeCoverage === "complete") ? "complete" : "unavailable",
      chargeCreditDecimal,
      closeLocalDate: last.closeLocalDate,
      closedAtUtc: last.closedAtUtc,
      enteredQuantityDecimal,
      entryNotionalDecimal,
      grossPnlDecimal,
      holdingDurationMilliseconds: Math.max(0, Date.parse(last.closedAtUtc) - Date.parse(first.openedAtUtc)),
      maximumPositionQuantityDecimal: maximumDecimal(combined.map((member) => member.maximumPositionQuantityDecimal)),
      roundTripId: last.roundTripId,
      selectedPnlDecimal,
      tradeClassification: first.entryLocalDate === last.closeLocalDate ? "day_trade" : "multi_day_trade",
      uniqueExecutionCount: combined.reduce((total, member) => total + member.uniqueExecutionCount, 0),
      returnPercentDecimal,
    }));
  }
  return Object.freeze({
    ...evidence,
    rows: Object.freeze(rows),
    totalRowCount: Math.max(rows.length, evidence.totalRowCount - logicalTrades.filter((trade) =>
      trade.members.length > 1 && trade.members.every((member) => rawById.has(member.roundTripId))).reduce((count, trade) => count + trade.members.length - 1, 0)),
  });
}
