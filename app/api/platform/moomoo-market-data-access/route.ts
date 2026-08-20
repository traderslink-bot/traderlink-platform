import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { readMoomooMarketDataAccess } from "@/src/modules/level-analysis/server/moomoo-market-data-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const access = withReadonlyPlatformDatabase({}, (database) =>
      readMoomooMarketDataAccess(database, scope));
    return Response.json({
      showConnectionGuidance: access.shouldShowConnectionGuidance,
    }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ showConnectionGuidance: false }, {
      headers: { "cache-control": "no-store" },
      status: 400,
    });
  }
}
