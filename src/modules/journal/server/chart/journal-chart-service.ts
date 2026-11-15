import "server-only";

import type Database from "better-sqlite3";
import Decimal from "decimal.js";
import type { ChartJournalFill, ChartJournalItem, ChartJournalPlan, ChartJournalPlot, ChartJournalPlotMode, ChartJournalTrade } from "../../contracts/journal-chart-contracts";
import { chartJournalNoteLimit } from "../../contracts/journal-chart-contracts";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { assertCanonicalUuidV4, createCanonicalUtcTimestamp, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { chartSymbol, easternDayStart } from "@/src/modules/scanner/alpaca/candles";
import { easternClock } from "@/src/modules/scanner/live/sessions";

const PAGE_SIZE = 250;
const tradingDate = /^\d{4}-\d{2}-\d{2}$/u;
const exactPrice = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,12})?$/u;
const instant = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

function invalid(): never {
  return platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "chartJournal" });
}

export function chartJournalSymbol(value: unknown) {
  if (typeof value !== "string") return invalid();
  try { return chartSymbol(value); } catch { return invalid(); }
}

export function chartJournalDay(value: unknown) {
  if (typeof value !== "string" || !tradingDate.test(value)) return invalid();
  const noon = new Date(`${value}T12:00:00.000Z`);
  if (!Number.isFinite(noon.getTime()) || noon.toISOString().slice(0, 10) !== value) return invalid();
  const start = easternDayStart(noon.getTime() / 1000);
  const end = easternDayStart(noon.getTime() / 1000 + 86400);
  return { day: value, start: new Date(start * 1000).toISOString(), end: new Date(end * 1000).toISOString() };
}

const TRADE_SELECT = `SELECT v.round_trip_id, v.round_trip_version_id, logical.logical_trade_id, i.normalized_symbol AS symbol,
v.opened_at_utc, v.closed_at_utc, v.direction, v.trade_currency, v.final_position_decimal,
style.trade_style
FROM journal_round_trips t
JOIN journal_round_trip_versions v
  ON v.workspace_id = t.workspace_id AND v.account_id = t.account_id AND v.round_trip_version_id = t.current_version_id
JOIN journal_instruments i ON i.workspace_id = v.workspace_id AND i.instrument_id = v.instrument_id
LEFT JOIN journal_trade_style_plans style
  ON style.workspace_id = t.workspace_id AND style.account_id = t.account_id AND style.round_trip_id = t.round_trip_id
LEFT JOIN journal_active_logical_trade_memberships logical
  ON logical.workspace_id = t.workspace_id AND logical.account_id = t.account_id AND logical.round_trip_id = t.round_trip_id
WHERE t.workspace_id = ? AND t.account_id = ? AND t.lifecycle_state = 'active'
  AND i.asset_class = 'stock' AND v.projection_state IN ('ready_closed', 'legitimate_open')`;

type TradeRow = {
  round_trip_id: string; round_trip_version_id: string; logical_trade_id: string | null; symbol: string;
  opened_at_utc: string; closed_at_utc: string | null; direction: ChartJournalTrade["direction"];
  trade_currency: string; final_position_decimal: string; trade_style: string | null;
};

type FillRow = {
  id: string; version: string; symbol: string; at: string; price: string | null;
  quantity: string; currency: string; side: ChartJournalFill["side"];
};

type ItemRow = {
  entry_id: string; kind: "note" | "plan"; symbol: string; anchor_at_utc: string;
  trading_date: string; note_text: string; plan_json: string | null; round_trip_id: string | null; revision: number;
};

function mapItem(row: ItemRow): ChartJournalItem {
  return {
    id: row.entry_id, kind: row.kind, symbol: row.symbol, at: row.anchor_at_utc,
    day: row.trading_date, text: row.note_text, plan: row.plan_json ? JSON.parse(row.plan_json) as ChartJournalPlan : null,
    roundTripId: row.round_trip_id, revision: row.revision,
  };
}

function mapTrade(row: TradeRow, positionRef: string | null): ChartJournalTrade {
  return {
    id: row.logical_trade_id ?? row.round_trip_id, roundTripId: row.round_trip_id,
    memberIds: [row.round_trip_id], symbol: row.symbol, openedAt: row.opened_at_utc, closedAt: row.closed_at_utc,
    direction: row.direction, currency: row.trade_currency, shareBalance: row.final_position_decimal.replace(/^-/, ""),
    style: row.trade_style === "swing" ? "swing" : "day_trade", positionRef,
  };
}

