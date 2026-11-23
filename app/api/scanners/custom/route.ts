import { hasScannerDashboardAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { readBoundedRequestJson, RequestBodyLimitError } from "@/src/modules/platform/server/http/bounded-request-body";
import { parseScanQueries, streamCustomScans } from "@/src/modules/scanner/custom/transport";
import { parseSavedScanBook } from "@/src/modules/scanner/custom/definition";
import { readSavedCustomScans, savedCustomScansDirectory as directory, writeSavedCustomScans } from "@/src/modules/scanner/custom/saved";
import { revokeChangedScanShares } from "@/src/modules/scanner/custom/server/shared-scan-store";
import { scannerPressReleaseReader } from "@/src/modules/scanner/custom/server/press-release-reader";
import { attachScannerEvidenceReferences } from "@/src/modules/scanner/custom/server/scanner-chart-evidence";
import { refreshAcceptedScannerLevelBreaks } from "@/src/modules/scanner/custom/server/refresh-accepted-level-breaks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reply = (value: unknown, status = 200) => Response.json(value, {
  status,
  headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
});

function scannerIdentity(request: Request) {
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    return hasScannerDashboardAccess(identity) ? identity : null;
  } catch {
    return null;
  }
}

export function GET(request: Request) {
  const user = scannerIdentity(request)?.scope.userId;
  if (!user) return reply({ error: "not_found" }, 404);
  try {
    return reply(readSavedCustomScans(directory(), user));
  } catch {
    return reply({ error: "scans_unavailable" }, 503);
  }
}

export async function PUT(request: Request) {
  const user = scannerIdentity(request)?.scope.userId;
  if (!user) return reply({ error: "not_found" }, 404);
  try {
    requirePlatformMutationRequest(request);
  } catch {
    return reply({ error: "request_denied" }, 403);
  }

  let input;
  try {
    input = parseSavedScanBook(await readBoundedRequestJson(request, 128 * 1024));
  } catch (error) {
    return error instanceof RequestBodyLimitError
      ? reply({ error: "scan_book_too_large" }, 413)
      : reply({ error: "invalid_scan_book" }, 400);
  }
  try {
    const store = directory();
    revokeChangedScanShares(store, user, input);
    return reply(writeSavedCustomScans(store, user, input));
  } catch (error) {
    if (error instanceof Error && error.message === "scan_save_conflict") return reply({ error: "scan_save_conflict" }, 409);
    if (error instanceof Error && error.message === "invalid_scan_book") return reply({ error: "invalid_scan_book" }, 400);
    return reply({ error: "scan_save_failed" }, 503);
  }
}


export async function POST(request: Request) {
  const identity = scannerIdentity(request);
  if (!identity) return reply({ error: "not_found" }, 404);
  try {
    requirePlatformMutationRequest(request);
  } catch {
    return reply({ error: "request_denied" }, 403);
  }

  let queries;
  try {
    queries = parseScanQueries(await readBoundedRequestJson(request, 128 * 1024));
  } catch (error) {
    return error instanceof RequestBodyLimitError
      ? reply({ error: "scan_query_too_large" }, 413)
      : reply({ error: "invalid_scan_query" }, 400);
  }
  try {
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(60_000)]);
    const { openLiveCustomScans } = await import("@/src/modules/scanner/live/server/runtime");
    const { market, close } = openLiveCustomScans();
    const stream = streamCustomScans(market, queries, signal, () => close, scannerPressReleaseReader(identity),
      result => attachScannerEvidenceReferences(identity, result), () => refreshAcceptedScannerLevelBreaks(identity));
    return new Response(stream, { headers: {
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
      "Content-Type": "application/x-ndjson", "X-Accel-Buffering": "no",
    } });
  } catch {
    return reply({ error: "scan_unavailable" }, 503);
  }
}
