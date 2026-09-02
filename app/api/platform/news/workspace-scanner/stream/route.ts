import { hasPressReleaseDashboardAccess } from "@/src/modules/news/server/press-release-dashboard-access";
import { createWorkspacePrScannerStream } from "@/src/modules/news/server/workspace-pr-scanner-events";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    if (!hasPressReleaseDashboardAccess(identity)) {
      return Response.json({ status: "unavailable" }, { status: 403 });
    }
    return new Response(createWorkspacePrScannerStream(), {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream; charset=utf-8",
      },
    });
  } catch (error) {
    return Response.json(
      { status: "unavailable" },
      { status: isTraderLinkPlatformError(error) ? 400 : 500 },
    );
  }
}
