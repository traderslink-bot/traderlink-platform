import { createHash } from "node:crypto";
import type { SavedPatternTrade } from "../../../lib/trade-candle-analysis/trend-momentum-patterns";
import { buildTrendMomentumProjection, type IndicatorExecutionKind } from "../../../lib/trade-candle-analysis/trend-momentum-analytics";
import { buildIndicatorCohorts, indicatorSupportingSelection } from "../../../lib/trade-candle-analysis/trend-momentum-cohorts";
import type { DailyTradeAnalyzedTradePage } from "./daily-trade-analysis-evidence-service";
import { platformFailure } from "../../platform/server/database/platform-migration-contract";

const labels: Record<IndicatorExecutionKind, string> = { initial_entry: "initial entry", re_entry: "re-entry", add: "add", partial_exit: "partial exit", position_close: "interim closure", final_exit: "final exit" };
const fieldLabels: Record<string, string> = { alignment: "EMA9 vs EMA20", ema9Direction: "EMA9 direction", ema20Direction: "EMA20 direction", separation: "EMA spacing", rsiBand: "RSI range", rsiDirection: "RSI direction", vwapSide: "Price vs VWAP", spacing: "Candle spacing" };
const values: Record<string, string> = { above: "above", below: "below", close: "close together", rising: "rising", falling: "falling", little_change: "little change", expanding: "expanding", contracting: "contracting", below_30: "below 30", "30_to_below_50": "30 to below 50", "50_to_70": "50 to 70", above_70: "above 70", near: "near", standard: "regular", sparse: "gaps between returned candles" };
const invalid = () => platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "analyzedTradeSelection" });

export function pageSavedAnalyzedTrades(trades: readonly SavedPatternTrade[], input: {
  query: URLSearchParams; timezone: string; scopeIdentity: string; pageSize: number; cursor: string | null; ticker: string;
}): DailyTradeAnalyzedTradePage {
  if (![10, 25, 50, 100].includes(input.pageSize)) return invalid();
  const direction = input.query.get("direction");
  if (direction && direction !== "long" && direction !== "short") return invalid();
  const selected = indicatorSupportingSelection(input.query, direction === "short" ? "short" : "long");
  const hasIndicators = [...input.query.keys()].some((key) => key.startsWith("indicator_"));
  const scoped = trades.filter((trade) => (!direction || trade.direction === direction) && trade.symbol.toUpperCase().includes(input.ticker.trim().toUpperCase()));
  const projection = buildTrendMomentumProjection(scoped.map(({ analyzed, ...trade }) => ({ ...trade, analysis: analyzed })));
  const group = hasIndicators ? buildIndicatorCohorts(projection, selected.interval, selected.kind, selected.filters)[selected.group] : null;
  const byTrade = new Map<string, typeof projection.records[number][]>();
  for (const record of group?.rows ?? []) { const found = byTrade.get(record.tradeId) ?? []; found.push(record); byTrade.set(record.tradeId, found); }
  const rows = scoped.filter((trade) => !group || byTrade.has(trade.tradeId)).sort((a, b) => b.closedAtUtc.localeCompare(a.closedAtUtc) || b.tradeId.localeCompare(a.tradeId));
  const signature = createHash("sha256").update(JSON.stringify([input.scopeIdentity, direction, hasIndicators,
    selected.interval, selected.kind, selected.group, selected.filters, ["start", "end", "basis"].map((key) => input.query.get(key)), input.pageSize, input.ticker, input.timezone,
    rows.map((trade) => [trade.tradeId, trade.analysisVersionId, trade.pnlDecimal, trade.returnPercentDecimal])])).digest("hex");
  let start = 0;
  if (input.cursor) {
    if (input.cursor.length > 4096 || !/^[A-Za-z0-9_-]+$/.test(input.cursor)) return invalid();
    let cursor: { signature?: unknown; trade?: unknown };
    try { cursor = JSON.parse(Buffer.from(input.cursor, "base64url").toString("utf8")); } catch { return invalid(); }
    if (!cursor || cursor.signature !== signature || typeof cursor.trade !== "string") return invalid();
    start = rows.findIndex((trade) => trade.tradeId === cursor.trade) + 1;
    if (!start) return invalid();
  }
  const page = rows.slice(start, start + input.pageSize);
  const conditions = Object.entries(selected.filters).filter(([, value]) => value !== "any").map(([key, value]) => `${fieldLabels[key]}: ${values[value]}`).join("; ");
  return { timezone: input.timezone, totalRowCount: rows.length,
    ...(group ? { indicatorSummary: `${selected.group === "matching" ? "Matching trades" : selected.group === "unknown" ? "Required indicator context unavailable" : "Non-matching trades"} · ${labels[selected.kind]} · ${selected.interval === "1m" ? "1 minute" : "5 minutes"}${conditions ? ` · ${conditions}` : ""}` } : {}),
    continuationCursor: start + page.length < rows.length ? Buffer.from(JSON.stringify({ signature, trade: page.at(-1)!.tradeId })).toString("base64url") : null,
    rows: page.map((trade) => {
      const matching = byTrade.get(trade.tradeId), events = [...trade.analyzed.eventSnapshots].sort((a, b) => a.event.sequence - b.event.sequence);
      return { roundTripId: trade.tradeId, symbol: trade.symbol, direction: trade.direction, trackerDate: trade.trackerDate,
        openedAtUtc: trade.openedAtUtc, closedAtUtc: trade.closedAtUtc, executionCount: events.length,
        firstExecutionId: matching?.[0]?.executionId ?? events[0]?.event.eventId ?? null,
        resultDecimal: trade.pnlDecimal, returnPercentDecimal: trade.returnPercentDecimal,
        ...(group ? { whyIncluded: selected.group === "matching" ? `${matching?.length ?? 0} ${labels[selected.kind]} execution(s) matched all selected conditions.` : selected.group === "unknown" ? `Required context was missing for at least one ${labels[selected.kind]}; none was a confirmed match.` : `No ${labels[selected.kind]} matched; the required indicator context was available.` } : {}) };
    }) };
}
