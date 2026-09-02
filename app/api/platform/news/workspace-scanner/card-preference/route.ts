import { JournalWorkspacePrScannerCardPreferenceService } from "@/src/modules/journal/server/news/journal-workspace-pr-scanner-card-preference";
import { hasPressReleaseDashboardAccess } from "@/src/modules/news/server/press-release-dashboard-access";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { requireExpectedJournalAccountSelection, requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = { "cache-control": "private, no-store, max-age=0" };

export async function PUT(request: Request): Promise<Response> {
  try {
    requirePlatformMutationRequest(request);
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    if (!hasPressReleaseDashboardAccess(identity)) {
      return Response.json({ status: "unavailable" }, { headers: HEADERS, status: 403 });
    }
    const scope = identity.scope;
    const body = await request.json() as Record<string, unknown>;
    requireExpectedJournalAccountSelection(scope, body.expectedAccountSelectionRef);
    const preference = withPlatformDatabase({ mode: "runtime" }, (database) =>
      new JournalWorkspacePrScannerCardPreferenceService(database).save(scope, {
        expectedRevision: body.expectedRevision,
        showInWorkspace: body.showInWorkspace,
      }));
    return Response.json({ preference, status: "ready" }, { headers: HEADERS });
  } catch (error) {
    return Response.json({ status: "unavailable" }, { headers: HEADERS, status: isTraderLinkPlatformError(error) ? 400 : 500 });
  }
}
