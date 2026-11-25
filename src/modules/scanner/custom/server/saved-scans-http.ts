import "server-only";

import type { SavedScanResults } from "@/src/modules/scanner/custom/definition";
import { readWorkspaceMoomooAccess } from "@/src/modules/market-data/server/workspace-moomoo-access";
import { openWorkspaceBrokerFeed } from "@/src/modules/market-data/server/workspace-broker-feed-session";
import { brokerWorkspaceSavedResults } from "@/src/modules/market-data/workspace-broker-rows";
import { hasMarketToolsDashboardReadAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { readBoundedRequestJson, RequestBodyLimitError } from "@/src/modules/platform/server/http/bounded-request-body";
import { readSavedCustomScans, savedCustomScansDirectory, savedScanCatalogue, subscribeSavedCustomScans } from "@/src/modules/scanner/custom/saved";
import { parseSavedScanIds, streamSavedScans } from "@/src/modules/scanner/custom/transport";
import { scannerPressReleaseReader } from "@/src/modules/scanner/custom/server/press-release-reader";
import { refreshAcceptedScannerLevelBreaks } from "@/src/modules/scanner/custom/server/refresh-accepted-level-breaks";

const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const reply = (value: unknown, status = 200) => Response.json(value, { status, headers });

function marketToolsIdentity(request: Request) {
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    return hasMarketToolsDashboardReadAccess(identity) ? identity : null;
  } catch {
    return null;
  }
}

export function savedScansCatalogueResponse(request: Request, broker = false) {
  const identity = broker ? readWorkspaceMoomooAccess(request)?.identity : marketToolsIdentity(request);
  const userId = identity?.scope.userId;
  if (!userId) return reply({ error: "not_found" }, 404);
  try {
    return reply(savedScanCatalogue(readSavedCustomScans(savedCustomScansDirectory(), userId)));
  } catch {
    return reply({ error: "scans_unavailable" }, 503);
  }
}

export async function savedScansStreamResponse(request: Request, broker = false) {
  const access = broker ? readWorkspaceMoomooAccess(request) : null;
  const identity = broker ? access?.identity : marketToolsIdentity(request);
  if (!identity) return reply({ error: "not_found" }, 404);
  const { userId } = identity.scope;
  try {
    requirePlatformMutationRequest(request);
  } catch {
    return reply({ error: "request_denied" }, 403);
  }

  let ids: string[];
  try {
    ids = parseSavedScanIds(await readBoundedRequestJson(request, 4 * 1024));
  } catch (error) {
    return error instanceof RequestBodyLimitError
      ? reply({ error: "scan_query_too_large" }, 413)
      : reply({ error: "invalid_saved_scan_ids" }, 400);
  }

  let close: (() => void) | undefined;
  try {
    const directory = savedCustomScansDirectory();
    const initialBook = readSavedCustomScans(directory, userId);
    const { openLiveCustomScans } = await import("@/src/modules/scanner/live/server/runtime");
    const connection = openLiveCustomScans();
    close = connection.close;
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(60_000)]);
    let brokerFeed: ReturnType<typeof openWorkspaceBrokerFeed> | undefined;
    const projection = access ? {
      subscribe(listener: () => void) {
        brokerFeed = openWorkspaceBrokerFeed(request, access, listener);
        return brokerFeed.close;
      },
      project(publication: SavedScanResults) {
        if (!brokerFeed?.current()) throw Error("broker_connection_changed");
        const symbols = [...new Set(Object.values(publication.results).flatMap(item => item.state === "ready"
          ? item.result.rows.map(row => row.symbol) : []))];
        const session = brokerFeed.update(symbols);
        return brokerWorkspaceSavedResults(publication, brokerFeed.read, session, Date.now());
      },
    } : undefined;
    return new Response(streamSavedScans({
      market: connection.market, ids, initialBook, signal, close,
      readBook: () => (access ? brokerFeed?.current() : marketToolsIdentity(request)?.scope.userId === userId)
        ? readSavedCustomScans(directory, userId) : null,
      projection,
      subscribeBook: listener => subscribeSavedCustomScans(directory, userId, listener),
      readPress: scannerPressReleaseReader(identity),
      readLevelBreaks: () => refreshAcceptedScannerLevelBreaks(identity),
    }), { headers: { ...headers, "Content-Type": "application/x-ndjson", "X-Accel-Buffering": "no" } });
  } catch {
    close?.();
    return reply({ error: "scan_unavailable" }, 503);
  }
}
