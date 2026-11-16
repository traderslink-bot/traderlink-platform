import { runJournalDemoSetup } from "@/src/modules/journal/server/demo/journal-demo-setup";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Provision the separate demo without changing the selected real account. */
export async function POST(request: Request): Promise<Response> {
  const headers = { "cache-control": "no-store" };
  try {
    requireJournalMutationRequest(request);
    const after = new URL(request.url).searchParams.get("after");
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    if (scope.workspaceRole !== "owner" || !scope.activeAccountId) {
      return Response.json({ status: "unavailable" }, { status: 403, headers });
    }
    const result = await runJournalDemoSetup({ operation: "ensure", scope, after });
    if (!result) {
      return Response.json({ status: "pending" }, { status: 503, headers: { ...headers, "retry-after": "3" } });
    }
    return Response.json(result, { status: result.status === "unavailable" ? 503 : 200, headers });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 403, headers });
  }
}
