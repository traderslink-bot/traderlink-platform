import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { createTradeExplorerPdfReport } from "@/app/(dashboard)/analytics/trade-explorer/trade-explorer-pdf-report";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function failureResponse(error: unknown): Response {
  const accessChanged = isTraderLinkPlatformError(error) && [
    "TRADERLINK_AUTH_SESSION_INVALID",
    "TRADERLINK_WORKSPACE_ACCESS_DENIED",
    "TRADERLINK_ACCOUNT_ACCESS_DENIED",
    "TRADERLINK_ACCOUNT_SELECTION_CONFLICT",
  ].includes(error.code);
  return Response.json({
    message: accessChanged
      ? "Your access or selected trading account changed. Refresh this page and try again."
      : error instanceof TypeError && error.message.startsWith("Choose one currency")
        ? error.message
        : "The PDF report could not be created. Try again.",
    refreshRequired: accessChanged,
  }, {
    status: accessChanged ? 409 : 400,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (!Number.isFinite(contentLength) || contentLength > 32_768) {
      throw new TypeError("Trade Explorer PDF report request is too large.");
    }
    const scope = await requireTraderLinkPlatformPageScope();
    const report = await createTradeExplorerPdfReport(scope, await request.json());
    return new Response(new Uint8Array(report.bytes), {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `attachment; filename="${report.filename}"`,
        "Content-Type": "application/pdf",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return failureResponse(error);
  }
}
