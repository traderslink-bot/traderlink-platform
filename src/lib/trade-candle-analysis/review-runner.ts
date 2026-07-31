import "server-only";

import { analyzeTradeCandles } from "./candle-analysis";
import type { CompletedCandleReviewTrade } from "./completed-trade";
import { selectExecutionRelevantPatterns } from "./execution-relevance";
import {
  calculateAdr20,
  calculateIndicatorPoints,
  indicatorSnapshot,
} from "./indicator-context";
import { detectMicroCapCandlePatterns } from "./pattern-detection";
import {
  readStoredTradeCandleReview,
  reviewRefreshAvailable,
  TRADE_CANDLE_REVIEW_VERSION,
  writeStoredTradeCandleReview,
  type StoredTradeCandleReview,
} from "./review-store";
import { fetchYahooDailyCandles, fetchYahooOneMinuteCandles } from "./yahoo-candles";

const REFRESH_COOLDOWN_MS = 60 * 1000;

export type TradeCandleReviewRunResult =
  | { readonly kind: "saved"; readonly record: StoredTradeCandleReview }
  | { readonly kind: "reused"; readonly record: StoredTradeCandleReview }
  | { readonly kind: "provider_unavailable" }
  | { readonly kind: "save_failed" };

/** Runs one owner-resolved review. It never accepts browser prices, times, or symbols. */
export async function runTradeCandleReview(args: {
  parentPath: string;
  trade: CompletedCandleReviewTrade;
}): Promise<TradeCandleReviewRunResult> {
  const stored = readStoredTradeCandleReview(args);
  if (stored && !reviewRefreshAvailable(stored)) return { kind: "reused", record: stored };

  const analyzedAt = new Date().toISOString();
  const yahoo = await fetchYahooOneMinuteCandles({
    symbol: args.trade.symbol,
    startTime: args.trade.entryTime - 30 * 60,
    endTime: args.trade.exitTime + 60 * 60,
  });
  if (!yahoo.ok) return { kind: "provider_unavailable" };

  const daily = await fetchYahooDailyCandles({
    symbol: args.trade.symbol,
    startTime: args.trade.exitTime - 180 * 24 * 60 * 60,
    endTime: args.trade.exitTime,
  });
  const indicatorPoints = calculateIndicatorPoints(yahoo.candles);
  const adr20 = daily.ok
    ? calculateAdr20(daily.candles.map((candle) => candle.high - candle.low))
    : null;
  const analysis = analyzeTradeCandles({ candles: yahoo.candles, trade: args.trade });
  const noUsableCoverage = [
    analysis.entryTiming,
    analysis.exitTiming,
    analysis.profitGiveback,
  ].every((feedback) => feedback.kind === "no_feedback");
  const record: StoredTradeCandleReview = Object.freeze({
    analysis,
    analysisVersion: TRADE_CANDLE_REVIEW_VERSION,
    analyzedAt,
    indicators: [
      indicatorSnapshot({ adr20, phase: "entry", points: indicatorPoints, time: args.trade.entryTime }),
      indicatorSnapshot({ adr20, phase: "exit", points: indicatorPoints, time: args.trade.exitTime }),
    ].filter((snapshot): snapshot is NonNullable<typeof snapshot> => snapshot !== null),
    observations: selectExecutionRelevantPatterns({
      candles: yahoo.candles,
      events: detectMicroCapCandlePatterns(yahoo.candles),
      trade: args.trade,
    }),
    refreshAvailableAt: new Date(Date.now() + REFRESH_COOLDOWN_MS).toISOString(),
    status: noUsableCoverage ? "no_coverage" : "ready",
    trade: args.trade,
  });
  return writeStoredTradeCandleReview({ parentPath: args.parentPath, record })
    ? { kind: "saved", record }
    : { kind: "save_failed" };
}
