import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { scannerAuditRecorder } from "@/src/modules/scanner/live/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function reply(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

async function handle(request: Request, operation: "read" | "set" | "delete") {
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    if (!hasWatchlistDashboardNavigationAccess(identity)) return reply({ code: "not_found" }, 404);
  } catch {
    return reply({ code: "not_found" }, 404);
  }
  if (operation !== "read") {
    try { requirePlatformMutationRequest(request); }
    catch { return reply({ code: "invalid_request" }, 403); }
  }

  let enabled: boolean | undefined;
  if (operation === "set") {
    try {
      const input = await request.json();
      if (typeof input?.enabled !== "boolean") return reply({ code: "invalid_audit_setting" }, 400);
      enabled = input.enabled;
    } catch { return reply({ code: "invalid_audit_setting" }, 400); }
  }

  try {
    const audit = scannerAuditRecorder();
    if (enabled !== undefined) await audit.setRecording(enabled);
    if (operation === "delete") await audit.deleteHistory();
    return reply(audit.recordingState());
  } catch (error) {
    if (error instanceof Error && error.message === "audit_delete_in_progress") {
      return reply({ code: "audit_delete_in_progress" }, 409);
    }
    return reply({ code: "audit_unavailable" }, 503);
  }
}

export function GET(request: Request) { return handle(request, "read"); }
export function POST(request: Request) { return handle(request, "set"); }
export function DELETE(request: Request) { return handle(request, "delete"); }
