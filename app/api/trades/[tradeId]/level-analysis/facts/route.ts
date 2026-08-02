import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  isCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { JournalLevelAnalysisLinkRepository } from "@/src/modules/level-analysis/server/journal-level-analysis-link-repository";
import { JournalLevelAnalysisLinkService } from "@/src/modules/level-analysis/server/journal-level-analysis-link-service";
import { LevelAnalysisDeliveryRepository } from "@/src/modules/level-analysis/server/level-analysis-delivery-repository";
import {
  levelAnalysisErrorResponse,
  requireConfiguredLevelAnalysisProviders,
} from "@/src/modules/level-analysis/server/level-analysis-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ tradeId: string }> },
): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const { tradeId } = await context.params;
    if (!isCanonicalUuidV4(tradeId)) platformFailure("TRADERLINK_LEVEL_ANALYSIS_LINK_INVALID");
    const accountScope = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);
    const providers = requireConfiguredLevelAnalysisProviders();
    return Response.json(withReadonlyPlatformDatabase({}, (database) =>
      new JournalLevelAnalysisLinkService(
        new LevelAnalysisDeliveryRepository(database),
        new JournalLevelAnalysisLinkRepository(database),
        providers,
      ).facts(accountScope, tradeId)));
  } catch (error) {
    return levelAnalysisErrorResponse(error);
  }
}
