import {
  getJournalLevelAnalysisForTradeApi,
  journalLevelAnalysisTradeLinkErrorResponse,
} from "../../../../../src/lib/level-analysis/level-analysis-journal-delivery-trade-link-api-service";
import { isLevelAnalysisTradeLinkApiEnabled } from "../../../../../src/lib/level-analysis/level-analysis-journal-delivery-trade-link-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ tradeId: string }> },
): Promise<Response> {
  if (!isLevelAnalysisTradeLinkApiEnabled()) {
    return journalLevelAnalysisTradeLinkErrorResponse(
      404,
      "feature_disabled",
      "Level analysis trade-link API is disabled.",
    );
  }

  const params = await context.params;
  return Response.json(
    getJournalLevelAnalysisForTradeApi({
      savedTradeId: params.tradeId,
    }),
  );
}
