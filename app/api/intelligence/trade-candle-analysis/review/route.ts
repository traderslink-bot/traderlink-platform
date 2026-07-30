import { analyzeTradeCandles } from "@/src/lib/trade-candle-analysis/candle-analysis";
import { resolveCompletedCandleReviewTrade } from "@/src/lib/trade-candle-analysis/completed-trade";
import { selectExecutionRelevantPatterns } from "@/src/lib/trade-candle-analysis/execution-relevance";
import {
  calculateAdr20,
  calculateIndicatorPoints,
  indicatorSnapshot,
} from "@/src/lib/trade-candle-analysis/indicator-context";
import { detectMicroCapCandlePatterns } from "@/src/lib/trade-candle-analysis/pattern-detection";
import {
  readStoredTradeCandleReview,
  reviewRefreshAvailable,
  TRADE_CANDLE_REVIEW_VERSION,
  writeStoredTradeCandleReview,
  type StoredTradeCandleReview,
} from "@/src/lib/trade-candle-analysis/review-store";
import { fetchYahooDailyCandles, fetchYahooOneMinuteCandles } from "@/src/lib/trade-candle-analysis/yahoo-candles";
import { resolveConfiguredDashboardAnalytics } from "@/src/lib/trader-intelligence-v3/analytics/dashboard/configured-dashboard-analytics";
import {
  requireTraderIntelligenceOwnerPageAccess,
  withTraderIntelligenceOwnerRoute,
} from "@/src/lib/trader-intelligence-v3/auth";
import { validateTraderIntelligenceDeployment } from "@/src/lib/trader-intelligence-v3/deployment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_PATH = "app/api/intelligence/trade-candle-analysis/review/route.ts";
const REFRESH_COOLDOWN_MS = 60 * 1000;

function unavailable(message: string, status = 422): Response {
  return Response.json({ status: "unavailable", message }, { status });
}

function responseFor(record: StoredTradeCandleReview, reused: boolean): Response {
  return Response.json({
    analysis: record.analysis,
    analyzedAt: record.analyzedAt,
    analysisVersion: record.analysisVersion,
    observations: record.observations,
    indicators: record.indicators,
    refreshAvailableAt: record.refreshAvailableAt,
    reused,
    status: record.status,
    trade: {
      direction: record.trade.direction,
      entryPrice: record.trade.entryPrice,
      entryTime: record.trade.entryTime,
      exitPrice: record.trade.exitPrice,
      exitTime: record.trade.exitTime,
      symbol: record.trade.symbol,
    },
  });
}

async function POSTHandler(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return unavailable("Choose a completed trade to analyze.", 400);
  }
  const semanticRoundTripKey =
    typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>).semanticRoundTripKey
      : null;
  if (typeof semanticRoundTripKey !== "string" || semanticRoundTripKey.length > 512) {
    return unavailable("Choose a completed trade to analyze.", 400);
  }

  const deployment = validateTraderIntelligenceDeployment(process.env);
  if (!deployment.ok || deployment.config.persistence.kind !== "file") {
    return unavailable("Trade candle review is not configured for this dashboard.", 503);
  }
  const owner = await requireTraderIntelligenceOwnerPageAccess(ROUTE_PATH);
  const analytics = resolveConfiguredDashboardAnalytics({
    owner,
    config: deployment.config,
    environment: process.env,
  });
  if (!analytics.ok) return unavailable("Verified completed trades are not available yet.", 409);
  const trade = resolveCompletedCandleReviewTrade({
    analytics: analytics.value,
    semanticRoundTripKey,
  });
  if (!trade) return unavailable("That completed trade is not available for candle review.", 404);

  const stored = readStoredTradeCandleReview({
    parentPath: deployment.config.persistence.parentPath,
    trade,
  });
  if (stored && !reviewRefreshAvailable(stored)) return responseFor(stored, true);

  const analyzedAt = new Date().toISOString();
  const refreshAvailableAt = new Date(Date.now() + REFRESH_COOLDOWN_MS).toISOString();
  const yahoo = await fetchYahooOneMinuteCandles({
    symbol: trade.symbol,
    startTime: trade.entryTime - 30 * 60,
    endTime: trade.exitTime + 60 * 60,
  });
  if (!yahoo.ok) {
    return unavailable("Yahoo candles are unavailable for this completed trade. Nothing was saved.", 503);
  }
  const daily = await fetchYahooDailyCandles({
    symbol: trade.symbol,
    startTime: trade.exitTime - 180 * 24 * 60 * 60,
    endTime: trade.exitTime,
  });
  const indicatorPoints = calculateIndicatorPoints(yahoo.candles);
  const adr20 = daily.ok
    ? calculateAdr20(daily.candles.map((candle) => candle.high - candle.low))
    : null;
  const result = analyzeTradeCandles({ candles: yahoo.candles, trade });
  const noUsableCoverage = [
    result.entryTiming,
    result.exitTiming,
    result.profitGiveback,
  ].every((feedback) => feedback.kind === "no_feedback");
  const record: StoredTradeCandleReview = Object.freeze({
    analysis: result,
    analysisVersion: TRADE_CANDLE_REVIEW_VERSION,
    analyzedAt,
    indicators: [
      indicatorSnapshot({ adr20, phase: "entry", points: indicatorPoints, time: trade.entryTime }),
      indicatorSnapshot({ adr20, phase: "exit", points: indicatorPoints, time: trade.exitTime }),
    ].filter((snapshot): snapshot is NonNullable<typeof snapshot> => snapshot !== null),
    observations: selectExecutionRelevantPatterns({
      candles: yahoo.candles,
      events: detectMicroCapCandlePatterns(yahoo.candles),
      trade,
    }),
    refreshAvailableAt,
    status: noUsableCoverage ? "no_coverage" : "ready",
    trade,
  });
  if (!writeStoredTradeCandleReview({ parentPath: deployment.config.persistence.parentPath, record })) {
    return unavailable("The candle review could not be saved. Try again shortly.", 503);
  }
  return responseFor(record, false);
}

export const POST = withTraderIntelligenceOwnerRoute(ROUTE_PATH, POSTHandler);
