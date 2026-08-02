import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { LevelAnalysisDeliveryRepository } from "@/src/modules/level-analysis/server/level-analysis-delivery-repository";
import {
  levelAnalysisErrorResponse,
  levelAnalysisRawDebugEnabled,
} from "@/src/modules/level-analysis/server/level-analysis-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ deliveryId: string }> },
): Promise<Response> {
  if (!levelAnalysisRawDebugEnabled()) {
    return Response.json({ ok: false, code: "feature_disabled" }, { status: 404 });
  }
  try {
    requireTraderLinkPlatformRequestScope(request.headers);
    const { deliveryId } = await context.params;
    if (!/^(?:lad|laq)_[0-9a-f]{16}$/u.test(deliveryId)) {
      return Response.json({ ok: false, code: "invalid_delivery" }, { status: 400 });
    }
    const record = withReadonlyPlatformDatabase({}, (database) =>
      new LevelAnalysisDeliveryRepository(database).get(deliveryId));
    return record ? Response.json({ status: "found", deliveryId: record.id,
      rawPayloadHash: record.rawPayloadHash, sourceKind: record.sourceKind,
      validationStatus: record.validationStatus, rawPayload: record.rawPayload })
      : Response.json({ status: "not_found" }, { status: 404 });
  } catch (error) {
    return levelAnalysisErrorResponse(error);
  }
}
