import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  requireTraderLinkPlatformRequestScope,
  requireExpectedJournalAccountSelection,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { JournalLevelAnalysisLinkRepository } from "@/src/modules/level-analysis/server/journal-level-analysis-link-repository";
import { readJournalLevelAnalysisLinkRequest } from "@/src/modules/level-analysis/server/journal-level-analysis-link-request";
import { JournalLevelAnalysisLinkService } from "@/src/modules/level-analysis/server/journal-level-analysis-link-service";
import { LevelAnalysisDeliveryRepository } from "@/src/modules/level-analysis/server/level-analysis-delivery-repository";
import {
  levelAnalysisErrorResponse,
  requireConfiguredLevelAnalysisProviders,
} from "@/src/modules/level-analysis/server/level-analysis-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const input = await readJournalLevelAnalysisLinkRequest(request);
    requireExpectedJournalAccountSelection(scope, input.expectedAccountSelectionRef);
    if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const accountScope = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);
    const providers = requireConfiguredLevelAnalysisProviders();
    const response = withReadonlyPlatformDatabase({}, (database) =>
      new JournalLevelAnalysisLinkService(
        new LevelAnalysisDeliveryRepository(database),
        new JournalLevelAnalysisLinkRepository(database),
        providers,
      ).resolve(accountScope, input));
    return Response.json(response, { status: response.status === "matched" ? 200 : 422 });
  } catch (error) {
    return levelAnalysisErrorResponse(error);
  }
}
