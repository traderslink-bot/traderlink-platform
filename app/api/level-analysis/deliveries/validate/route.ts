import {
  journalLevelAnalysisDeliveryErrorResponse,
  readJournalLevelAnalysisDeliveryApiRequest,
  validateJournalLevelAnalysisDeliveryForApi,
} from "../../../../../src/lib/level-analysis/level-analysis-journal-delivery-api-service";
import { isLevelAnalysisDeliveryApiEnabled } from "../../../../../src/lib/level-analysis/level-analysis-journal-delivery-persistence-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (!isLevelAnalysisDeliveryApiEnabled()) {
    return journalLevelAnalysisDeliveryErrorResponse(
      404,
      "feature_disabled",
      "Level analysis delivery API is disabled.",
    );
  }

  try {
    const input = await readJournalLevelAnalysisDeliveryApiRequest(request);
    return Response.json(validateJournalLevelAnalysisDeliveryForApi(input));
  } catch (error) {
    return journalLevelAnalysisDeliveryErrorResponse(
      400,
      error instanceof Error && error.message.startsWith("Invalid JSON")
        ? "invalid_json"
        : "invalid_request",
      error instanceof Error ? error.message : String(error),
    );
  }
}
