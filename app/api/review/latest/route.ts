import { buildGuidedReviewSession } from "../../../../src/lib/trader-analytics";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "../../../../src/lib/trader-analytics/server/saved-trader-analytics-data";
import { buildSavedDecisionReviewReadModel } from "../../../../src/lib/trader-analytics/server/saved-decision-review-service";
import { buildSavedReviewQueueReadModel } from "../../../../src/lib/trader-analytics/server/saved-review-queue";
import { buildLatestSavedImportSourceCautionReadModel } from "../../../../src/lib/trader-analytics/server/saved-import-source-caution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const data = buildSavedOrSampleTraderAnalyticsViewModel();

  return Response.json({
    contractVersion: "latest_review_api_v1",
    source: data.mode === "saved" ? "saved_sqlite" : "sample_fallback",
    review: buildGuidedReviewSession({ analytics: data.viewModel }),
    savedDecisionReview:
      data.mode === "saved"
        ? buildSavedDecisionReviewReadModel({ repository: data.repository })
        : null,
    savedReviewQueue:
      data.mode === "saved"
        ? buildSavedReviewQueueReadModel({ repository: data.repository })
        : null,
    savedImportSourceCaution:
      data.mode === "saved"
        ? buildLatestSavedImportSourceCautionReadModel({
            repository: data.repository,
          })
        : null,
  });
}
