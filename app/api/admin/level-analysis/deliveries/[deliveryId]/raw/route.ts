import {
  getJournalLevelAnalysisRawPayloadForAdminApi,
  journalLevelAnalysisDeliveryErrorResponse,
} from "../../../../../../../src/lib/level-analysis/level-analysis-journal-delivery-api-service";
import {
  isLevelAnalysisDeliveryApiEnabled,
  isLevelAnalysisDeliveryRawDebugEnabled,
} from "../../../../../../../src/lib/level-analysis/level-analysis-journal-delivery-persistence-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ deliveryId: string }> },
): Promise<Response> {
  if (
    !isLevelAnalysisDeliveryApiEnabled() ||
    !isLevelAnalysisDeliveryRawDebugEnabled()
  ) {
    return journalLevelAnalysisDeliveryErrorResponse(
      404,
      "feature_disabled",
      "Level analysis delivery raw debug API is disabled.",
    );
  }

  const params = await context.params;
  return Response.json(
    getJournalLevelAnalysisRawPayloadForAdminApi({
      deliveryId: params.deliveryId,
    }),
  );
}
