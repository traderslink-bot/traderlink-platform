import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  deleteSavedStockLevelsMap,
  getStockLevels,
  getStockLevelsQuotaFeedback,
  listSavedStockLevelsMaps,
} from "@/src/modules/stock-levels/server/stock-levels-service";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { browserSavedStockLevelsMap, browserStockLevelsResult } from "@/src/modules/stock-levels/server/browser-stock-levels";
import { selectVerifiedScannerLevelsOperation, monitorCommittedScannerLevels } from "@/src/modules/stock-levels/server/monitor-saved-scanner-levels";
import { takeScannerLevelsEvidenceOperation } from "@/src/modules/stock-levels/server/stock-levels-runtime-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStoreHeaders = { "cache-control": "private, no-store, max-age=0" };
const unlimitedQuotaFeedback = {
  remainingHourly: null,
  remainingNewYorkDay: null,
  resetAt: null,
} as const;

function fallbackQuotaFeedback(noRequestLimit: boolean) {
  return noRequestLimit ? unlimitedQuotaFeedback : {};
}

export async function GET(request: Request): Promise<Response> {
  let identity: ReturnType<typeof requireTraderLinkPlatformRequestIdentity>;
  try {
    identity = requireTraderLinkPlatformRequestIdentity(request.headers);
  } catch {
    return Response.json({ savedMaps: [] }, { status: 503, headers: noStoreHeaders });
  }
  const noRequestLimit = hasWatchlistDashboardNavigationAccess(identity);
  try {
    return Response.json(
      {
        savedMaps: listSavedStockLevelsMaps(identity.scope).map(browserSavedStockLevelsMap),
        ...getStockLevelsQuotaFeedback(identity.scope, noRequestLimit),
      },
      { headers: noStoreHeaders },
    );
  } catch {
    return Response.json(
      { savedMaps: [], ...fallbackQuotaFeedback(noRequestLimit) },
      { status: 503, headers: noStoreHeaders },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: { symbol?: unknown; replaceSavedMapId?: unknown; profile?: unknown };
  try { body = await request.json() as { symbol?: unknown; replaceSavedMapId?: unknown; profile?: unknown }; } catch { return Response.json({ state: "unavailable", code: "invalid_symbol", message: "Enter a valid ticker." }, { status: 400, headers: noStoreHeaders }); }
  if (body.replaceSavedMapId !== undefined && (
    typeof body.replaceSavedMapId !== "string" || !isCanonicalUuidV4(body.replaceSavedMapId)
  )) {
    return Response.json({ state: "unavailable", code: "saved_map_unavailable", message: "This saved map is unavailable." }, { status: 400, headers: noStoreHeaders });
  }
  let identity: ReturnType<typeof requireTraderLinkPlatformRequestIdentity>;
  try {
    identity = requireTraderLinkPlatformRequestIdentity(request.headers);
  } catch {
    return Response.json({ state: "unavailable", code: "runtime_unavailable", message: "A reliable Stock Levels map is unavailable right now. Try again later." }, { status: 503, headers: noStoreHeaders });
  }
  const noRequestLimit = hasWatchlistDashboardNavigationAccess(identity);
  try {
    const selectedOperation = selectVerifiedScannerLevelsOperation(
      request, identity, body.symbol, body.profile, body.replaceSavedMapId,
    );
    if (selectedOperation === false) return Response.json({
      state: "unavailable", code: "runtime_unavailable", message: "A reliable Stock Levels map is unavailable right now. Try again later.",
      ...fallbackQuotaFeedback(noRequestLimit),
    }, { status: 403, headers: noStoreHeaders });
    const evidenceOperation = takeScannerLevelsEvidenceOperation(request, identity, body.symbol);
    if (evidenceOperation === false) return Response.json({
      state: "unavailable", code: "market_data_unavailable",
      message: "Data is not available for this ticker right now, try again later.",
      ...fallbackQuotaFeedback(noRequestLimit),
    }, { headers: noStoreHeaders });
    const normalOperation = evidenceOperation ? undefined : selectedOperation;
    const operation = evidenceOperation ?? normalOperation;
    const result = await getStockLevels(identity.scope, body.symbol, {
      noRequestLimit, replaceSavedMapId: body.replaceSavedMapId ?? null,
      ...(operation ? { evidenceOperation: operation } : {}),
    });
    if (normalOperation && result.state === "ready") await monitorCommittedScannerLevels(identity, result);
    return Response.json(browserStockLevelsResult(result), { headers: noStoreHeaders });
  } catch {
    return Response.json(
      {
        state: "unavailable",
        code: "runtime_unavailable",
        message: "A reliable Stock Levels map is unavailable right now. Try again later.",
        ...fallbackQuotaFeedback(noRequestLimit),
      },
      { status: 503, headers: noStoreHeaders },
    );
  }
}

export async function DELETE(request: Request): Promise<Response> {
  let body: { savedMapId?: unknown };
  try { body = await request.json() as { savedMapId?: unknown }; } catch { return Response.json({ deleted: false }, { status: 400, headers: noStoreHeaders }); }
  if (typeof body.savedMapId !== "string" || !isCanonicalUuidV4(body.savedMapId)) {
    return Response.json({ deleted: false }, { status: 400, headers: noStoreHeaders });
  }
  let identity: ReturnType<typeof requireTraderLinkPlatformRequestIdentity>;
  try {
    identity = requireTraderLinkPlatformRequestIdentity(request.headers);
  } catch {
    return Response.json({ deleted: false }, { status: 503, headers: noStoreHeaders });
  }
  const noRequestLimit = hasWatchlistDashboardNavigationAccess(identity);
  try {
    return Response.json(
      {
        deleted: deleteSavedStockLevelsMap(identity.scope, body.savedMapId),
        ...getStockLevelsQuotaFeedback(identity.scope, noRequestLimit),
      },
      { headers: noStoreHeaders },
    );
  } catch {
    return Response.json(
      { deleted: false, ...fallbackQuotaFeedback(noRequestLimit) },
      { status: 503, headers: noStoreHeaders },
    );
  }
}
