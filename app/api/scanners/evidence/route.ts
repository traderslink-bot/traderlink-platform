import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { resolveScannerChartEvidence } from "@/src/modules/scanner/custom/server/scanner-chart-evidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    const reference = new URL(request.url).searchParams.get("reference") ?? "";
    const result = await resolveScannerChartEvidence(identity, reference, true);
    if (result.state === "ready") return Response.json(result, { headers });
  } catch {
    // Avoid exposing entitlement, ownership or storage details.
  }
  return Response.json({ state: "unavailable" }, { status: 404, headers });
}
