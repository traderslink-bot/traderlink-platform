import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { loadPlatformWebPushConfiguration } from "@/src/modules/platform/server/notifications/platform-web-push-configuration";
import { MarketHaltSchedulerHealthRepository } from "@/src/modules/news/server/market-halt-scheduler-health-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = Object.freeze({ "cache-control": "private, no-store, max-age=0" });

export async function GET(request: Request): Promise<Response> {
  try {
    requireTraderLinkPlatformRequestScope(request.headers);
  } catch {
    return Response.json({ status: "unavailable" }, { headers: HEADERS, status: 401 });
  }
  try {
    loadPlatformWebPushConfiguration();
    const status = withReadonlyPlatformDatabase({}, (database) =>
      new MarketHaltSchedulerHealthRepository(database).readState(),
    );
    return Response.json({ status }, { headers: HEADERS });
  } catch {
    return Response.json({ status: "unavailable" }, { headers: HEADERS, status: 503 });
  }
}
