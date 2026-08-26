import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  deleteSavedStockLevelsMap,
  getStockLevels,
  listSavedStockLevelsMaps,
} from "@/src/modules/stock-levels/server/stock-levels-service";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStoreHeaders = { "cache-control": "private, no-store, max-age=0" };

export async function GET(request: Request): Promise<Response> {
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    return Response.json(
      { savedMaps: listSavedStockLevelsMaps(identity.scope) },
      { headers: noStoreHeaders },
    );
  } catch {
    return Response.json({ savedMaps: [] }, { status: 503, headers: noStoreHeaders });
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: { symbol?: unknown; replaceSavedMapId?: unknown };
  try { body = await request.json() as { symbol?: unknown; replaceSavedMapId?: unknown }; } catch { return Response.json({ state: "unavailable", code: "invalid_symbol", message: "Enter a valid ticker." }, { status: 400, headers: noStoreHeaders }); }
  if (body.replaceSavedMapId !== undefined && (
    typeof body.replaceSavedMapId !== "string" || !isCanonicalUuidV4(body.replaceSavedMapId)
  )) {
    return Response.json({ state: "unavailable", code: "saved_map_unavailable", message: "This saved map is unavailable." }, { status: 400, headers: noStoreHeaders });
  }
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    return Response.json(await getStockLevels(identity.scope, body.symbol, {
      noRequestLimit: hasWatchlistDashboardNavigationAccess(identity),
      replaceSavedMapId: body.replaceSavedMapId ?? null,
    }), { headers: noStoreHeaders });
  } catch { return Response.json({ state: "unavailable", code: "runtime_unavailable", message: "A reliable Stock Levels map is unavailable right now. Try again later." }, { status: 503, headers: noStoreHeaders }); }
}

export async function DELETE(request: Request): Promise<Response> {
  let body: { savedMapId?: unknown };
  try { body = await request.json() as { savedMapId?: unknown }; } catch { return Response.json({ deleted: false }, { status: 400, headers: noStoreHeaders }); }
  if (typeof body.savedMapId !== "string" || !isCanonicalUuidV4(body.savedMapId)) {
    return Response.json({ deleted: false }, { status: 400, headers: noStoreHeaders });
  }
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    return Response.json(
      { deleted: deleteSavedStockLevelsMap(identity.scope, body.savedMapId) },
      { headers: noStoreHeaders },
    );
  } catch {
    return Response.json({ deleted: false }, { status: 503, headers: noStoreHeaders });
  }
}
