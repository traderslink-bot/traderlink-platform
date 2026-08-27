import {
  TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT_ENV,
  hasWatchlistDashboardNavigationAccess,
} from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { recordWatchlistUsagePresence } from "@/src/modules/watchlist/server/watchlist-usage-service";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { requireTraderLinkPlatformDiscordMemberRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  isCanonicalUuidV4,
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "cache-control": "private, no-store, max-age=0" };

function isPresenceBody(value: unknown): value is Readonly<{
  presenceId: string;
  visible: boolean;
}> {
  if (!value || typeof value !== "object") return false;
  const body = value as { presenceId?: unknown; visible?: unknown };
  return typeof body.presenceId === "string" &&
    isCanonicalUuidV4(body.presenceId) &&
    typeof body.visible === "boolean";
}

export async function POST(request: Request): Promise<Response> {
  let identity: ReturnType<typeof requireTraderLinkPlatformDiscordMemberRequestIdentity>;
  try {
    requirePlatformMutationRequest(request);
    identity = requireTraderLinkPlatformDiscordMemberRequestIdentity(request.headers);
  } catch (error) {
    const rejected = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_WORKSPACE_ACCESS_DENIED";
    return new Response(null, { status: rejected ? 401 : 503, headers: noStoreHeaders });
  }
  if (process.env[TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT_ENV] === undefined) {
    return new Response(null, { status: 503, headers: noStoreHeaders });
  }
  try {
    if (hasWatchlistDashboardNavigationAccess(identity)) {
      return new Response(null, { status: 204, headers: noStoreHeaders });
    }
  } catch {
    return new Response(null, { status: 503, headers: noStoreHeaders });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400, headers: noStoreHeaders });
  }
  if (!isPresenceBody(body)) {
    return new Response(null, { status: 400, headers: noStoreHeaders });
  }
  try {
    recordWatchlistUsagePresence({
      observedAtMs: Date.now(),
      presenceId: body.presenceId,
      userId: identity.scope.userId,
      visible: body.visible,
    });
    return new Response(null, { status: 204, headers: noStoreHeaders });
  } catch {
    return new Response(null, { status: 503, headers: noStoreHeaders });
  }
}
