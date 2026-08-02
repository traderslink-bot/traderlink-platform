import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  isCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { JournalLevelAnalysisLinkRepository } from "@/src/modules/level-analysis/server/journal-level-analysis-link-repository";
import {
  levelAnalysisErrorResponse,
  levelAnalysisRawDebugEnabled,
} from "@/src/modules/level-analysis/server/level-analysis-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ linkId: string }> },
): Promise<Response> {
  if (!levelAnalysisRawDebugEnabled()) {
    return Response.json({ ok: false, code: "feature_disabled" }, { status: 404 });
  }
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const { linkId } = await context.params;
    if (!isCanonicalUuidV4(linkId)) platformFailure("TRADERLINK_LEVEL_ANALYSIS_LINK_INVALID");
    const accountScope = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);
    const link = withReadonlyPlatformDatabase({}, (database) =>
      new JournalLevelAnalysisLinkRepository(database).byLinkId(accountScope, linkId));
    return link ? Response.json({ status: "found", linkId: link.linkId,
      deliveryId: link.record.deliveryId, rawPayloadHash: link.record.rawPayloadHash,
      link: link.record }) : Response.json({ status: "not_found" }, { status: 404 });
  } catch (error) {
    return levelAnalysisErrorResponse(error);
  }
}
