import { hasPressReleaseDashboardAccess } from "@/src/modules/news/server/press-release-dashboard-access";
import { PressReleaseDashboardRepository } from "@/src/modules/news/server/press-release-dashboard-repository";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "cache-control": "private, no-store, max-age=0" };

export function GET(request: Request): Response {
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    if (!hasPressReleaseDashboardAccess(identity)) {
      return Response.json({ status: "unavailable" }, { headers, status: 403 });
    }
    const expanded = new URL(request.url).searchParams.get("view") === "expanded";
    const articles = withReadonlyPlatformDatabase({}, (database) =>
      new PressReleaseDashboardRepository(database).list({
        channel: "news_filtered",
        limit: expanded ? 60 : 6,
        scope: identity.scope,
      }));
    return Response.json({ articles, status: "ready" }, { headers });
  } catch (error) {
    return Response.json(
      { status: "unavailable" },
      { headers, status: isTraderLinkPlatformError(error) ? 400 : 500 },
    );
  }
}
