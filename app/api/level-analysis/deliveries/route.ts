import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { LevelAnalysisDeliveryRepository } from "@/src/modules/level-analysis/server/level-analysis-delivery-repository";
import { LevelAnalysisDeliveryService } from "@/src/modules/level-analysis/server/level-analysis-delivery-service";
import { readBoundedLevelAnalysisDeliveryPayload } from "@/src/modules/level-analysis/server/level-analysis-delivery-request";
import {
  levelAnalysisErrorResponse,
  requireConfiguredLevelAnalysisProviders,
} from "@/src/modules/level-analysis/server/level-analysis-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let database: ReturnType<typeof openPlatformDatabase> | null = null;
  try {
    requireTraderLinkPlatformRequestScope(request.headers);
    const providers = requireConfiguredLevelAnalysisProviders();
    const payload = await readBoundedLevelAnalysisDeliveryPayload(request);
    database = openPlatformDatabase({ mode: "runtime" });
    const response = new LevelAnalysisDeliveryService(
      new LevelAnalysisDeliveryRepository(database),
      providers,
    ).ingest(payload);
    return Response.json(response, { status: response.status === "accepted" ? 200 : 422 });
  } catch (error) {
    return levelAnalysisErrorResponse(error);
  } finally {
    database?.close();
  }
}
