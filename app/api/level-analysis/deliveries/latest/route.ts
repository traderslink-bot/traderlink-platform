import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { LevelAnalysisDeliveryRepository } from "@/src/modules/level-analysis/server/level-analysis-delivery-repository";
import { LevelAnalysisDeliveryService } from "@/src/modules/level-analysis/server/level-analysis-delivery-service";
import {
  levelAnalysisErrorResponse,
  requireConfiguredLevelAnalysisProviders,
} from "@/src/modules/level-analysis/server/level-analysis-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    requireTraderLinkPlatformRequestScope(request.headers);
    const providers = requireConfiguredLevelAnalysisProviders();
    const provider = new URL(request.url).searchParams.get("provider") ?? undefined;
    return Response.json(withReadonlyPlatformDatabase({}, (database) =>
      new LevelAnalysisDeliveryService(
        new LevelAnalysisDeliveryRepository(database),
        providers,
      ).latest(provider)));
  } catch (error) {
    return levelAnalysisErrorResponse(error);
  }
}
