import Decimal from "decimal.js";
import type { NormalizedMarketCandle } from "@/src/modules/level-analysis/contracts/candle-review-contracts";
import type { DailyTradeAnalyzerEvent } from "@/src/modules/level-analysis/contracts/daily-trade-analyzer-contracts";
import { analyzeDailyTrade } from "@/src/modules/level-analysis/server/daily-trade-analyzer";
import { dailyTradeFirstResultCoverageEnd, newYorkExtendedSession } from "@/src/modules/level-analysis/server/daily-trade-analyzer-session";
import { buildTradeIndicatorInput } from "@/src/modules/level-analysis/server/trend-momentum-input";
import { priorIndicatorHistoryRanges } from "@/src/modules/level-analysis/server/trend-momentum-history-ranges";
import { moomooV1AnalyzerCandles, moomooV1ObservedCoverage } from "@/src/modules/level-analysis/server/providers/moomoo-analyzer-candle-time";
import { hasCompletedIndicatorCoverage, inspectIndicatorWarmup, type IndicatorHistoryRange } from "@/src/lib/trade-candle-analysis/trend-momentum-history";

export type DemoIndicatorReceipt = Readonly<{
  provider: "moomoo_history_kline";
  adapterVersion: "moomoo_history_kline_v1";
  symbol: string;
  range: IndicatorHistoryRange;
  complete: boolean;
  candles: readonly NormalizedMarketCandle[];
}>;

/** Saved-only calculation for one current logical trade, including all cycles.
 * The caller owns authorization, verified receipt selection, and persistence.
 * Never creates trades, changes prices, grants provider access, or fetches data.
 */
export function prepareJournalDemoTrendMomentum(input: Readonly<{
  symbol: string;
  tradingDateNewYork: string;
  direction: "long" | "short";
  events: readonly DailyTradeAnalyzerEvent[];
  receipts: readonly DemoIndicatorReceipt[];
}>) {
  const session = newYorkExtendedSession(input.tradingDateNewYork);
  const first = input.events[0], last = input.events.at(-1);
  if (!session || !first || !last || last.kind !== "final_exit") throw new Error("demo_indicator_target_invalid");
  const earliest = Date.parse(first.executedAtUtc) / 1000;
  const final = Date.parse(last.executedAtUtc) / 1000;
  if (!Number.isFinite(earliest) || !Number.isFinite(final) || earliest < session.startTime ||
    final >= session.endTime || final <= earliest || input.events.some((event, index) => {
      const at = Date.parse(event.executedAtUtc) / 1000;
      return !Number.isFinite(at) || at < earliest || at > final ||
        (index > 0 && at < Date.parse(input.events[index - 1].executedAtUtc) / 1000);
    })) throw new Error("demo_indicator_target_invalid");
  const asOf = dailyTradeFirstResultCoverageEnd(session, last.executedAtUtc)!;
  const lower = priorIndicatorHistoryRanges(input.tradingDateNewYork).at(-1)!.start;
  const ranges: IndicatorHistoryRange[] = [];
  const candles = new Map<number, NormalizedMarketCandle>();
  for (const receipt of input.receipts) {
    if (receipt.provider !== "moomoo_history_kline" || receipt.adapterVersion !== "moomoo_history_kline_v1" ||
      receipt.symbol !== input.symbol) throw new Error("demo_indicator_receipt_identity_invalid");
    // Keep the pinned trade-day completion gate. A partial earlier session can
    // contribute only its individually observed minutes, never its missing gaps.
    if (!receipt.complete && receipt.range.endExclusive > session.startTime) continue;
    const start = Math.max(lower, receipt.range.start), endExclusive = Math.min(asOf, receipt.range.endExclusive);
    if (endExclusive <= start) continue;
    const range = { start, endExclusive };
    for (const candle of moomooV1AnalyzerCandles(receipt.candles, range)) {
      const existing = candles.get(candle.time);
      if (existing && ["openDecimal", "highDecimal", "lowDecimal", "closeDecimal", "volumeDecimal", "turnoverDecimal"]
        .some((key) => {
          const left = existing[key as keyof NormalizedMarketCandle] ?? null;
          const right = candle[key as keyof NormalizedMarketCandle] ?? null;
          return left === null || right === null ? left !== right : !new Decimal(left).equals(right);
        })) {
        throw new Error("demo_indicator_receipt_conflict");
      }
      if (!existing) candles.set(candle.time, candle);
    }
    ranges.push(...(receipt.complete ? [range] : moomooV1ObservedCoverage(receipt.candles, range)));
  }
  const normalized = [...candles.values()].sort((a, b) => a.time - b.time);
  const history = { asOf, completedRanges: ranges, candles: normalized.map((bar) => ({
    time: bar.time, open: Number(bar.openDecimal), high: Number(bar.highDecimal), low: Number(bar.lowDecimal),
    close: Number(bar.closeDecimal), volume: Number(bar.volumeDecimal),
    turnover: bar.turnoverDecimal == null ? null : Number(bar.turnoverDecimal),
  })) };
  const warmup = inspectIndicatorWarmup({ ...history, asOf: Math.floor(earliest) },
    [{ interval: "1m", requiredBars: 200 }, { interval: "5m", requiredBars: 200 }]);
  if (!hasCompletedIndicatorCoverage(ranges, session.startTime, asOf)) {
    return { status: "session_history_missing" as const, warmup, analyzed: null, candles: [] };
  }
  const current = normalized.filter((bar) => bar.time >= session.startTime);
  if (!current.length) return { status: "session_history_missing" as const, warmup, analyzed: null, candles: [] };
  // Missing saved history does not prove the provider exhausted its history.
  const historyOutcome = warmup.every((frame) => frame.missingBars === 0) ? "complete" : "history_unavailable";
  return { status: "prepared" as const, warmup, candles: current,
    analyzed: analyzeDailyTrade({ candles: current, events: input.events, direction: input.direction, dailyRanges: [],
      trendMomentum: { ...buildTradeIndicatorInput(input.tradingDateNewYork, history), historyOutcome } }),
  };
}
