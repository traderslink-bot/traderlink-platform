import {
  getTradeDetailLevelFactsForApi,
  journalLevelAnalysisTradeLinkErrorResponse,
} from "../../../../../../src/lib/level-analysis/level-analysis-journal-delivery-trade-link-api-service";
import { isLevelAnalysisTradeDetailLevelFactsEnabled } from "../../../../../../src/lib/level-analysis/level-analysis-journal-delivery-trade-link-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ tradeId: string }> },
): Promise<Response> {
  if (!isLevelAnalysisTradeDetailLevelFactsEnabled()) {
    return journalLevelAnalysisTradeLinkErrorResponse(
      404,
      "feature_disabled",
      "Level analysis trade-detail facts API is disabled.",
    );
  }

  const params = await context.params;
  return Response.json(
    getTradeDetailLevelFactsForApi({
      savedTradeId: params.tradeId,
      featureEnabled: true,
    }),
  );
}
