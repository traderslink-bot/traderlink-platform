import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformRequestScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { currentPlatformOfflineScopeRef } from "@/src/modules/platform/server/authentication/platform-offline-scope-authorization";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    return Response.json(
      {
        status: "ready",
        offlineScopeRef: currentPlatformOfflineScopeRef(scope),
        accountSelectionRef: scope.activeAccountId
          ? currentJournalAccountSelectionRef(scope)
          : null,
      },
      { headers: { "cache-control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_WORKSPACE_ACCESS_DENIED";
    return Response.json(
      { status: "unavailable", code },
      {
        headers: { "cache-control": "private, no-store, max-age=0" },
        status: 401,
      },
    );
  }
}
