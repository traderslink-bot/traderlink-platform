import { hasPressReleaseDashboardAccess } from "@/src/modules/news/server/press-release-dashboard-access";
import { PressReleaseDashboardRepository } from "@/src/modules/news/server/press-release-dashboard-repository";
import { readUnreadCountsInChild } from "@/src/modules/news/server/press-release-unread-child";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "cache-control": "private, no-store, max-age=0", vary: "Cookie" };

export async function GET(request: Request): Promise<Response> {
  try {
    const identity = requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers);
    if (!hasPressReleaseDashboardAccess(identity)) return Response.json({ status: "unavailable" }, { headers, status: 403 });
    const plan = withReadonlyPlatformDatabase({}, database =>
      new PressReleaseDashboardRepository(database).unreadCountQueryPlan(identity.scope));
    const result = await readUnreadCountsInChild(resolvePlatformDatabaseConfig().databasePath, plan);
    return Response.json({ status: "ready", counts: result.counts }, {
      headers: { ...headers, "server-timing": `unread_child;dur=${result.durationMs.toFixed(1)}` },
    });
  } catch (error) {
    return Response.json({ status: "unavailable" }, {
      headers: { ...headers, "retry-after": "3" }, status: isTraderLinkPlatformError(error) ? 403 : 503,
    });
  }
}
