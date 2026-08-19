import {
  PLATFORM_OFFLINE_PROJECTION_CONTRACT_VERSION,
  normalizePlatformOfflinePathname,
  platformOfflineRouteCanStoreProjection,
  platformOfflineRouteMode,
} from "@/src/modules/platform/contracts/platform-offline-projection-contracts";
import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformRequestScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { currentPlatformOfflineScopeRef } from "@/src/modules/platform/server/authentication/platform-offline-scope-authorization";
import {
  createCanonicalUtcTimestamp,
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = Object.freeze({
  "cache-control": "private, no-store, max-age=0",
  expires: "0",
  pragma: "no-cache",
});

export async function GET(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const pathname = normalizePlatformOfflinePathname(
      new URL(request.url).searchParams.get("path") ?? "",
    );
    if (!platformOfflineRouteCanStoreProjection(pathname)) {
      return Response.json(
        { status: "online_required", pathname, routeMode: platformOfflineRouteMode(pathname) },
        { headers: PRIVATE_HEADERS, status: 409 },
      );
    }
    return Response.json(
      {
        status: "ready",
        accountSelectionRef: scope.activeAccountId
          ? currentJournalAccountSelectionRef(scope)
          : null,
        calculationVersion: "server-rendered-dashboard-facts-v1",
        contractVersion: PLATFORM_OFFLINE_PROJECTION_CONTRACT_VERSION,
        generatedAtUtc: createCanonicalUtcTimestamp(),
        offlineScopeRef: currentPlatformOfflineScopeRef(scope),
        pathname,
        routeMode: platformOfflineRouteMode(pathname),
      },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    return Response.json(
      {
        status: "unavailable",
        code: isTraderLinkPlatformError(error)
          ? error.code
          : "TRADERLINK_WORKSPACE_ACCESS_DENIED",
      },
      { headers: PRIVATE_HEADERS, status: 401 },
    );
  }
}
