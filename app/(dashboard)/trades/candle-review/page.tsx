import type { Metadata } from "next";

import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";

import { DashboardDataScopeChip, DashboardPage, DashboardPanel, DashboardUnavailableState } from "../../../dashboard-template";
import { resolveConfiguredDashboardAnalytics } from "@/src/lib/trader-intelligence-v3/analytics/dashboard/configured-dashboard-analytics";
import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";
import { validateTraderIntelligenceDeployment } from "@/src/lib/trader-intelligence-v3/deployment";
import { resolveCompletedCandleReviewTrade } from "@/src/lib/trade-candle-analysis/completed-trade";
import { readStoredTradeCandleReview } from "@/src/lib/trade-candle-analysis/review-store";

import { TradeCandleReviewClient } from "./trade-candle-review-client";

export const metadata: Metadata = { title: "Candle Review | Trader Intelligence" };

export default async function TradeCandleReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ trade?: string }>;
}) {
  const key = (await searchParams).trade;
  const owner = await requireTraderIntelligenceOwnerPageAccess();
  const deployment = validateTraderIntelligenceDeployment(process.env);
  const analytics = deployment.ok
    ? resolveConfiguredDashboardAnalytics({ owner, config: deployment.config, environment: process.env })
    : null;

  if (!key || !analytics?.ok || !deployment.ok || deployment.config.persistence.kind !== "file") {
    return (
      <DashboardPage>
        <DashboardPanel title="Candle review">
          <DashboardUnavailableState
            actionHref="/trades/roundtrips"
            actionLabel="View completed trades"
            description="Choose a verified completed round trip before requesting an experimental candle review."
          />
        </DashboardPanel>
      </DashboardPage>
    );
  }
  const trade = resolveCompletedCandleReviewTrade({
    analytics: analytics.value,
    semanticRoundTripKey: key,
  });
  if (!trade) {
    return (
      <DashboardPage>
        <DashboardPanel title="Candle review">
          <Alert severity="info">This completed trade is no longer available from the verified execution authority.</Alert>
        </DashboardPanel>
      </DashboardPage>
    );
  }
  const stored = readStoredTradeCandleReview({
    parentPath: deployment.config.persistence.parentPath,
    trade,
  });
  return (
    <DashboardPage>
      <div>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">Trades</Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">Candle Review</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 760, mt: 1 }} variant="body2">
          Evidence-gated price-path feedback for one verified completed round trip.
        </Typography>
      </div>
      <DashboardDataScopeChip />
      <TradeCandleReviewClient
        initialReview={stored}
        trade={{
          direction: trade.direction,
          entryPrice: trade.entryPrice,
          entryTime: trade.entryTime,
          exitPrice: trade.exitPrice,
          exitTime: trade.exitTime,
          semanticRoundTripKey: trade.semanticRoundTripKey,
          symbol: trade.symbol,
        }}
      />
    </DashboardPage>
  );
}
