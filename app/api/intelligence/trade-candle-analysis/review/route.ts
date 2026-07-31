import { resolveCompletedCandleReviewTrade } from "@/src/lib/trade-candle-analysis/completed-trade";
import { runTradeCandleReview } from "@/src/lib/trade-candle-analysis/review-runner";
import type { StoredTradeCandleReview } from "@/src/lib/trade-candle-analysis/review-store";
import { resolveConfiguredDashboardAnalytics } from "@/src/lib/trader-intelligence-v3/analytics/dashboard/configured-dashboard-analytics";
import {
  requireTraderIntelligenceOwnerPageAccess,
  withTraderIntelligenceOwnerRoute,
} from "@/src/lib/trader-intelligence-v3/auth";
import { validateTraderIntelligenceDeployment } from "@/src/lib/trader-intelligence-v3/deployment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_PATH = "app/api/intelligence/trade-candle-analysis/review/route.ts";

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

  const review = await runTradeCandleReview({
    parentPath: deployment.config.persistence.parentPath,
    trade,
  });
  if (review.kind === "provider_unavailable") {
    return unavailable(
      "Yahoo could not be reached for this completed trade. Nothing was saved; try again shortly.",
      503,
    );
  }
  if (review.kind === "save_failed") {
    return unavailable("The candle review could not be saved. Try again shortly.", 503);
  }
  return responseFor(review.record, review.kind === "reused");
}

export const POST = withTraderIntelligenceOwnerRoute(ROUTE_PATH, POSTHandler);
