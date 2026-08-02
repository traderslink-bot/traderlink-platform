import type { Metadata } from "next";

import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";

import { DashboardDataScopeChip, DashboardPage, DashboardPanel, DashboardUnavailableState } from "../../../dashboard-template";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";

import { readCandleReviewPageModel } from "./candle-review-platform-runtime";
import { TradeCandleReviewClient } from "./trade-candle-review-client";

export const metadata: Metadata = { title: "Candle Review | TraderLink Platform" };
export const dynamic = "force-dynamic";

export default async function TradeCandleReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ trade?: string }>;
}) {
  const key = (await searchParams).trade;
  if (!key || !isCanonicalUuidV4(key)) {
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
  const scope = await requireTraderLinkPlatformPageScope();
  const model = readCandleReviewPageModel(scope, key);
  if (!model) {
    return (
      <DashboardPage>
        <DashboardPanel title="Candle review">
          <Alert severity="info">This completed trade is not available from the selected Journal account.</Alert>
        </DashboardPanel>
      </DashboardPage>
    );
  }
  return (
    <DashboardPage>
      <div>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">Trades</Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">Candle Review</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 760, mt: 1 }} variant="body2">
          Evidence-gated price-path feedback for one completed Journal round trip.
        </Typography>
      </div>
      <DashboardDataScopeChip />
      <TradeCandleReviewClient initialReview={model.review} selectionRef={model.expectedAccountSelectionRef} trade={model.target} />
    </DashboardPage>
  );
}
