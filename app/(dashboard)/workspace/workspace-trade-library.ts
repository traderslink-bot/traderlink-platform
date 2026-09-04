import "server-only";

import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { withReadonlyJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import {
  absoluteExactDecimal,
  addExactDecimals,
  divideExactDecimals,
  multiplyExactDecimals,
  subtractExactDecimals,
} from "@/src/modules/journal-analytics/server/exact-analytics-math";
import { JournalLogicalTradeRepository } from "@/src/modules/journal/server/logical-trades/journal-logical-trade-repository";

export type WorkspaceTradeLibraryRow = Readonly<{
  date: string;
  direction: "long" | "short";
  buyQuantityDecimal: string;
  entryQuantityDecimal: string;
  editableExecutions: readonly WorkspaceEditableExecution[];
  entryDate: string;
  entryPriceDecimal: string | null;
  entryTime: string;
  executionCount: number;
  exitDate: string | null;
  exitPriceDecimal: string | null;
  exitQuantityDecimal: string | null;
  exitValueDecimal: string | null;
  exitTime: string | null;
  entryValueDecimal: string | null;
  gainLossDecimal: string | null;
  hasCurrentAnalyzerResult: boolean;
  holdDurationSeconds: number | null;
  positionDecimal: string;
  roundTripId: string;
  underlyingRoundTripIds: readonly string[];
  status: "Open" | "Open swing" | "Closed" | "Closed swing";
  symbol: string;
  tradeDeleteRef: string | null;
  tradeStyle: "day_trade" | "swing" | "other" | null;
  tradeCurrency: string;
}>;

export type WorkspaceEditableExecution = Readonly<{
  deleteRef: string | null;
  editRef: string;
  fees: string | null;
  localDate: string;
  localTime: string;
  manualFeeInputState: "not_entered" | "entered" | null;
  price: string | null;
  quantity: string;
  side: "buy" | "sell";
  sourceTimezone: string;
  tradeCurrency: string;
}>;

export type WorkspaceTradeLibraryFilter = "all" | "open" | "swing" | "closed" | "fees_not_entered";
export type WorkspaceTradeLibrarySort =
  | "newest" | "oldest"
  | "ticker_asc" | "ticker_desc"
  | "direction_asc" | "direction_desc"
  | "status_asc" | "status_desc"
  | "position" | "position_asc"
  | "buy_quantity" | "buy_quantity_asc"
  | "entry" | "entry_asc"
  | "exit" | "exit_asc"
  | "entry_value" | "entry_value_asc"
  | "hold" | "hold_asc"
  | "pnl_high" | "pnl_low";
export type WorkspaceTradeLibraryGroup = "none" | "day" | "ticker";

export type WorkspaceTradeLibraryQuery = Readonly<{
  afterCursor: string | null;
  endDate: string | null;
  filter: WorkspaceTradeLibraryFilter;
  followDashboardPeriod: boolean;
  group: WorkspaceTradeLibraryGroup;
  searchTicker: string;
  sort: WorkspaceTradeLibrarySort;
  startDate: string | null;
}>;

export type WorkspaceTradeLibraryModel = Readonly<{
  continuationCursor: string | null;
  projectionState: "ready" | "empty" | "unavailable";
  query: WorkspaceTradeLibraryQuery;
  rows: readonly WorkspaceTradeLibraryRow[];
  totalRowCount: number;
}>;

const PAGE_SIZE = 25;
const DATE = /^\d{4}-\d{2}-\d{2}$/u;
const TICKER = /^[A-Z0-9.\-]{0,32}$/u;

type ProjectionRow = Readonly<{
  activity_at_utc: string;
  activity_local_date: string;
  buy_quantity_decimal: string | null;
  buy_quantity_sort_key: string | null;
  closed_at_utc: string | null;
  direction: "long" | "short";
  entry_local_date: string;
  entry_local_time: string;
  entry_notional_decimal: string | null;
  entry_price_decimal: string | null;
  entry_price_sort_key: string | null;
  entry_value_sort_key: string | null;
  entered_quantity_decimal: string | null;
  exit_local_date: string | null;
  exit_local_time: string | null;
  exit_notional_decimal: string | null;
  exit_price_decimal: string | null;
  exit_price_sort_key: string | null;
  exit_quantity_decimal: string | null;
  maximum_position_quantity_decimal: string | null;
  gross_pnl_decimal: string | null;
  gross_pnl_sort_key: string | null;
  has_current_analyzer_result: 0 | 1;
  hold_duration_seconds: number | null;
  hold_duration_sort_key: string | null;
  net_pnl_decimal: string | null;
  net_pnl_sort_key: string | null;
  projection_state: "ready_closed" | "legitimate_open";
  position_decimal: string | null;
  position_sort_key: string | null;
  round_trip_id: string;
  round_trip_version_id: string;
  symbol: string;
  trade_currency: string;
  trade_style: "day_trade" | "swing" | "other" | null;
  unique_execution_count: number;
}>;

type TradeExecutionFact = Readonly<{
  allocation_sequence: number;
  price_decimal: string | null;
  quantity_decimal: string;
  round_trip_version_id: string;
  side: "buy" | "sell";
}>;

type WorkspaceTradeExecutionFacts = Readonly<{
  buyQuantityDecimal: string;
  entryQuantityDecimal: string;
  entryPriceDecimal: string | null;
  exitPriceDecimal: string | null;
  positionDecimal: string;
}>;

type RevisionRow = Readonly<{ projection_revision_id: string }>;
type CurrentExecutionRow = Readonly<{ has_current_execution: number }>;
type Cursor = Readonly<{
  activityAtUtc: string;
  netPnlSortKey: string | null;
  projectionRevisionId: string;
  queryDigest: string;
  roundTripId: string;
  sort: WorkspaceTradeLibrarySort;
}>;

function activeAccountId(scope: WorkspaceAccessScope): string {
  if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
    throw new Error("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return scope.activeAccountId;
}

function canonicalQuery(value: WorkspaceTradeLibraryQuery): WorkspaceTradeLibraryQuery {
  const query = {
    afterCursor: value.afterCursor ?? null,
    endDate: value.endDate || null,
    filter: value.filter,
    followDashboardPeriod: value.followDashboardPeriod,
    group: value.group,
    searchTicker: value.searchTicker.trim().toUpperCase(),
    sort: value.sort,
    startDate: value.startDate || null,
  } as const;
  if (!(["all", "open", "swing", "closed", "fees_not_entered"] as const).includes(query.filter) ||
      !(["newest", "oldest", "ticker_asc", "ticker_desc", "direction_asc", "direction_desc", "status_asc", "status_desc", "position", "position_asc", "buy_quantity", "buy_quantity_asc", "entry", "entry_asc", "exit", "exit_asc", "entry_value", "entry_value_asc", "hold", "hold_asc", "pnl_high", "pnl_low"] as const).includes(query.sort) ||
      !(["none", "day", "ticker"] as const).includes(query.group) ||
      !TICKER.test(query.searchTicker) ||
      (query.startDate !== null && !DATE.test(query.startDate)) ||
      (query.endDate !== null && !DATE.test(query.endDate)) ||
      (query.startDate !== null && query.endDate !== null && query.startDate > query.endDate)) {
    throw new Error("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
  }
  return Object.freeze(query);
}

function queryDigest(query: WorkspaceTradeLibraryQuery): string {
  const { afterCursor: _afterCursor, ...stable } = query;
  return createHash("sha256").update(JSON.stringify(stable), "utf8").digest("hex");
}

function decodeCursor(value: string, revision: string, digest: string, sort: WorkspaceTradeLibrarySort): Cursor {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Cursor;
    if (
      !parsed || typeof parsed !== "object" ||
      parsed.projectionRevisionId !== revision || parsed.queryDigest !== digest ||
      parsed.sort !== sort || typeof parsed.roundTripId !== "string" ||
      typeof parsed.activityAtUtc !== "string" ||
      !(typeof parsed.netPnlSortKey === "string" || parsed.netPnlSortKey === null)
    ) throw new Error("invalid cursor");
    return Object.freeze(parsed);
  } catch {
    throw new Error("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
  }
}

type SortDefinition = Readonly<{ direction: "ASC" | "DESC"; expression: string }>;

function sortDefinition(sort: WorkspaceTradeLibrarySort): SortDefinition {
  if (sort === "newest") return { direction: "DESC", expression: "projection.activity_at_utc" };
  if (sort === "oldest") return { direction: "ASC", expression: "projection.activity_at_utc" };
  if (sort === "ticker_asc") return { direction: "ASC", expression: "instrument.normalized_symbol" };
  if (sort === "ticker_desc") return { direction: "DESC", expression: "instrument.normalized_symbol" };
  if (sort === "direction_asc") return { direction: "ASC", expression: "version.direction" };
  if (sort === "direction_desc") return { direction: "DESC", expression: "version.direction" };
  if (sort === "status_asc") return { direction: "ASC", expression: "CASE WHEN projection.projection_state = 'legitimate_open' THEN CASE WHEN style.trade_style = 'swing' THEN 'Open swing' ELSE 'Open' END ELSE CASE WHEN style.trade_style = 'swing' THEN 'Closed swing' ELSE 'Closed' END END" };
  if (sort === "status_desc") return { direction: "DESC", expression: "CASE WHEN projection.projection_state = 'legitimate_open' THEN CASE WHEN style.trade_style = 'swing' THEN 'Open swing' ELSE 'Open' END ELSE CASE WHEN style.trade_style = 'swing' THEN 'Closed swing' ELSE 'Closed' END END" };
  if (sort === "position" || sort === "position_asc") return { direction: sort === "position" ? "DESC" : "ASC", expression: "projection.position_sort_key" };
  if (sort === "buy_quantity" || sort === "buy_quantity_asc") return { direction: sort === "buy_quantity" ? "DESC" : "ASC", expression: "projection.buy_quantity_sort_key" };
  if (sort === "entry" || sort === "entry_asc") return { direction: sort === "entry" ? "DESC" : "ASC", expression: "projection.entry_price_sort_key" };
  if (sort === "exit" || sort === "exit_asc") return { direction: sort === "exit" ? "DESC" : "ASC", expression: "projection.exit_price_sort_key" };
  if (sort === "entry_value" || sort === "entry_value_asc") return { direction: sort === "entry_value" ? "DESC" : "ASC", expression: "projection.entry_value_sort_key" };
  if (sort === "hold" || sort === "hold_asc") return { direction: sort === "hold" ? "DESC" : "ASC", expression: "projection.hold_duration_sort_key" };
  return { direction: sort === "pnl_low" ? "ASC" : "DESC", expression: "projection.gross_pnl_sort_key" };
}

function sortKey(row: ProjectionRow, sort: WorkspaceTradeLibrarySort): string | null {
  if (sort === "newest" || sort === "oldest") return row.activity_at_utc;
  if (sort === "ticker_asc" || sort === "ticker_desc") return row.symbol;
  if (sort === "direction_asc" || sort === "direction_desc") return row.direction;
  if (sort === "status_asc" || sort === "status_desc") return row.projection_state === "legitimate_open" ? row.trade_style === "swing" ? "Open swing" : "Open" : row.trade_style === "swing" ? "Closed swing" : "Closed";
  if (sort === "position" || sort === "position_asc") return row.position_sort_key;
  if (sort === "buy_quantity" || sort === "buy_quantity_asc") return row.buy_quantity_sort_key;
  if (sort === "entry" || sort === "entry_asc") return row.entry_price_sort_key;
  if (sort === "exit" || sort === "exit_asc") return row.exit_price_sort_key;
  if (sort === "entry_value" || sort === "entry_value_asc") return row.entry_value_sort_key;
  if (sort === "hold" || sort === "hold_asc") return row.hold_duration_sort_key;
  return row.gross_pnl_sort_key;
}

function encodeCursor(row: ProjectionRow, revision: string, digest: string, sort: WorkspaceTradeLibrarySort): string {
  return Buffer.from(JSON.stringify({
    activityAtUtc: row.activity_at_utc,
    netPnlSortKey: sortKey(row, sort),
    projectionRevisionId: revision,
    queryDigest: digest,
    roundTripId: row.round_trip_id,
    underlyingRoundTripIds: Object.freeze([row.round_trip_id]),
    sort,
  }), "utf8").toString("base64url");
}

function mergeLogicalWorkspaceRows(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  rows: readonly WorkspaceTradeLibraryRow[],
): readonly WorkspaceTradeLibraryRow[] {
  const accountId = activeAccountId(scope);
  const accountScope = Object.freeze({ userId: scope.userId, workspaceId: scope.workspaceId,
    accountId, workspaceRole: scope.workspaceRole });
  const logical = new JournalLogicalTradeRepository(database).list(accountScope);
  const byMember = new Map(logical.flatMap((trade) => trade.members.map((member) => [member.roundTripId, trade] as const)));
  const result: WorkspaceTradeLibraryRow[] = [];
  const included = new Set<string>();
  for (const row of rows) {
    const trade = byMember.get(row.roundTripId);
    const key = trade?.logicalTradeId ?? row.roundTripId;
    if (included.has(key)) continue;
    included.add(key);
    if (!trade || trade.members.length === 1) { result.push(row); continue; }
    const members = trade.members.map((member) => readWorkspaceTradeLibrarySavedTrade(database, scope, {
      roundTripId: member.roundTripId, roundTripVersionId: member.roundTripVersionId,
    })).filter((member): member is WorkspaceTradeLibraryRow => member !== null)
      .sort((left, right) => `${left.entryDate}T${left.entryTime}`.localeCompare(`${right.entryDate}T${right.entryTime}`));
    const first = members[0]; const last = members.at(-1);
    if (!first || !last || members.length !== trade.members.length) { result.push(row); continue; }
    const sum = (values: readonly string[]): string => values.reduce(addExactDecimals, "0");
    const nullableSum = (values: readonly (string | null)[]): string | null =>
      values.every((value) => value !== null) ? sum(values as readonly string[]) : null;
    const average = (notional: string | null, quantity: string | null): string | null =>
      notional === null || quantity === null || quantity === "0" ? null : divideExactDecimals(notional, quantity, {
        decimalPlaces: 8,
        roundingPolicy: "half_up_8dp",
      }).roundedDecimal;
    const entryValueDecimal = nullableSum(members.map((member) => member.entryValueDecimal));
    const entryQuantityDecimal = sum(members.map((member) => member.entryQuantityDecimal));
    const exitValueDecimal = nullableSum(members.map((member) => member.exitValueDecimal));
    const exitQuantityDecimal = nullableSum(members.map((member) => member.exitQuantityDecimal));
    const analyzer = trade.logicalTradeId ? database.prepare(`SELECT 1
FROM journal_logical_trade_daily_analyses
WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ?
 AND logical_trade_version_id = (SELECT current_version_id FROM journal_logical_trades
  WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ?)
 AND status = 'ready' LIMIT 1`).get(scope.workspaceId, accountId, trade.logicalTradeId,
        scope.workspaceId, accountId, trade.logicalTradeId) : null;
    result.push(Object.freeze({
      ...first,
      buyQuantityDecimal: sum(members.map((member) => member.buyQuantityDecimal)),
      entryQuantityDecimal,
      date: last.date,
      editableExecutions: Object.freeze(members.flatMap((member) => member.editableExecutions)
        .sort((left, right) => `${left.localDate}T${left.localTime}`.localeCompare(`${right.localDate}T${right.localTime}`))),
      entryPriceDecimal: average(entryValueDecimal, entryQuantityDecimal),
      entryValueDecimal,
      executionCount: members.reduce((total, member) => total + member.executionCount, 0),
      exitDate: last.exitDate,
      exitPriceDecimal: average(exitValueDecimal, exitQuantityDecimal),
      exitQuantityDecimal,
      exitTime: last.exitTime,
      exitValueDecimal,
      gainLossDecimal: nullableSum(members.map((member) => member.gainLossDecimal)),
      hasCurrentAnalyzerResult: Boolean(analyzer),
      holdDurationSeconds: Math.max(0, Math.round((Date.parse(trade.closedAtUtc) - Date.parse(trade.openedAtUtc)) / 1000)),
      positionDecimal: "0",
      status: trade.tradeStyle === "swing" ? "Closed swing" : "Closed",
      tradeDeleteRef: null,
      tradeStyle: trade.tradeStyle === "swing" ? "swing" : "day_trade",
      underlyingRoundTripIds: Object.freeze(trade.members.map((member) => member.roundTripId)),
    }));
  }
  return Object.freeze(result);
}

function editableExecutions(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  rows: readonly ProjectionRow[],
): ReadonlyMap<string, readonly WorkspaceEditableExecution[]> {
  if (rows.length === 0) return new Map();
  const accountId = activeAccountId(scope);
  const ids = database.prepare(`SELECT allocation.round_trip_version_id, execution.execution_id
FROM journal_round_trip_execution_allocations allocation
JOIN journal_execution_versions execution_version
  ON execution_version.execution_version_id = allocation.execution_version_id
JOIN journal_executions execution
  ON execution.workspace_id = execution_version.workspace_id
 AND execution.account_id = execution_version.account_id
 AND execution.execution_id = execution_version.execution_id
WHERE allocation.workspace_id = ? AND allocation.account_id = ?
  AND allocation.round_trip_version_id IN (${rows.map(() => "?").join(", ")})
ORDER BY allocation.round_trip_version_id, allocation.allocation_sequence`).all(
    scope.workspaceId,
    accountId,
    ...rows.map((row) => row.round_trip_version_id),
  ) as readonly Readonly<{ round_trip_version_id: string; execution_id: string }>[];
  const executionIds = [...new Set(ids.map((row) => row.execution_id))];
  const editable = withReadonlyJournalIntegrityRuntime(scope, (journal) =>
    journal.manualExecutionEdits.listEditable(
      journal.tradeStyles.accountScope(scope),
      executionIds,
    ));
  const byExecution = new Map(editable.map((entry) => [entry.executionId, entry] as const));
  const roundTripByVersion = new Map(rows.map((row) => [row.round_trip_version_id, row.round_trip_id] as const));
  const result = new Map<string, WorkspaceEditableExecution[]>();
  for (const row of ids) {
    const editableRow = byExecution.get(row.execution_id);
    if (!editableRow) continue;
    const roundTripId = roundTripByVersion.get(row.round_trip_version_id) ?? null;
    if (!roundTripId) continue;
    const entries = result.get(roundTripId) ?? [];
    entries.push(Object.freeze({
      deleteRef: editableRow.deleteRef,
      editRef: editableRow.editRef,
      fees: editableRow.feesDecimal,
      localDate: editableRow.localDate,
      localTime: editableRow.localTime,
      manualFeeInputState: editableRow.manualFeeInputState,
      price: editableRow.priceDecimal,
      quantity: editableRow.quantityDecimal,
      side: editableRow.side,
      sourceTimezone: editableRow.sourceTimezone,
      tradeCurrency: editableRow.tradeCurrency,
    }));
    result.set(roundTripId, entries);
  }
  return new Map([...result.entries()].map(([key, value]) => [key, Object.freeze(value)]));
}

function tradeDeleteRefs(
  scope: WorkspaceAccessScope,
  rows: readonly ProjectionRow[],
): ReadonlyMap<string, string> {
  if (rows.length === 0) return new Map();
  return withReadonlyJournalIntegrityRuntime(scope, (journal) =>
    journal.manualExecutionEdits.listTradeDeleteRefs(
      journal.tradeStyles.accountScope(scope),
      rows.map((row) => row.round_trip_id),
    ));
}

function executionFacts(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  rows: readonly ProjectionRow[],
): ReadonlyMap<string, WorkspaceTradeExecutionFacts> {
  if (rows.length === 0) return new Map();
  const accountId = activeAccountId(scope);
  const facts = database.prepare(`SELECT allocation.round_trip_version_id,
  allocation.allocation_sequence, allocation.quantity_decimal,
  execution_version.side, execution_version.price_decimal
FROM journal_round_trip_execution_allocations allocation
JOIN journal_execution_versions execution_version
  ON execution_version.workspace_id = allocation.workspace_id
 AND execution_version.account_id = allocation.account_id
 AND execution_version.execution_version_id = allocation.execution_version_id
WHERE allocation.workspace_id = ? AND allocation.account_id = ?
  AND allocation.round_trip_version_id IN (${rows.map(() => "?").join(", ")})
ORDER BY allocation.round_trip_version_id, allocation.allocation_sequence`).all(
    scope.workspaceId,
    accountId,
    ...rows.map((row) => row.round_trip_version_id),
  ) as readonly TradeExecutionFact[];
  const byVersion = new Map<string, TradeExecutionFact[]>();
  for (const fact of facts) {
    const entries = byVersion.get(fact.round_trip_version_id) ?? [];
    entries.push(fact);
    byVersion.set(fact.round_trip_version_id, entries);
  }
  const result = new Map<string, WorkspaceTradeExecutionFacts>();
  for (const row of rows) {
    const entries = byVersion.get(row.round_trip_version_id) ?? [];
    let buyQuantityDecimal = "0";
    let sellQuantityDecimal = "0";
    let buyValueDecimal: string | null = "0";
    let sellValueDecimal: string | null = "0";
    let signedPositionDecimal = "0";
    for (const entry of entries) {
      if (entry.side === "buy") {
        buyQuantityDecimal = addExactDecimals(buyQuantityDecimal, entry.quantity_decimal);
        buyValueDecimal = buyValueDecimal === null || entry.price_decimal === null ? null : addExactDecimals(buyValueDecimal, multiplyExactDecimals(entry.quantity_decimal, entry.price_decimal));
        signedPositionDecimal = addExactDecimals(signedPositionDecimal, entry.quantity_decimal);
      } else {
        sellQuantityDecimal = addExactDecimals(sellQuantityDecimal, entry.quantity_decimal);
        sellValueDecimal = sellValueDecimal === null || entry.price_decimal === null ? null : addExactDecimals(sellValueDecimal, multiplyExactDecimals(entry.quantity_decimal, entry.price_decimal));
        signedPositionDecimal = subtractExactDecimals(signedPositionDecimal, entry.quantity_decimal);
      }
    }
    const entryQuantityDecimal = row.direction === "long" ? buyQuantityDecimal : sellQuantityDecimal;
    const entryValueDecimal = row.direction === "long" ? buyValueDecimal : sellValueDecimal;
    const exitQuantityDecimal = row.direction === "long" ? sellQuantityDecimal : buyQuantityDecimal;
    const exitValueDecimal = row.direction === "long" ? sellValueDecimal : buyValueDecimal;
    const average = (value: string | null, quantity: string): string | null => value === null || quantity === "0"
      ? null
      : divideExactDecimals(value, quantity, { decimalPlaces: 8, roundingPolicy: "half_up_8dp" }).roundedDecimal;
    result.set(row.round_trip_version_id, Object.freeze({
      buyQuantityDecimal,
      entryQuantityDecimal,
      entryPriceDecimal: average(entryValueDecimal, entryQuantityDecimal),
      exitPriceDecimal: row.projection_state === "ready_closed" ? average(exitValueDecimal, exitQuantityDecimal) : null,
      positionDecimal: absoluteExactDecimal(signedPositionDecimal),
    }));
  }
  return result;
}

function toWorkspaceTradeLibraryRows(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  rows: readonly ProjectionRow[],
): readonly WorkspaceTradeLibraryRow[] {
  const editable = editableExecutions(database, scope, rows);
  const facts = executionFacts(database, scope, rows);
  const deletes = tradeDeleteRefs(scope, rows);
  return Object.freeze(rows.map((row) => Object.freeze({
    buyQuantityDecimal: facts.get(row.round_trip_version_id)?.buyQuantityDecimal ?? "0",
    entryQuantityDecimal: facts.get(row.round_trip_version_id)?.entryQuantityDecimal ?? "0",
    date: row.activity_local_date,
    direction: row.direction,
    editableExecutions: editable.get(row.round_trip_id) ?? Object.freeze([]),
    entryDate: row.entry_local_date,
    entryPriceDecimal: facts.get(row.round_trip_version_id)?.entryPriceDecimal ?? null,
    entryTime: row.entry_local_time,
    executionCount: row.unique_execution_count,
    exitDate: row.exit_local_date,
    exitPriceDecimal: facts.get(row.round_trip_version_id)?.exitPriceDecimal ?? null,
    exitQuantityDecimal: row.exit_quantity_decimal,
    exitTime: row.exit_local_time,
    exitValueDecimal: row.exit_notional_decimal,
    entryValueDecimal: row.entry_notional_decimal,
    gainLossDecimal: row.gross_pnl_decimal,
    hasCurrentAnalyzerResult: row.has_current_analyzer_result === 1,
    holdDurationSeconds: row.hold_duration_seconds,
    positionDecimal: facts.get(row.round_trip_version_id)?.positionDecimal ?? "0",
    roundTripId: row.round_trip_id,
    status: row.projection_state === "legitimate_open"
      ? row.trade_style === "swing" ? "Open swing" : "Open"
      : row.trade_style === "swing" ? "Closed swing" : "Closed",
    symbol: row.symbol,
    tradeDeleteRef: deletes.get(row.round_trip_id) ?? null,
    tradeStyle: row.trade_style,
    tradeCurrency: row.trade_currency,
    underlyingRoundTripIds: Object.freeze([row.round_trip_id]),
  })));
}

export function readWorkspaceTradeLibrary(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  input: WorkspaceTradeLibraryQuery = Object.freeze({
    afterCursor: null, endDate: null, filter: "all", followDashboardPeriod: true,
    group: "none", searchTicker: "", sort: "newest", startDate: null,
  }),
): WorkspaceTradeLibraryModel {
  const accountId = activeAccountId(scope);
  const query = canonicalQuery(input);
  const revision = database.prepare(`SELECT projection_revision_id
FROM journal_workspace_trade_library_projection_revisions
WHERE workspace_id = ? AND account_id = ?`).get(scope.workspaceId, accountId) as RevisionRow | undefined;
  if (!revision) {
    const currentExecutions = database.prepare(`SELECT EXISTS(
  SELECT 1 FROM journal_executions
  WHERE workspace_id = ? AND account_id = ?
    AND current_state IN ('accepted', 'needs_decision')
) AS has_current_execution`).get(scope.workspaceId, accountId) as CurrentExecutionRow;
    return Object.freeze({
      continuationCursor: null,
      projectionState: currentExecutions.has_current_execution === 0 ? "empty" : "unavailable",
      query,
      rows: Object.freeze([]),
      totalRowCount: 0,
    });
  }
  const digest = queryDigest(query);
  const cursor = query.afterCursor === null ? null : decodeCursor(query.afterCursor, revision.projection_revision_id, digest, query.sort);
  const clauses = ["projection.workspace_id = ?", "projection.account_id = ?"];
  const parameters: Array<string> = [scope.workspaceId, accountId];
  if (query.searchTicker) { clauses.push("instrument.normalized_symbol LIKE ?"); parameters.push(`${query.searchTicker}%`); }
  if (query.startDate) { clauses.push("projection.activity_local_date >= ?"); parameters.push(query.startDate); }
  if (query.endDate) { clauses.push("projection.activity_local_date <= ?"); parameters.push(query.endDate); }
  if (query.filter === "open") clauses.push("projection.projection_state = 'legitimate_open'");
  if (query.filter === "closed") clauses.push("projection.projection_state = 'ready_closed' AND coalesce(logical_version.trade_style, style.trade_style, 'other') <> 'swing'");
  if (query.filter === "swing") clauses.push("coalesce(logical_version.trade_style, style.trade_style) = 'swing'");
  if (query.filter === "fees_not_entered") clauses.push(`EXISTS (
    SELECT 1
    FROM journal_round_trip_execution_allocations fee_allocation
    JOIN journal_executions fee_execution
      ON fee_execution.workspace_id = fee_allocation.workspace_id
     AND fee_execution.account_id = fee_allocation.account_id
     AND fee_execution.current_version_id = fee_allocation.execution_version_id
    JOIN journal_execution_versions fee_version
      ON fee_version.workspace_id = fee_execution.workspace_id
     AND fee_version.account_id = fee_execution.account_id
     AND fee_version.execution_version_id = fee_execution.current_version_id
    WHERE fee_allocation.workspace_id = projection.workspace_id
      AND fee_allocation.account_id = projection.account_id
      AND fee_allocation.round_trip_version_id = projection.round_trip_version_id
      AND (
        fee_version.manual_fee_input_state = 'not_entered'
        OR (
          fee_version.manual_fee_input_state IS NULL
          AND fee_version.fees_decimal IS NULL
          AND EXISTS (
            SELECT 1
            FROM journal_execution_provenance manual_fee_provenance
            JOIN journal_import_batches manual_fee_batch
              ON manual_fee_batch.workspace_id = manual_fee_provenance.workspace_id
             AND manual_fee_batch.account_id = manual_fee_provenance.account_id
             AND manual_fee_batch.import_batch_id = manual_fee_provenance.import_batch_id
            WHERE manual_fee_provenance.workspace_id = fee_execution.workspace_id
              AND manual_fee_provenance.account_id = fee_execution.account_id
              AND manual_fee_provenance.execution_id = fee_execution.execution_id
              AND manual_fee_batch.source_kind = 'manual_batch'
          )
        )
      )
  )`);
  clauses.push(`(logical_membership.logical_trade_id IS NULL OR logical_membership.member_sequence = (
    SELECT max(grouped_membership.member_sequence)
    FROM journal_active_logical_trade_memberships grouped_membership
    WHERE grouped_membership.workspace_id = logical_membership.workspace_id
      AND grouped_membership.account_id = logical_membership.account_id
      AND grouped_membership.logical_trade_id = logical_membership.logical_trade_id
  ))`);
  const where = clauses.join(" AND ");
  const filterParameters = [...parameters];
  const sort = sortDefinition(query.sort);
  const keyset = (() => {
    if (!cursor) return "";
    const comparison = sort.direction === "ASC" ? ">" : "<";
    if (cursor.netPnlSortKey === null) { parameters.push(cursor.roundTripId); return ` AND (${sort.expression}) IS NULL AND projection.round_trip_id ${comparison} ?`; }
    parameters.push(cursor.netPnlSortKey, cursor.netPnlSortKey, cursor.roundTripId);
    return ` AND ((${sort.expression}) IS NULL OR (${sort.expression}) ${comparison} ? OR ((${sort.expression}) = ? AND projection.round_trip_id ${comparison} ?))`;
  })();
  const order = `(${sort.expression}) IS NULL ASC, (${sort.expression}) ${sort.direction}, projection.round_trip_id ${sort.direction}`;
  const base = `FROM journal_workspace_trade_library_projections projection
JOIN journal_round_trip_versions version ON version.workspace_id = projection.workspace_id
 AND version.account_id = projection.account_id AND version.round_trip_version_id = projection.round_trip_version_id
JOIN journal_instruments instrument ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
LEFT JOIN journal_trade_style_plans style ON style.workspace_id = projection.workspace_id
 AND style.account_id = projection.account_id AND style.round_trip_id = projection.round_trip_id
LEFT JOIN journal_active_logical_trade_memberships logical_membership
 ON logical_membership.workspace_id = projection.workspace_id
 AND logical_membership.account_id = projection.account_id
 AND logical_membership.round_trip_id = projection.round_trip_id
LEFT JOIN journal_logical_trade_versions logical_version
 ON logical_version.workspace_id = logical_membership.workspace_id
 AND logical_version.account_id = logical_membership.account_id
 AND logical_version.logical_trade_version_id = logical_membership.logical_trade_version_id`;
  const totalRowCount = (database.prepare(`SELECT count(DISTINCT coalesce(logical_membership.logical_trade_id, projection.round_trip_id)) AS count ${base} WHERE ${where}`).get(...filterParameters) as { count: number }).count;
  const pageParameters = [...parameters, String(PAGE_SIZE + 1)];
  const rows = database.prepare(`SELECT projection.activity_at_utc, projection.activity_local_date,
  projection.closed_at_utc, version.direction, projection.entry_local_date, projection.entry_local_time,
  projection.entry_notional_decimal, projection.entered_quantity_decimal, projection.entry_price_decimal, projection.entry_price_sort_key, projection.entry_value_sort_key, projection.exit_local_date,
  projection.exit_local_time, projection.exit_notional_decimal, projection.exit_quantity_decimal,
  projection.exit_price_decimal, projection.exit_price_sort_key, projection.maximum_position_quantity_decimal, projection.gross_pnl_decimal, projection.gross_pnl_sort_key, projection.net_pnl_decimal, projection.net_pnl_sort_key, projection.hold_duration_seconds, projection.hold_duration_sort_key,
  projection.buy_quantity_decimal, projection.buy_quantity_sort_key, projection.position_decimal, projection.position_sort_key,
  projection.projection_state, projection.round_trip_id, projection.round_trip_version_id, instrument.normalized_symbol AS symbol,
  EXISTS (
    SELECT 1
    FROM journal_round_trip_daily_trade_analyses analysis
    JOIN journal_round_trip_daily_trade_analysis_versions analysis_version
      ON analysis_version.daily_trade_analysis_id = analysis.daily_trade_analysis_id
     AND analysis_version.revision_number = analysis.current_revision
    JOIN journal_round_trip_versions analyzed_version
      ON analyzed_version.workspace_id = analysis.workspace_id
     AND analyzed_version.account_id = analysis.account_id
     AND analyzed_version.round_trip_version_id = analysis.round_trip_version_id
    WHERE analysis.workspace_id = projection.workspace_id
      AND analysis.account_id = projection.account_id
      AND analysis.round_trip_id = projection.round_trip_id
      AND analysis.round_trip_version_id = projection.round_trip_version_id
      AND analysis.status = 'ready'
      AND analysis_version.status = 'ready'
      AND analyzed_version.projection_fingerprint_sha256 = version.projection_fingerprint_sha256
  ) AS has_current_analyzer_result,
  version.trade_currency,
  COALESCE(CASE logical_version.trade_style WHEN 'day' THEN 'day_trade' ELSE logical_version.trade_style END,
    style.trade_style) AS trade_style,
  projection.unique_execution_count
${base} WHERE ${where}${keyset} ORDER BY ${order} LIMIT ?`).all(...pageParameters) as readonly ProjectionRow[];
  const selected = rows.slice(0, PAGE_SIZE);
  return Object.freeze({
    continuationCursor: rows.length > PAGE_SIZE ? encodeCursor(selected.at(-1)!, revision.projection_revision_id, digest, query.sort) : null,
    projectionState: "ready",
    query,
    rows: mergeLogicalWorkspaceRows(database, scope, toWorkspaceTradeLibraryRows(database, scope, selected)),
    totalRowCount,
  });
}

export function readWorkspaceTradeLibrarySavedTrade(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  target: Readonly<{ roundTripId: string; roundTripVersionId: string }>,
): WorkspaceTradeLibraryRow | null {
  const accountId = activeAccountId(scope);
  const rows = database.prepare(`SELECT projection.activity_at_utc, projection.activity_local_date,
  projection.closed_at_utc, version.direction, projection.entry_local_date, projection.entry_local_time,
  projection.entry_notional_decimal, projection.entered_quantity_decimal, projection.entry_price_decimal, projection.entry_price_sort_key, projection.entry_value_sort_key, projection.exit_local_date,
  projection.exit_local_time, projection.exit_notional_decimal, projection.exit_quantity_decimal,
  projection.exit_price_decimal, projection.exit_price_sort_key, projection.maximum_position_quantity_decimal, projection.gross_pnl_decimal, projection.gross_pnl_sort_key, projection.net_pnl_decimal, projection.net_pnl_sort_key, projection.hold_duration_seconds, projection.hold_duration_sort_key,
  projection.buy_quantity_decimal, projection.buy_quantity_sort_key, projection.position_decimal, projection.position_sort_key,
  projection.projection_state, projection.round_trip_id, projection.round_trip_version_id, instrument.normalized_symbol AS symbol,
  EXISTS (
    SELECT 1
    FROM journal_round_trip_daily_trade_analyses analysis
    JOIN journal_round_trip_daily_trade_analysis_versions analysis_version
      ON analysis_version.daily_trade_analysis_id = analysis.daily_trade_analysis_id
     AND analysis_version.revision_number = analysis.current_revision
    JOIN journal_round_trip_versions analyzed_version
      ON analyzed_version.workspace_id = analysis.workspace_id
     AND analyzed_version.account_id = analysis.account_id
     AND analyzed_version.round_trip_version_id = analysis.round_trip_version_id
    WHERE analysis.workspace_id = projection.workspace_id
      AND analysis.account_id = projection.account_id
      AND analysis.round_trip_id = projection.round_trip_id
      AND analysis.round_trip_version_id = projection.round_trip_version_id
      AND analysis.status = 'ready'
      AND analysis_version.status = 'ready'
      AND analyzed_version.projection_fingerprint_sha256 = version.projection_fingerprint_sha256
  ) AS has_current_analyzer_result,
  version.trade_currency, style.trade_style, projection.unique_execution_count
FROM journal_workspace_trade_library_projections projection
JOIN journal_round_trip_versions version ON version.workspace_id = projection.workspace_id
 AND version.account_id = projection.account_id AND version.round_trip_version_id = projection.round_trip_version_id
JOIN journal_instruments instrument ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
LEFT JOIN journal_trade_style_plans style ON style.workspace_id = projection.workspace_id
 AND style.account_id = projection.account_id AND style.round_trip_id = projection.round_trip_id
WHERE projection.workspace_id = ? AND projection.account_id = ?
  AND projection.round_trip_id = ? AND projection.round_trip_version_id = ?
LIMIT 1`).all(
    scope.workspaceId,
    accountId,
    target.roundTripId,
    target.roundTripVersionId,
  ) as readonly ProjectionRow[];
  return toWorkspaceTradeLibraryRows(database, scope, rows)[0] ?? null;
}

export function readWorkspaceTradeLibrarySavedTrades(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  targets: readonly Readonly<{ roundTripId: string; roundTripVersionId: string }>[],
): readonly WorkspaceTradeLibraryRow[] {
  const unique = new Map<string, WorkspaceTradeLibraryRow>();
  for (const target of targets) {
    const trade = readWorkspaceTradeLibrarySavedTrade(database, scope, target);
    if (trade) unique.set(trade.roundTripId, trade);
  }
  return Object.freeze([...mergeLogicalWorkspaceRows(database, scope, Object.freeze([...unique.values()]))]
    .sort((left, right) =>
      `${left.entryDate}T${left.entryTime}`.localeCompare(`${right.entryDate}T${right.entryTime}`) ||
      left.roundTripId.localeCompare(right.roundTripId)));
}
