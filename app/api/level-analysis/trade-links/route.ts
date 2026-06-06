import {
  journalLevelAnalysisTradeLinkErrorResponse,
  persistJournalLevelAnalysisTradeLinkForApi,
  readJournalLevelAnalysisTradeLinkApiRequest,
} from "../../../../src/lib/level-analysis/level-analysis-journal-delivery-trade-link-api-service";
import { isLevelAnalysisTradeLinkApiEnabled } from "../../../../src/lib/level-analysis/level-analysis-journal-delivery-trade-link-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (!isLevelAnalysisTradeLinkApiEnabled()) {
    return journalLevelAnalysisTradeLinkErrorResponse(
      404,
      "feature_disabled",
      "Level analysis trade-link API is disabled.",
    );
  }

  try {
    const input = await readJournalLevelAnalysisTradeLinkApiRequest(request);
    const response = persistJournalLevelAnalysisTradeLinkForApi(input);
    return Response.json(response, {
      status: response.status === "linked" ? 200 : 422,
    });
  } catch (error) {
    return journalLevelAnalysisTradeLinkErrorResponse(
      400,
      error instanceof Error && error.message.startsWith("Invalid JSON")
        ? "invalid_json"
        : "invalid_request",
      error instanceof Error ? error.message : String(error),
    );
  }
}
