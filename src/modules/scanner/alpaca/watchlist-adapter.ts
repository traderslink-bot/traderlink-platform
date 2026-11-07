import "server-only";
import { createHash } from "node:crypto";
import type { IndicatorHistoryBudget, IndicatorHistoryOutcome, IndicatorHistoryRequest, IndicatorHistoryPage } from "@/src/lib/live-watchlist/indicators/indicator-history-provider";
import type { IndicatorRequestCoordinator } from "@/src/lib/live-watchlist/indicators/indicator-request-coordinator";
import type { MarketDataRequest, MarketDataProviderResult } from "@/src/modules/level-analysis/contracts/candle-review-contracts";
import { readAlpacaHistory } from "./client";

export async function fetchAlpacaIndicatorHistory(input: { request: IndicatorHistoryRequest; coordinator: IndicatorRequestCoordinator; consumer: string; budget: IndicatorHistoryBudget; isCurrent: () => Promise<boolean> }): Promise<IndicatorHistoryOutcome> {
  const finish = (outcome: IndicatorHistoryOutcome["outcome"], bars: IndicatorHistoryPage["bars"] = [], transportIds: readonly string[] = []): IndicatorHistoryOutcome => ({ provider: "alpaca", adjustment: "alpaca-split", bars, transportIds, pages: transportIds.length, outcome, nextEnd: null });
  if (input.budget.attemptsRemaining <= 0) return finish("budget_exhausted");
  const timeframe = { "1m": "1Min", "5m": "5Min", "15m": "15Min", "1d": "1Day" }[input.request.timeframe] as "1Min" | "5Min" | "15Min" | "1Day";
  const result = await input.coordinator.request<IndicatorHistoryPage>({ provider: "alpaca", scope: "alpaca-vps-sip", requestKey: JSON.stringify(input.request), consumer: input.consumer, maxAttempts: 1, isCurrent: input.isCurrent,
    execute: async signal => {
      try {
        const data = await readAlpacaHistory({ ...input.request, timeframe }, process.env, signal);
        const bars = data.bars.map(bar => ({ start: bar.time * 1000, open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: bar.volume }));
        return { ok: true, requestAccepted: true, usable: bars.length > 0, data: { bars, hasMore: false, nextEnd: null } };
      } catch { return { ok: false, reason: "provider_error", requestAccepted: false }; }
    } });
  input.budget.attemptsRemaining -= result.transportIds.length;
  if (result.kind === "deferred") return { ...finish("deferred", [], result.transportIds), retryAt: result.retryAt };
  if (!result.result.ok) return finish(result.result.reason, [], result.transportIds);
  return finish(result.result.usable ? "complete" : "no_data", result.result.data.bars, result.transportIds);
}

export async function fetchAlpacaWatchlistCandles(input: MarketDataRequest, environment: NodeJS.ProcessEnv = process.env): Promise<MarketDataProviderResult> {
  try {
    const data = await readAlpacaHistory({ symbol: input.symbol, timeframe: input.interval === "1d" ? "1Day" : "1Min", start: input.startTime * 1000, end: input.endTime * 1000 }, environment);
    if (!data.bars.length) return { ok: false, code: "coverage_unavailable", failureReasonCode: "alpaca_no_candles", exchangeTimezone: "America/New_York", utcOffsetSeconds: null };
    const candles = data.bars.map(bar => ({ time: bar.time, openDecimal: String(bar.open), highDecimal: String(bar.high), lowDecimal: String(bar.low), closeDecimal: String(bar.close), volumeDecimal: String(bar.volume), turnoverDecimal: null }));
    return { ok: true, candles, exchangeTimezone: "America/New_York", utcOffsetSeconds: null, normalizedCandleSha256: createHash("sha256").update(`${JSON.stringify(candles)}\n`, "utf8").digest("hex") };
  } catch { return { ok: false, code: "provider_unavailable", failureReasonCode: "alpaca_market_data_unavailable", exchangeTimezone: "America/New_York", utcOffsetSeconds: null }; }
}
