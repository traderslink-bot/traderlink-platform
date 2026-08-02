import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { LevelAnalysisDeliveryService } from "@/src/modules/level-analysis/server/level-analysis-delivery-service";
import { readBoundedLevelAnalysisDeliveryPayload } from "@/src/modules/level-analysis/server/level-analysis-delivery-request";
import {
  levelAnalysisErrorResponse,
  requireConfiguredLevelAnalysisProviders,
} from "@/src/modules/level-analysis/server/level-analysis-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    requireTraderLinkPlatformRequestScope(request.headers);
    const providers = requireConfiguredLevelAnalysisProviders();
    const payload = await readBoundedLevelAnalysisDeliveryPayload(request);
    return Response.json(new LevelAnalysisDeliveryService(null, providers).validate(payload));
  } catch (error) {
    return levelAnalysisErrorResponse(error);
  }
}
