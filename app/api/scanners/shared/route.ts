import { randomUUID } from "node:crypto";
import { hasScannerDashboardAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { readBoundedRequestJson, RequestBodyLimitError } from "@/src/modules/platform/server/http/bounded-request-body";
import { SAVED_SCAN_ID } from "@/src/modules/scanner/custom/definition";
import { readSavedCustomScans, savedCustomScansDirectory, writeSavedCustomScans } from "@/src/modules/scanner/custom/saved";
import { SHARED_SCAN_ID } from "@/src/modules/scanner/custom/sharing";
import { scannerPressReleaseReader } from "@/src/modules/scanner/custom/server/press-release-reader";
import { sharedResultsWithoutFilters } from "@/src/modules/scanner/custom/server/shared-scan-results";
import { changeScanShare, parseScanShareChange, readOwnScanShare, readSharedScan } from "@/src/modules/scanner/custom/server/shared-scan-store";
import { streamCustomScans } from "@/src/modules/scanner/custom/transport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const reply = (value: unknown, status = 200) => Response.json(value, { status, headers });
const unavailable = () => reply({ error: "not_found" }, 404);

function scannerIdentity(request: Request) {
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    return hasScannerDashboardAccess(identity) ? identity : null;
  } catch {
    return null;
  }
}

function validMutation(request: Request) {
  try {
    requirePlatformMutationRequest(request);
    return true;
  } catch {
    return false;
  }
}

export function GET(request: Request) {
  const identity = scannerIdentity(request);
  if (!identity) return unavailable();
  const scanId = new URL(request.url).searchParams.get("scanId");
  if (!scanId || !SAVED_SCAN_ID.test(scanId)) return reply({ error: "invalid_share" }, 400);
  try {
    return reply({ share: readOwnScanShare(savedCustomScansDirectory(), identity.scope.userId, scanId) });
  } catch {
    return reply({ error: "share_unavailable" }, 503);
  }
}

export async function PUT(request: Request) {
  const identity = scannerIdentity(request);
  if (!identity) return unavailable();
  if (!validMutation(request)) return reply({ error: "request_denied" }, 403);
  let change;
  try {
    change = parseScanShareChange(await readBoundedRequestJson(request, 4_096));
  } catch (error) {
    return reply({ error: "invalid_share" }, error instanceof RequestBodyLimitError ? 413 : 400);
  }
  try {
    return reply({ share: changeScanShare(savedCustomScansDirectory(), identity.scope.userId, change) });
  } catch (error) {
    if (error instanceof Error && error.message === "share_conflict") return reply({ error: error.message }, 409);
    if (error instanceof Error && error.message === "scan_needs_private_levels") return reply({ error: error.message }, 422);
    return reply({ error: "share_unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  const identity = scannerIdentity(request);
  if (!identity) return unavailable();
  if (!validMutation(request)) return reply({ error: "request_denied" }, 403);
  let id: string;
  let page: number;
  try {
    const input = await readBoundedRequestJson(request, 4_096) as { id?: unknown; page?: unknown } | null;
    if (!input || typeof input.id !== "string" || !SHARED_SCAN_ID.test(input.id) ||
        typeof input.page !== "number" || !Number.isSafeInteger(input.page) || input.page < 1 || input.page > 10_000) {
      return reply({ error: "invalid_share" }, 400);
    }
    ({ id, page } = input as { id: string; page: number });
  } catch (error) {
    return reply({ error: "invalid_share" }, error instanceof RequestBodyLimitError ? 413 : 400);
  }
  let close: (() => void) | undefined;
  try {
    const directory = savedCustomScansDirectory();
    if (!readSharedScan(directory, id)) return unavailable();
    const { openLiveCustomScans } = await import("@/src/modules/scanner/live/server/runtime");
    const share = readSharedScan(directory, id);
    if (!share) return unavailable();
    const canRead = () => {
      try {
        return scannerIdentity(request)?.scope.userId === identity.scope.userId && readSharedScan(directory, id) !== null;
      } catch {
        return false;
      }
    };
    if (!canRead()) return unavailable();
    const connection = openLiveCustomScans();
    close = connection.close;
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(60_000)]);
    const stream = streamCustomScans(
      connection.market, [{ key: "shared", page, definition: share.scan.definition }], signal,
      () => connection.close, scannerPressReleaseReader(identity),
      share.grant.mode === "results" ? result => sharedResultsWithoutFilters(result, share.scan.definition) : undefined,
      undefined, canRead,
    );
    return new Response(stream, { headers: { ...headers, "Content-Type": "application/x-ndjson", "X-Accel-Buffering": "no" } });
  } catch {
    close?.();
    return reply({ error: "share_unavailable" }, 503);
  }
}

export async function PATCH(request: Request) {
  const identity = scannerIdentity(request);
  if (!identity) return unavailable();
  if (!validMutation(request)) return reply({ error: "request_denied" }, 403);
  let input: { id?: unknown; name?: unknown } | null;
  try {
    input = await readBoundedRequestJson(request, 4_096) as typeof input;
  } catch (error) {
    return reply({ error: "invalid_share" }, error instanceof RequestBodyLimitError ? 413 : 400);
  }
  if (!input || typeof input.id !== "string" || !SHARED_SCAN_ID.test(input.id) ||
    typeof input.name !== "string" || !input.name.trim() || input.name.trim().length > 70 ||
    /[\u0000-\u001f\u007f]/u.test(input.name)) return reply({ error: "invalid_share" }, 400);
  const name = input.name.trim();
  try {
    const directory = savedCustomScansDirectory();
    const share = readSharedScan(directory, input.id);
    if (share?.grant.mode !== "filters") return unavailable();
    const book = readSavedCustomScans(directory, identity.scope.userId);
    if (book.scans.some(scan => scan.name.toLowerCase() === name.toLowerCase())) {
      return reply({ error: "scan_name_in_use" }, 409);
    }
    const id = randomUUID();
    writeSavedCustomScans(directory, identity.scope.userId, {
      revision: book.revision,
      scans: [...book.scans, { id, name, definition: share.scan.definition }],
    });
    return reply({ id }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "scan_save_conflict") return reply({ error: error.message }, 409);
    return reply({ error: "share_unavailable" }, 503);
  }
}
