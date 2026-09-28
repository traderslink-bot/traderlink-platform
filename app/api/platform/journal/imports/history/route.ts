import { JournalProductReadService } from "@/src/modules/journal/server/product/journal-product-read-service";
import { membershipFeatureDeniedResponse } from "@/src/modules/platform/server/membership/platform-membership-access";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers, { membershipFeatures: ["journal.access"] });
    const accountId = scope.activeAccountId;
    if (!accountId) return Response.json({ status: "unavailable" }, { status: 403 });
    const imports = withReadonlyPlatformDatabase({}, (database) =>
      new JournalProductReadService(database).listImports({
        userId: scope.userId,
        workspaceId: scope.workspaceId,
        workspaceRole: scope.workspaceRole,
        accountId,
      }));
    return Response.json({ status: "ready", imports });
  } catch (error) {
    const membershipDenial = membershipFeatureDeniedResponse(error);
    if (membershipDenial) return membershipDenial;
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