export function readChartJournal(
  database: Database.Database, scope: AccountScope, input: { symbol: string; day: string; page: number },
  positionRef: (target: { roundTripId: string; roundTripVersionId: string }) => string,
) {
  const { day, start, end } = chartJournalDay(input.day);
  const values = [scope.workspaceId, scope.accountId] as const;
  const rows = database.prepare(`SELECT v.execution_id AS id, v.execution_version_id AS version,
    i.normalized_symbol AS symbol, v.executed_at_utc AS at, v.price_decimal AS price,
    v.quantity_decimal AS quantity, v.trade_currency AS currency, v.side
FROM journal_execution_versions v
JOIN journal_executions e
  ON e.workspace_id = v.workspace_id AND e.account_id = v.account_id
  AND e.execution_id = v.execution_id AND e.current_version_id = v.execution_version_id
JOIN journal_instruments i ON i.workspace_id = v.workspace_id AND i.instrument_id = v.instrument_id
WHERE v.workspace_id = ? AND v.account_id = ? AND i.asset_class = 'stock' AND e.current_state = 'accepted'
  AND v.executed_at_utc >= ? AND v.executed_at_utc < ?
ORDER BY v.executed_at_utc, v.source_order_key, v.execution_id LIMIT ? OFFSET ?`)
    .all(...values, start, end, PAGE_SIZE + 1, input.page * PAGE_SIZE) as FillRow[];
  const fills = rows.slice(0, PAGE_SIZE);
  const keyedTrades = new Map<string, ChartJournalTrade>();
  const idsByFill = new Map<string, Set<string>>();
  if (fills.length) {
    const versions = fills.map((fill) => fill.version);
    const joined = database.prepare(`${TRADE_SELECT}
AND EXISTS (SELECT 1 FROM journal_round_trip_execution_allocations a
  WHERE a.workspace_id = v.workspace_id AND a.account_id = v.account_id AND a.round_trip_version_id = v.round_trip_version_id
    AND a.execution_version_id IN (${versions.map(() => "?").join(",")}))
ORDER BY v.opened_at_utc, v.round_trip_id`).all(...values, ...versions) as TradeRow[];
    const allocations = database.prepare(`SELECT execution_version_id AS version, round_trip_version_id AS trade
FROM journal_round_trip_execution_allocations
WHERE workspace_id = ? AND account_id = ?
  AND execution_version_id IN (${versions.map(() => "?").join(",")})`)
      .all(...values, ...versions) as { version: string; trade: string }[];
    const executionsByTrip = new Map<string, string[]>();
    for (const allocation of allocations) {
      const executionVersions = executionsByTrip.get(allocation.trade) ?? [];
      executionVersions.push(allocation.version);
      executionsByTrip.set(allocation.trade, executionVersions);
    }
    for (const row of joined) {
      const item = mapTrade(row, null);
      const prior = keyedTrades.get(item.id);
      keyedTrades.set(item.id, prior ? {
        ...prior, closedAt: prior.closedAt && item.closedAt ? (prior.closedAt > item.closedAt ? prior.closedAt : item.closedAt) : null,
        memberIds: [...prior.memberIds, ...item.memberIds],
      } : item);
      for (const version of executionsByTrip.get(row.round_trip_version_id) ?? []) {
        const ids = idsByFill.get(version) ?? new Set<string>();
        ids.add(item.id);
        idsByFill.set(version, ids);
      }
    }
  }
  const openPositions = (database.prepare(`${TRADE_SELECT}
AND i.normalized_symbol = ? AND v.projection_state = 'legitimate_open'
ORDER BY v.opened_at_utc, v.round_trip_id`).all(...values, input.symbol) as TradeRow[])
    .map((row) => mapTrade(row, positionRef({ roundTripId: row.round_trip_id, roundTripVersionId: row.round_trip_version_id })));
  const items = database.prepare(`SELECT item.* FROM journal_chart_entries item
WHERE item.workspace_id = ? AND item.account_id = ? AND item.symbol = ?
AND (item.trading_date = ? OR EXISTS (
  SELECT 1 FROM journal_round_trips t
  JOIN journal_round_trip_versions v
    ON v.workspace_id = t.workspace_id AND v.account_id = t.account_id AND v.round_trip_version_id = t.current_version_id
  WHERE t.workspace_id = item.workspace_id AND t.account_id = item.account_id
    AND t.round_trip_id = item.round_trip_id AND t.lifecycle_state = 'active'
    AND (v.projection_state = 'legitimate_open' OR EXISTS (
      SELECT 1 FROM journal_round_trip_execution_allocations a
      JOIN journal_execution_versions e ON e.workspace_id = a.workspace_id AND e.account_id = a.account_id
        AND e.execution_version_id = a.execution_version_id
      WHERE a.workspace_id = v.workspace_id AND a.account_id = v.account_id
        AND a.round_trip_version_id = v.round_trip_version_id AND e.executed_at_utc >= ? AND e.executed_at_utc < ?
    ))
)) ORDER BY item.anchor_at_utc, item.entry_id LIMIT ? OFFSET ?`)
    .all(...values, input.symbol, day, start, end, PAGE_SIZE + 1, input.page * PAGE_SIZE) as ItemRow[];
  return {
    day,
    fills: fills.map(({ version, at, ...fill }) => ({ ...fill, executedAt: at, tradeIds: [...(idsByFill.get(version) ?? [])] })),
    trades: [...keyedTrades.values()], openPositions,
    items: items.slice(0, PAGE_SIZE).map(mapItem),
    moreFills: rows.length > PAGE_SIZE,
    moreNotes: items.length > PAGE_SIZE,
  };
}

