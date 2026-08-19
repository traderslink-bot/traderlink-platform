import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { platformWebPushPublicKey } from "@/src/modules/platform/server/notifications/platform-web-push-configuration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = Object.freeze({ "cache-control": "private, no-store, max-age=0" });

export async function GET(request: Request): Promise<Response> {
  try {
    requireTraderLinkPlatformRequestScope(request.headers);
    return Response.json(
      { status: "ready", applicationServerKey: platformWebPushPublicKey() },
      { headers: HEADERS },
    );
  } catch (error) {
    const unavailable = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_WEB_PUSH_CONFIGURATION_INVALID";
    return Response.json(
      { status: "unavailable" },
      { headers: HEADERS, status: unavailable ? 503 : 401 },
    );
  }
}
