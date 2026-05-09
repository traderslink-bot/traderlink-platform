import type { Metadata } from "next";
import { buildSavedReviewQueueReadModel } from "../../src/lib/trader-analytics/server/saved-review-queue";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "../../src/lib/trader-analytics/server/saved-trader-analytics-data";
import { buildLatestSavedImportSourceCautionReadModel } from "../../src/lib/trader-analytics/server/saved-import-source-caution";
import { AnalyticsClient } from "./analytics-client";

export const metadata: Metadata = {
  title: "Analytics | Trader Intelligence",
};

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  const analyticsData = buildSavedOrSampleTraderAnalyticsViewModel();
  const savedReviewQueue =
    analyticsData.mode === "saved"
      ? buildSavedReviewQueueReadModel({
          repository: analyticsData.repository,
          userId: analyticsData.userId,
        })
      : null;
  const importSourceCaution =
    analyticsData.mode === "saved"
      ? buildLatestSavedImportSourceCautionReadModel({
          repository: analyticsData.repository,
        })
      : null;

  return (
    <AnalyticsClient
      initialViewModel={analyticsData.viewModel}
      savedReviewQueue={savedReviewQueue}
      importSourceCaution={importSourceCaution}
    />
  );
}