export function readChartJournalPlot(
  database: Database.Database, scope: AccountScope, { symbol, day, mode }: { symbol: string; day: string; mode: ChartJournalPlotMode },
): ChartJournalPlot {
  const { start, end } = chartJournalDay(day);
  const values = [scope.workspaceId, scope.accountId, symbol] as const;
  const fills = mode === "notes" ? [] : database.prepare(`SELECT v.execution_id AS id, v.executed_at_utc AS executedAt, v.side
FROM journal_execution_versions v
JOIN journal_executions e ON e.workspace_id = v.workspace_id AND e.account_id = v.account_id
  AND e.execution_id = v.execution_id AND e.current_version_id = v.execution_version_id
JOIN journal_instruments i ON i.workspace_id = v.workspace_id AND i.instrument_id = v.instrument_id
WHERE v.workspace_id = ? AND v.account_id = ? AND i.normalized_symbol = ?
  AND i.asset_class = 'stock' AND e.current_state = 'accepted'
  AND v.executed_at_utc >= ? AND v.executed_at_utc < ?
ORDER BY v.executed_at_utc, v.source_order_key, v.execution_id`).all(...values, start, end) as ChartJournalPlot["fills"];
  const notes = mode === "fills" ? [] : (database.prepare(`SELECT * FROM journal_chart_entries
WHERE workspace_id = ? AND account_id = ? AND symbol = ? AND kind = 'note' AND trading_date = ?
ORDER BY anchor_at_utc, entry_id`).all(...values, day) as ItemRow[]).map(mapItem);
  return { fills, notes };
}

export function readChartJournalTradeItems(database: Database.Database, scope: AccountScope, roundTripIds: readonly string[]) {
  if (!roundTripIds.length) return [];
  return (database.prepare(`SELECT * FROM journal_chart_entries
    WHERE workspace_id = ? AND account_id = ? AND round_trip_id IN (${roundTripIds.map(() => "?").join(",")})
    ORDER BY anchor_at_utc DESC, entry_id LIMIT ?`)
    .all(scope.workspaceId, scope.accountId, ...roundTripIds, PAGE_SIZE) as ItemRow[]).map(mapItem);
}

function inputRecord(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return invalid();
  return raw as Record<string, unknown>;
}

function price(value: unknown): string {
  if (typeof value !== "string" || !exactPrice.test(value) || !new Decimal(value).isPositive() || new Decimal(value).isZero()) return invalid();
  return value;
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string") return invalid();
  assertCanonicalUuidV4(value, field);
  return value;
}

