import {
  getLatestJournalLevelAnalysisDeliveryForApi,
  journalLevelAnalysisDeliveryErrorResponse,
} from "../../../../../src/lib/level-analysis/level-analysis-journal-delivery-api-service";
import { isLevelAnalysisDeliveryApiEnabled } from "../../../../../src/lib/level-analysis/level-analysis-journal-delivery-persistence-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!isLevelAnalysisDeliveryApiEnabled()) {
    return journalLevelAnalysisDeliveryErrorResponse(
      404,
      "feature_disabled",
      "Level analysis delivery API is disabled.",
    );
  }

  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") ?? undefined;

  return Response.json(getLatestJournalLevelAnalysisDeliveryForApi({ provider }));
}
