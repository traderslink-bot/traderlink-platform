import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { requireExpectedJournalAccountSelection, requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalWorkspaceTopTickersCardPreferenceService } from "@/src/modules/journal/server/workspace/journal-workspace-top-tickers-card-preference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const HEADERS = { "cache-control": "private, no-store, max-age=0" };

export async function PUT(request: Request): Promise<Response> {
  try {
    requirePlatformMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = await request.json() as Record<string, unknown>;
    requireExpectedJournalAccountSelection(scope, body.expectedAccountSelectionRef);
    const preference = withPlatformDatabase({ mode: "runtime" }, (database) =>
      new JournalWorkspaceTopTickersCardPreferenceService(database).save(scope, {
        expectedRevision: body.expectedRevision,
        showInWorkspace: body.showInWorkspace,
      }));
    return Response.json({ preference, status: "ready" }, { headers: HEADERS });
  } catch (error) {
    return Response.json({ status: "unavailable" }, { headers: HEADERS, status: isTraderLinkPlatformError(error) ? 400 : 500 });
  }
}