function readPlan(raw: unknown): ChartJournalPlan {
  const plan = inputRecord(raw);
  const drawingId = uuid(plan.drawingId, "drawingId");
  const { direction } = plan;
  const entry = price(plan.entry), stop = price(plan.stop), target = price(plan.target);
  const p = new Decimal(entry), s = new Decimal(stop), t = new Decimal(target);
  if (direction === "long" ? !(s.lt(p) && p.lt(t)) : direction === "short" ? !(t.lt(p) && p.lt(s)) : true) return invalid();
  const priceBasisDate = chartJournalDay(plan.priceBasisDate).day;
  return { drawingId, direction: direction as ChartJournalPlan["direction"], entry, stop, target, priceBasisDate };
}

export function saveChartJournalItem(database: Database.Database, scope: AccountScope, raw: unknown, now = new Date()) {
  const input = inputRecord(raw);
  const id = uuid(input.id, "chartJournalEntryId");
  const symbol = chartJournalSymbol(input.symbol);
  const { kind, at, text, expectedRevision } = input;
  if ((kind !== "note" && kind !== "plan") || typeof text !== "string" || text.length > chartJournalNoteLimit || text.includes("\0") ||
    typeof at !== "string" || !instant.test(at) ||
    (expectedRevision !== null && (!Number.isSafeInteger(expectedRevision) || Number(expectedRevision) < 1))) return invalid();
  const anchor = new Date(at);
  if (!Number.isFinite(anchor.getTime()) || anchor.toISOString() !== at || anchor.getTime() > now.getTime() + 60_000 ||
    (kind === "note" && !text.trim())) return invalid();
  const day = easternClock(anchor.getTime()).date;
  const roundTripId = input.roundTripId === null ? null : uuid(input.roundTripId, "roundTripId");
  const plan = kind === "plan" ? readPlan(input.plan) : null;
  if ((plan && !roundTripId) || (kind === "note" && input.plan != null)) return invalid();
  const scopeArgs = [scope.workspaceId, scope.accountId] as const;
  return database.transaction(() => {
    if (roundTripId) {
      const trade = database.prepare(`${TRADE_SELECT} AND t.round_trip_id = ? AND i.normalized_symbol = ?`)
        .get(...scopeArgs, roundTripId, symbol) as TradeRow | undefined;
      if (!trade || (plan && trade.direction !== plan.direction)) return invalid();
    }
    const previous = database.prepare(`SELECT * FROM journal_chart_entries
      WHERE workspace_id = ? AND account_id = ? AND entry_id = ?`).get(...scopeArgs, id) as ItemRow | undefined;
    const planJson = plan ? JSON.stringify(plan) : null;
    if (previous) {
      if (previous.symbol !== symbol || previous.kind !== kind || previous.anchor_at_utc !== at) return invalid();
      if (previous.round_trip_id === roundTripId && previous.note_text === text.trim() && previous.plan_json === planJson) return mapItem(previous);
    }
    if ((previous?.revision ?? null) !== expectedRevision) return platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    if (kind === "plan") {
      const other = database.prepare(`SELECT entry_id FROM journal_chart_entries
        WHERE workspace_id = ? AND account_id = ? AND round_trip_id = ? AND kind = 'plan'`).get(...scopeArgs, roundTripId) as { entry_id: string } | undefined;
      if (other && other.entry_id !== id) return platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    }
    const revision = (previous?.revision ?? 0) + 1;
    const updatedAt = createCanonicalUtcTimestamp(now);
    database.prepare(`INSERT INTO journal_chart_entries
      (workspace_id, account_id, entry_id, author_user_id, symbol, kind, anchor_at_utc, trading_date, note_text, plan_json, round_trip_id, revision, updated_at_utc)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(workspace_id, account_id, entry_id) DO UPDATE SET note_text = excluded.note_text,
        plan_json = excluded.plan_json, round_trip_id = excluded.round_trip_id, revision = excluded.revision, updated_at_utc = excluded.updated_at_utc`)
      .run(...scopeArgs, id, scope.userId, symbol, kind, at, day, text.trim(), planJson, roundTripId, revision, updatedAt);
    return mapItem({ entry_id: id, kind, symbol, anchor_at_utc: at, trading_date: day, note_text: text.trim(), plan_json: planJson, round_trip_id: roundTripId, revision });
  }).immediate();
}
