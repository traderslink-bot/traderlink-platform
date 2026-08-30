import { authorizeWatchlistRequest } from "@/src/modules/watchlist/server/access/watchlist-access-service";
import { recordWatchlistUsageVisit } from "@/src/modules/watchlist/server/watchlist-usage-service";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import {
  isCanonicalUuidV4,
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "cache-control": "private, no-store, max-age=0" };

function isUsageVisitBody(value: unknown): value is Readonly<{
  eventId: string;
  pageKind: "detail" | "index";
}> {
  if (!value || typeof value !== "object") return false;
  const body = value as { eventId?: unknown; pageKind?: unknown };
  return typeof body.eventId === "string" &&
    isCanonicalUuidV4(body.eventId) &&
    (body.pageKind === "detail" || body.pageKind === "index");
}

export async function POST(request: Request): Promise<Response> {
  try {
    requirePlatformMutationRequest(request);
  } catch (error) {
    const rejected = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_WORKSPACE_ACCESS_DENIED";
    return new Response(null, { status: rejected ? 401 : 503, headers: noStoreHeaders });
  }
  const access = await authorizeWatchlistRequest(request);
  if (!access.ok) return new Response(null, { status: access.status, headers: noStoreHeaders });
  if (access.principal.kind === "watchlist_owner") {
    return new Response(null, { status: 204, headers: noStoreHeaders });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400, headers: noStoreHeaders });
  }
  if (!isUsageVisitBody(body)) {
    return new Response(null, { status: 400, headers: noStoreHeaders });
  }
  try {
    recordWatchlistUsageVisit({
      eventId: body.eventId,
      userId: access.principal.platformUserId,
      visitedAtMs: Date.now(),
    });
    return new Response(null, { status: 204, headers: noStoreHeaders });
  } catch {
    return new Response(null, { status: 503, headers: noStoreHeaders });
  }
}
